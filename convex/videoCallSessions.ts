import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Start a new video call session
 * Called when user joins the pre-call screen
 */
export const startSession = mutation({
  args: {
    appointmentId: v.optional(v.id("appointments")),
    supportWorkerName: v.string(),
    supportWorkerId: v.optional(v.string()),
    audioOption: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const now = Date.now();
    
    const sessionId = await ctx.db.insert("videoCallSessions", {
      appointmentId: args.appointmentId,
      userId,
      supportWorkerName: args.supportWorkerName,
      supportWorkerId: args.supportWorkerId,
      sessionStatus: "connecting",
      joinedAt: now,
      audioOption: args.audioOption || "phone",
      cameraEnabled: true,
      micEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    return { sessionId };
  },
});

/**
 * Update session when call connects
 */
export const markConnected = mutation({
  args: {
    sessionId: v.id("videoCallSessions"),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const now = Date.now();
    await ctx.db.patch(args.sessionId, {
      sessionStatus: "connected",
      connectedAt: now,
      updatedAt: now,
    });

    return { ok: true };
  },
});

/**
 * End a video call session
 */
export const endSession = mutation({
  args: {
    sessionId: v.id("videoCallSessions"),
    endReason: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const now = Date.now();
    const duration = session.connectedAt 
      ? Math.floor((now - session.connectedAt) / 1000) 
      : 0;

    await ctx.db.patch(args.sessionId, {
      sessionStatus: "ended",
      endedAt: now,
      duration,
      endReason: args.endReason || "user_left",
      updatedAt: now,
    });

    // If linked to appointment, conditionally update appointment status to completed
    if (session.appointmentId) {
      try {
        const apt = await ctx.db.get(session.appointmentId);
        if (apt && typeof apt.date === 'string' && typeof apt.time === 'string') {
          // Get current time in Mountain Time components
          const nowStr = new Date().toLocaleString('en-US', { timeZone: 'America/Denver' });
          const nowMST = new Date(nowStr);
          const ny = nowMST.getFullYear();
          const nm = nowMST.getMonth() + 1;
          const nd = nowMST.getDate();
          const nh = nowMST.getHours();
          const nmin = nowMST.getMinutes();

          // Parse appointment scheduled time components (YYYY-MM-DD and HH:mm)
          const dateParts = (apt.date as string).split('-').map((n: string) => parseInt(n, 10));
          const timeParts = (apt.time as string).split(':').map((n: string) => parseInt(n, 10));
          const y = dateParts[0];
          const m = dateParts[1];
          const d = dateParts[2];
          const hh = timeParts[0];
          const mm = timeParts[1];
          
          // Skip if any component is missing
          if (!y || !m || !d || hh === undefined || mm === undefined) return;

          const schedMinutes = y * 525600 + m * 43800 + d * 1440 + hh * 60 + mm;
          const nowMinutes = ny * 525600 + nm * 43800 + nd * 1440 + nh * 60 + nmin;

          // Only mark completed if the session ended at or after the scheduled start,
          // and the connected duration was at least 60 seconds
          if (nowMinutes >= schedMinutes && duration >= 60) {
            await ctx.db.patch(session.appointmentId, {
              status: "completed",
              updatedAt: now,
            });
          }
        }
      } catch (_e) {
        // non-blocking safeguard
      }
    }

    return { ok: true, duration };
  },
});

/**
 * Update session settings (camera, mic, etc.)
 */
export const updateSessionSettings = mutation({
  args: {
    sessionId: v.id("videoCallSessions"),
    cameraEnabled: v.optional(v.boolean()),
    micEnabled: v.optional(v.boolean()),
    audioOption: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.cameraEnabled !== undefined) updates.cameraEnabled = args.cameraEnabled;
    if (args.micEnabled !== undefined) updates.micEnabled = args.micEnabled;
    if (args.audioOption !== undefined) updates.audioOption = args.audioOption;

    await ctx.db.patch(args.sessionId, updates);

    return { ok: true };
  },
});

/**
 * Report quality issues during a call
 */
export const reportQualityIssue = mutation({
  args: {
    sessionId: v.id("videoCallSessions"),
    issue: v.string(),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const issues = session.qualityIssues || [];
    issues.push(args.issue);

    await ctx.db.patch(args.sessionId, {
      qualityIssues: issues,
      updatedAt: Date.now(),
    });

    // Also log to activities for visibility by admins/support
    await ctx.db.insert("activities", {
      userId,
      activityType: "video_issue",
      metadata: { sessionId: args.sessionId, issue: args.issue },
      createdAt: Date.now(),
    });

    // Fire-and-forget: email the issue to configured inbox
    try {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", userId))
        .first();

      const to = process.env.ISSUE_ALERT_EMAIL || "safespace.dev.app@gmail.com";
      const subject = `[SafeSpace] Video call issue reported`;
      const reporter = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Unknown User";
      const email = user?.email || "N/A";
      
      // Calculate call duration if session is connected
      const callDuration = session.connectedAt 
        ? Math.floor((Date.now() - session.connectedAt) / 1000)
        : 0;
      const durationStr = callDuration > 0 
        ? `${String(Math.floor(callDuration / 60)).padStart(2, '0')}:${String(callDuration % 60).padStart(2, '0')}`
        : "00:00";

      // Parse issue type from the issue string (first line or default)
      const issueType = args.issue.trim().split('\n')[0] || "Quality Issue";
      const hasDescription = args.issue.trim().length > 0;
      const userDescription = hasDescription ? args.issue : "No additional description provided";
      const descriptionClass = hasDescription ? "" : "empty-description";
      
      // Determine session type
      const sessionType = session.supportWorkerName 
        ? "Support Worker Call"
        : session.audioOption === "internet" 
          ? "Video Consultation" 
          : "Phone Consultation";
      
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Admin dashboard URL (customize as needed)
      const viewDetailsUrl = process.env.ADMIN_DASHBOARD_URL 
        ? `${process.env.ADMIN_DASHBOARD_URL}/sessions/${args.sessionId}`
        : "#";

      // Plain text fallback
      const text = [
        "A video call quality issue was reported.",
        `User: ${reporter} <${email}>`,
        `User ID: ${userId}`,
        `Session: ${args.sessionId}`,
        `Issue Type: ${issueType}`,
        `Call Duration: ${durationStr}`,
        `Session Type: ${sessionType}`,
        `Reported At: ${timestamp}`,
        "",
        "User Description:",
        userDescription,
      ].join("\n");

      // HTML email with template
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Safespace Video - Report Quality Issue</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 16px;
            color: #333333;
            margin-bottom: 20px;
        }
        .issue-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .issue-box h2 {
            margin: 0 0 10px 0;
            color: #856404;
            font-size: 18px;
        }
        .issue-box p {
            margin: 0;
            color: #856404;
            line-height: 1.6;
        }
        .issue-tag {
            display: inline-block;
            background-color: #856404;
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 10px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .details h3 {
            margin: 0 0 15px 0;
            color: #333333;
            font-size: 16px;
        }
        .detail-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #666666;
            width: 140px;
            flex-shrink: 0;
        }
        .detail-value {
            color: #333333;
        }
        .description-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 3px solid #667eea;
        }
        .description-box h3 {
            margin: 0 0 10px 0;
            color: #333333;
            font-size: 16px;
        }
        .description-box p {
            color: #666666;
            line-height: 1.6;
            margin: 0;
            font-style: italic;
            white-space: pre-wrap;
        }
        .empty-description {
            color: #999999;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666666;
            font-size: 14px;
            line-height: 1.6;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 30px 20px;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                width: 100%;
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎥 Safespace Video</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Hello Team,</p>
            
            <p style="color: #333333; line-height: 1.6; margin-bottom: 20px;">
                A user has reported a quality issue during their video call session. The details are provided below for your review and action.
            </p>
            
            <div class="issue-box">
                <h2>⚠️ Quality Issue Reported</h2>
                <p>A quality issue has been reported during a video call session.</p>
                <span class="issue-tag">${issueType}</span>
            </div>
            
            <div class="details">
                <h3>Session Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Issue Type:</span>
                    <span class="detail-value">${issueType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Call Duration:</span>
                    <span class="detail-value">${durationStr}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Session Type:</span>
                    <span class="detail-value">${sessionType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reported At:</span>
                    <span class="detail-value">${timestamp}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">User:</span>
                    <span class="detail-value">${reporter} &lt;${email}&gt;</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">User ID:</span>
                    <span class="detail-value">${userId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Session ID:</span>
                    <span class="detail-value">${args.sessionId}</span>
                </div>
            </div>
            
            <div class="description-box">
                <h3>User Description</h3>
                <p class="${descriptionClass}">${userDescription}</p>
            </div>
            
            
            <p style="color: #666666; font-size: 14px; margin-top: 30px; line-height: 1.6;">
                This report was automatically generated from the Safespace Video mobile app. For technical support or questions, please contact the development team.
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <strong>Safespace Video</strong><br>
                Quality Assurance Team
            </p>
            <p style="margin: 10px 0; color: #999999; font-size: 12px;">
                © 2025 Safespace Video. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;

      const emailResult = await ctx.scheduler.runAfter(0, internal.email.sendIssueEmail, {
        to,
        subject,
        text,
        html,
      });
      console.log("📧 Email scheduled for quality issue report to:", to);
    } catch (err) {
      console.error("❌ Issue email dispatch failed:", err);
    }

    return { ok: true };
  },
});

/**
 * Get user's video call history
 */
export const getUserSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const limit = args.limit ?? 20;

    const sessions = await ctx.db
      .query("videoCallSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return sessions;
  },
});

/**
 * Get call analytics/statistics
 */
export const getCallStats = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const sessions = await ctx.db
      .query("videoCallSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const completedSessions = sessions.filter((s: any) => s.sessionStatus === "ended" && s.duration);
    const totalDuration = completedSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
    const avgDuration = completedSessions.length > 0 
      ? totalDuration / completedSessions.length 
      : 0;

    const failedSessions = sessions.filter((s: any) => s.sessionStatus === "failed");
    const qualityIssuesCount = sessions.reduce((sum: number, s: any) => 
      sum + (s.qualityIssues?.length || 0), 0
    );

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      failedSessions: failedSessions.length,
      totalDuration, // in seconds
      avgDuration, // in seconds
      qualityIssuesCount,
    };
  },
});

/**
 * Get active session for current user
 */
export const getActiveSession = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject as string;

    // Find the most recent session that's not ended
    const activeSessions = await ctx.db
      .query("videoCallSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(5);

    const active = activeSessions.find(
      (s: any) => s.sessionStatus === "connecting" || s.sessionStatus === "connected"
    );

    return active || null;
  },
});

/**
 * Prune stale sessions for the current user
 * - Ends sessions stuck in 'connecting' beyond a grace period
 * - Ends 'connected' sessions with no activity for a while (based on updatedAt)
 */
export const pruneStaleSessions = mutation({
  args: {
    maxConnectingAgeMs: v.optional(v.number()),
    maxInactiveAgeMs: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const now = Date.now();
    const maxConnectingAge = args.maxConnectingAgeMs ?? 5 * 60 * 1000; // 5 minutes
    const maxInactiveAge = args.maxInactiveAgeMs ?? 10 * 60 * 1000; // 10 minutes

    const recent = await ctx.db
      .query("videoCallSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    let ended = 0;
    for (const s of recent) {
      if (s.sessionStatus === "ended") continue;
      const ageSinceJoin = now - (s.joinedAt ?? 0);
      const ageSinceUpdate = now - (s.updatedAt ?? s.joinedAt ?? 0);

      const shouldEndConnecting = s.sessionStatus === "connecting" && ageSinceJoin > maxConnectingAge;
      const shouldEndInactive = s.sessionStatus === "connected" && ageSinceUpdate > maxInactiveAge;

      if (shouldEndConnecting || shouldEndInactive) {
        await ctx.db.patch(s._id, {
          sessionStatus: "ended",
          endedAt: now,
          duration: s.connectedAt ? Math.floor((now - s.connectedAt) / 1000) : 0,
          endReason: shouldEndConnecting ? "stale_connecting_timeout" : "inactive_timeout",
          updatedAt: now,
        });
        ended += 1;
      }
    }

    return { ended };
  },
});
