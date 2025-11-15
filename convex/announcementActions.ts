import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
