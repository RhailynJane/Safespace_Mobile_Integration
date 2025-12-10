import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Convex notifications module
 * Provides real-time notification management with live subscriptions
 */

// Type mapping for notification types
type NotificationType = "message" | "appointment" | "system" | "reminder" | "mood" | "journaling" | "post_reactions" | "self_assessment";

/**
 * Transform DB notification to client shape
 */
function toClient(doc: any) {
	return {
		id: doc._id,
		type: doc.type as NotificationType,
		title: doc.title,
		message: doc.message,
		isRead: doc.isRead,
		is_read: doc.isRead, // REST compatibility
		created_at: new Date(doc.createdAt).toISOString(),
		time: new Date(doc.createdAt).toLocaleString('en-US', {
			timeZone: 'America/Edmonton', // APP_TIME_ZONE
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true
		}),
	};
}

/**
 * Get all notifications for a user (ordered by newest first)
 * @param userId - Clerk user ID
 * @param limit - Max number of notifications to return (default 200)
 */
export const getNotifications = query({
	args: {
		userId: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { userId, limit = 200 }) => {
		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.order("desc")
			.take(limit);

		return {
			notifications: notifications.map(toClient),
		};
	},
});

/**
 * Get unread notification count for a user
 * @param userId - Clerk user ID
 */
export const getUnreadCount = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const unreadNotifications = await ctx.db
			.query("notifications")
			.withIndex("by_user_and_read", (q) => q.eq("userId", userId).eq("isRead", false))
			.collect();

		return {
			count: unreadNotifications.length,
		};
	},
});

/**
 * Create a new notification
 * @param userId - Clerk user ID
 * @param type - Notification type
 * @param title - Notification title
 * @param message - Notification message
 */
export const createNotification = mutation({
	args: {
		userId: v.string(),
		type: v.string(),
		title: v.string(),
		message: v.string(),
	},
	handler: async (ctx, { userId, type, title, message }) => {
		const notificationId = await ctx.db.insert("notifications", {
			userId,
			type,
			title,
			message,
			isRead: false,
			createdAt: Date.now(),
		});

		return { id: notificationId };
	},
});

/**
 * Mark a single notification as read
 * @param notificationId - Notification ID to mark as read
 */
export const markAsRead = mutation({
	args: {
		notificationId: v.id("notifications"),
	},
	handler: async (ctx, { notificationId }) => {
		await ctx.db.patch(notificationId, {
			isRead: true,
		});

		return { success: true };
	},
});

/**
 * Mark all notifications as read for a user
 * @param userId - Clerk user ID
 */
export const markAllAsRead = mutation({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const unreadNotifications = await ctx.db
			.query("notifications")
			.withIndex("by_user_and_read", (q) => q.eq("userId", userId).eq("isRead", false))
			.collect();

		// Mark all as read
		await Promise.all(
			unreadNotifications.map((notification) =>
				ctx.db.patch(notification._id, { isRead: true })
			)
		);

		return { success: true, count: unreadNotifications.length };
	},
});

/**
 * Clear all notifications for a user
 * @param userId - Clerk user ID
 */
export const clearAll = mutation({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const userNotifications = await ctx.db
			.query("notifications")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		// Delete all notifications
		await Promise.all(
			userNotifications.map((notification) =>
				ctx.db.delete(notification._id)
			)
		);

		return { success: true, count: userNotifications.length };
	},
});

/**
 * Delete a single notification
 * @param notificationId - Notification ID to delete
 */
export const deleteNotification = mutation({
	args: {
		notificationId: v.id("notifications"),
	},
	handler: async (ctx, { notificationId }) => {
		await ctx.db.delete(notificationId);

		return { success: true };
	},
});
