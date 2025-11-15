import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function toClient(doc: any) {
  return {
    id: doc._id,
    orgId: doc.orgId,
    title: doc.title,
    body: doc.body,
    visibility: doc.visibility ?? "org",
    active: doc.active,
    readBy: doc.readBy ?? [],
    created_at: new Date(doc.createdAt).toISOString(),
    time: new Date(doc.createdAt).toLocaleString("en-US", {
      timeZone: "America/Edmonton", // APP_TIME_ZONE
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  };
}

export const listByOrg = query({
  args: {
    orgId: v.string(),
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { orgId, activeOnly = true, limit = 100 }) => {
    const q = ctx.db
      .query("announcements")
      .withIndex("by_org_created", (q) => q.eq("orgId", orgId))
      .order("desc");

    const items = await q.take(limit);
    const filtered = activeOnly ? items.filter((a) => a.active) : items;
    return { announcements: filtered.map(toClient) };
  },
});

export const getAnnouncement = query({
  args: { id: v.id("announcements") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id);
    if (!doc) return null;
    return toClient(doc);
  },
});

// Admin-only using allowlist from env var ADMIN_USER_IDS (CSV of Clerk IDs)
function isAdminSubject(subject?: string | null) {
  if (!subject) return false;
  const csv = (process.env.ADMIN_USER_IDS || "").trim();
  if (!csv) return false;
  const set = new Set(csv.split(",").map((s: string) => s.trim()).filter(Boolean));
  return set.has(subject);
}

export const createAnnouncement = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
    body: v.string(),
    visibility: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, { orgId, title, body, visibility = "org", active = true }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !isAdminSubject(identity.subject)) {
      throw new Error("Not authorized to create announcements");
    }

    const now = Date.now();
    const id = await ctx.db.insert("announcements", {
      orgId,
      title,
      body,
      visibility,
      active,
      createdAt: now,
      updatedAt: now,
      authorId: identity.subject,
      readBy: [],
    });

    // Fan-out notifications to users in this organization
    const usersInOrg = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    await Promise.all(
      usersInOrg.map((u) =>
        ctx.db.insert("notifications", {
          userId: u.clerkId,
          type: "system",
          title: `New Announcement: ${title}`,
          message: body,
          isRead: false,
          createdAt: now,
        })
      )
    );

    return { id, notified: usersInOrg.length };
  },
});

// Development helper: seed two CMHA announcements if none exist for org
export const seedSampleAnnouncements = mutation({
  args: {
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, { orgId = "cmha-calgary" }) => {
    const existing = await ctx.db
      .query("announcements")
      .withIndex("by_org_created", (q) => q.eq("orgId", orgId))
      .take(1);

    if (existing.length > 0) {
      return { created: 0, notified: 0 };
    }

    const now = Date.now();

    const isSAIT = orgId === "sait";
    const samples = isSAIT
      ? [
          {
            title: "SAIT Wellness Week: Campus Mental Health Events",
            body:
              "SAIT Wellness Week — Join a range of events including stress reduction workshops, peer meetups, and campus wellbeing sessions. Open to all SAIT students and staff. Location: SAIT Campus, multiple buildings. Dates: Nov 18-22, 2025.",
          },
          {
            title: "SAIT: New Student Peer Support Circles",
            body:
              "We're launching peer support circles dedicated to student wellbeing starting December 1st. These small group sessions are run by trained peers and are open to all SAIT students. Register via the SAIT Student Services portal.",
          },
          {
            title: "SAIT Campus Wellness Initiative - Resilience and Community",
            body:
              "SAIT is proud to roll out a campus-wide Wellness Initiative featuring drop-in counselling, mindfulness classes, and academic resilience workshops. Programs will run January through June 2026. Free for SAIT students. Visit studentservices.sait.ca for registration and schedules.",
          },
        ]
      : [
          {
            title: "CMHA Calgary: Mental Health Awareness Week",
            body:
              "Join us for Mental Health Awareness Week featuring daily workshops, peer support sessions, and wellness activities. Free for all members. Location: CMHA Calgary Office, 1101 5 St SW. Dates: Nov 18-22, 2025.",
          },
          {
            title: "CMHA Calgary: New Peer Support Program Launch",
            body:
              "We're excited to announce our new peer support program starting December 1st! Connect with others who understand your journey. Virtual and in-person options available. Register now through our website or contact us at info@calgary.cmha.ca.",
          },
          {
            title: "CMHA Calgary: Community Wellness Initiative - Building Resilience Together",
            body:
              "We are thrilled to introduce our new Community Wellness Initiative, a comprehensive program designed to support mental health and well-being across Calgary. This initiative includes monthly support group meetings, one-on-one counseling sessions with certified mental health professionals, mindfulness and meditation workshops, art therapy classes, and family support programs. All services are offered on a sliding scale fee basis to ensure accessibility for everyone in our community. Special sessions will be held for youth (ages 13-18), young adults (19-29), and seniors (65+). The program runs from January through June 2026, with registration opening December 1st. Early bird discounts available for those who register before December 15th. For more information, visit our website at calgary.cmha.ca/wellness or call our community helpline at 403-297-1700. Together, we can build a stronger, more resilient community where mental health is a priority for all.",
          },
        ];

    for (const s of samples) {
      await ctx.db.insert("announcements", {
        orgId,
        title: s.title,
        body: s.body,
        visibility: "org",
        active: true,
        createdAt: now,
        updatedAt: now,
        readBy: [],
      });
    }

    // Notify all users in org about new announcements
    const usersInOrg = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    await Promise.all(
      usersInOrg.flatMap((u) =>
        samples.map((s: { title: string; body: string }) =>
          ctx.db.insert("notifications", {
            userId: u.clerkId,
            type: "system",
            title: `New Announcement: ${s.title}`,
            message: s.body,
            isRead: false,
            createdAt: now,
          })
        )
      )
    );

    return { created: samples.length, notified: usersInOrg.length };
  },
});

export const clearAndReseed = mutation({
  args: {
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, { orgId = "cmha-calgary" }) => {
    // Delete all existing announcements for this org
    const existing = await ctx.db
      .query("announcements")
      .withIndex("by_org_created", (q) => q.eq("orgId", orgId))
      .collect();

    await Promise.all(existing.map((a) => ctx.db.delete(a._id)));

    const now = Date.now();

    const isSAIT = orgId === "sait";
    const samples = isSAIT
      ? [
          {
            title: "SAIT Wellness Week: Campus Mental Health Events",
            body:
              "SAIT Wellness Week — Join a range of events including stress reduction workshops, peer meetups, and campus wellbeing sessions. Open to all SAIT students and staff. Location: SAIT Campus, multiple buildings. Dates: Nov 18-22, 2025.",
          },
          {
            title: "SAIT: New Student Peer Support Circles",
            body:
              "We're launching peer support circles dedicated to student wellbeing starting December 1st. These small group sessions are run by trained peers and are open to all SAIT students. Register via the SAIT Student Services portal.",
          },
          {
            title: "SAIT Campus Wellness Initiative - Resilience and Community",
            body:
              "SAIT is proud to roll out a campus-wide Wellness Initiative featuring drop-in counselling, mindfulness classes, and academic resilience workshops. Programs will run January through June 2026. Free for SAIT students. Visit studentservices.sait.ca for registration and schedules.",
          },
        ]
      : [
      {
        title: "CMHA Calgary: Mental Health Awareness Week",
        body:
          "Join us for Mental Health Awareness Week featuring daily workshops, peer support sessions, and wellness activities. Free for all members. Location: CMHA Calgary Office, 1101 5 St SW. Dates: Nov 18-22, 2025.",
      },
      {
        title: "CMHA Calgary: New Peer Support Program Launch",
        body:
          "We're excited to announce our new peer support program starting December 1st! Connect with others who understand your journey. Virtual and in-person options available. Register now through our website or contact us at info@calgary.cmha.ca.",
      },
      {
        title: "CMHA Calgary: Community Wellness Initiative - Building Resilience Together",
        body:
          "We are thrilled to introduce our new Community Wellness Initiative, a comprehensive program designed to support mental health and well-being across Calgary. This initiative includes monthly support group meetings, one-on-one counseling sessions with certified mental health professionals, mindfulness and meditation workshops, art therapy classes, and family support programs. All services are offered on a sliding scale fee basis to ensure accessibility for everyone in our community. Special sessions will be held for youth (ages 13-18), young adults (19-29), and seniors (65+). The program runs from January through June 2026, with registration opening December 1st. Early bird discounts available for those who register before December 15th. For more information, visit our website at calgary.cmha.ca/wellness or call our community helpline at 403-297-1700. Together, we can build a stronger, more resilient community where mental health is a priority for all.",
      },
    ];

    for (const s of samples) {
      await ctx.db.insert("announcements", {
        orgId,
        title: s.title,
        body: s.body,
        visibility: "org",
        active: true,
        createdAt: now,
        updatedAt: now,
        readBy: [],
      });
    }

    // Notify all users in org about new announcements
    const usersInOrg = await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    await Promise.all(
      usersInOrg.flatMap((u) =>
        samples.map((s: { title: string; body: string }) =>
          ctx.db.insert("notifications", {
            userId: u.clerkId,
            type: "system",
            title: `New Announcement: ${s.title}`,
            message: s.body,
            isRead: false,
            createdAt: now,
          })
        )
      )
    );

    return { deleted: existing.length, created: samples.length, notified: usersInOrg.length };
  },
});

export const markAsRead = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");

    const readBy = announcement.readBy ?? [];
    if (!readBy.includes(identity.subject)) {
      await ctx.db.patch(announcementId, {
        readBy: [...readBy, identity.subject],
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
