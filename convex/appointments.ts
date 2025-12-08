/**
 * Appointments Module - Convex Backend
 * 
 * Handles appointment scheduling, retrieval, and management for SafeSpace
 * Supports filtering by status (upcoming/past/cancelled)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Transform database appointment to client format
 * Handles timezone conversion and adds computed fields
 */
function toClient(doc: any) {
  // Convert timestamps to America/Edmonton timezone
  const createdDate = new Date(doc.createdAt).toLocaleString('en-US', {
    timeZone: 'America/Edmonton',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const updatedDate = new Date(doc.updatedAt).toLocaleString('en-US', {
    timeZone: 'America/Edmonton',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return {
    id: doc._id,
    userId: doc.userId,
    supportWorker: doc.supportWorker,
    supportWorkerId: doc.supportWorkerId,
    date: doc.date,
    time: doc.time,
    duration: doc.duration || 60,
    type: doc.type,
    status: doc.status,
    meetingLink: doc.meetingLink,
    notes: doc.notes,
    specialization: doc.specialization,
    avatarUrl: doc.avatarUrl,
    cancellationReason: doc.cancellationReason,
    createdAt: createdDate,
    updatedAt: updatedDate,
  };
}

/**
 * Get all appointments for a user
 */
export const getUserAppointments = query({
	args: { 
		userId: v.string(),
		includeStatus: v.optional(v.array(v.string())),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { userId, includeStatus, limit }) => {
		let appointments = await ctx.db
			.query("appointments")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.take(limit ?? 100);

		// Filter by status if provided
		if (includeStatus && includeStatus.length > 0) {
			appointments = appointments.filter(apt => includeStatus.includes(apt.status));
		}

		// Sort by date then time
		const sorted = appointments.sort((a, b) => {
			const dateCompare = a.date.localeCompare(b.date);
			if (dateCompare !== 0) return dateCompare;
			return a.time.localeCompare(b.time);
		});

		return sorted.map(toClient);
	},
});

/**
 * Get upcoming appointments (status = 'scheduled' or 'confirmed', date >= today)
 */
export const getUpcomingAppointments = query({
	args: { 
		userId: v.string(),
		limit: v.optional(v.number())
	},
	handler: async (ctx, { userId, limit = 50 }) => {
		// Get today's date in Mountain Time (America/Denver)
		const nowMST = new Date().toLocaleString('en-US', { timeZone: 'America/Denver' });
		const mstDate = new Date(nowMST);
		const year = mstDate.getFullYear();
		const month = String(mstDate.getMonth() + 1).padStart(2, '0');
		const day = String(mstDate.getDate()).padStart(2, '0');
		const today = `${year}-${month}-${day}`; // YYYY-MM-DD in Mountain Time
		
		console.log(`🔍 getUpcomingAppointments - Today in MST: ${today}, userId: ${userId}`);
		
		// Get appointments with upcoming statuses (today or future dates)
		const appointments = await ctx.db
			.query("appointments")
			.withIndex("by_user_and_date", (q) => 
				q.eq("userId", userId).gte("date", today)
			)
			.filter((q) => 
				q.or(
					q.eq(q.field("status"), "scheduled"),
					q.eq(q.field("status"), "confirmed")
				)
			)
			.collect();

		// Sort by date then time (ascending)
		const sorted = appointments.sort((a, b) => {
			const dateCompare = a.date.localeCompare(b.date);
			if (dateCompare !== 0) return dateCompare;
			return a.time.localeCompare(b.time);
		});

		console.log(`📊 getUpcomingAppointments - Found ${sorted.length} appointments`);
		sorted.forEach(apt => console.log(`  - ${apt.date} ${apt.time} (${apt.status})`));

		return sorted.slice(0, limit).map(toClient);
	},
});

/**
 * Get past appointments (completed, cancelled, no_show, or date < today)
 * Appointments only move to past when the date has passed, not just the time
 */
export const getPastAppointments = query({
	args: { 
		userId: v.string(),
		limit: v.optional(v.number())
	},
	handler: async (ctx, { userId, limit = 50 }) => {
		// Get today's date in Mountain Time (America/Denver)
		const nowMST = new Date().toLocaleString('en-US', { timeZone: 'America/Denver' });
		const mstDate = new Date(nowMST);
		const year = mstDate.getFullYear();
		const month = String(mstDate.getMonth() + 1).padStart(2, '0');
		const day = String(mstDate.getDate()).padStart(2, '0');
		const today = `${year}-${month}-${day}`; // YYYY-MM-DD in Mountain Time
		
		// Get appointments with past dates (before today)
		const pastDates = await ctx.db
			.query("appointments")
			.withIndex("by_user_and_date", (q) => 
				q.eq("userId", userId).lt("date", today)
			)
			.collect();
		
		// Get appointments with completed/cancelled/no_show status (regardless of date)
		const completedStatuses = await ctx.db
			.query("appointments")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.filter((q) => 
				q.or(
					q.eq(q.field("status"), "completed"),
					q.eq(q.field("status"), "cancelled"),
					q.eq(q.field("status"), "no_show")
				)
			)
			.collect();
		
		// Combine and deduplicate
		const combined = [...pastDates, ...completedStatuses];
		const uniqueMap = new Map(combined.map(apt => [apt._id, apt]));
		const unique = Array.from(uniqueMap.values());
		
		// Sort by date then time (descending)
		const sorted = unique
			.sort((a, b) => {
				const dateCompare = b.date.localeCompare(a.date);
				if (dateCompare !== 0) return dateCompare;
				return b.time.localeCompare(a.time);
			})
			.slice(0, limit);

		return sorted.map(toClient);
	},
});

/**
 * Get appointment statistics
 */
export const getAppointmentStats = query({
	args: { userId: v.string() },
	handler: async (ctx, { userId }) => {
		const appointments = await ctx.db
			.query("appointments")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD
		
		const upcoming = appointments.filter(apt => 
			(apt.status === "scheduled" || apt.status === "confirmed") && 
			apt.date >= today
		);
		const completed = appointments.filter(apt => apt.status === "completed");
		const cancelled = appointments.filter(apt => apt.status === "cancelled");

		// Find next appointment
		const sortedUpcoming = upcoming.sort((a, b) => {
			const dateCompare = a.date.localeCompare(b.date);
			if (dateCompare !== 0) return dateCompare;
			return a.time.localeCompare(b.time);
		});

		return {
			upcomingCount: upcoming.length,
			completedCount: completed.length,
			cancelledCount: cancelled.length,
			nextAppointment: sortedUpcoming[0] ? toClient(sortedUpcoming[0]) : null,
		};
	},
});

/**
 * Get single appointment by ID (accepts both Convex IDs and string IDs)
 */
export const getAppointment = query({
	args: { appointmentId: v.optional(v.string()) },
	handler: async (ctx, { appointmentId }) => {
		if (!appointmentId || appointmentId === "undefined") return null;
		try {
			// Try to fetch using the ID directly - Convex handles both _id and string ID formats
			const appointment = await ctx.db.get(appointmentId as any);
			if (appointment) {
				return toClient(appointment);
			}
			return null;
		} catch (e) {
			console.log("Could not fetch appointment by ID:", appointmentId, e);
			return null;
		}
	},
});

/**
 * Create a new appointment
 */
export const createAppointment = mutation({
	args: {
		userId: v.string(), // Client's Clerk ID
		supportWorker: v.string(),
		supportWorkerId: v.optional(v.string()), // Now Clerk ID string (for web sync)
		date: v.string(), // YYYY-MM-DD
		time: v.string(), // HH:mm
		duration: v.optional(v.number()), // Duration in minutes
		type: v.string(), // 'video' | 'phone' | 'in_person'
		notes: v.optional(v.string()),
		meetingLink: v.optional(v.string()),
		specialization: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
		orgId: v.optional(v.string()), // Organization ID for sync with web
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		
		// Resolve support worker Clerk ID if not provided
		let supportWorkerClerkId = args.supportWorkerId;
		let supportWorkerAvatar = args.avatarUrl;
		
		if (!supportWorkerClerkId) {
			// Look up support worker by name
			const workers = await ctx.db
				.query("users")
				.withIndex("by_firstName", (q: any) => q.eq("firstName", args.supportWorker))
				.collect();
			if (workers.length > 0) {
				supportWorkerClerkId = workers[0].clerkId;
				supportWorkerAvatar = supportWorkerAvatar || workers[0].profileImageUrl;
			}
		}

		// Check support worker availability if we have their record
		if (supportWorkerClerkId) {
			try {
				const worker = await ctx.db
					.query("users")
					.withIndex("by_clerkId", (q: any) => q.eq("clerkId", supportWorkerClerkId))
					.first();
				
				if (worker && worker.availability) {
					const appointmentDate = new Date(args.date);
					const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
					const daySlot = worker.availability.find((slot: any) => slot.day.toLowerCase() === dayOfWeek);
					
					if (!daySlot?.enabled) {
						console.warn(`Support worker ${supportWorkerClerkId} is not available on ${dayOfWeek}`);
						// Could throw error or set status to "pending_approval" based on policy
					}
				}
			} catch (e) {
				console.log("Could not check worker availability:", e);
			}
		}
		
		const appointmentId = await ctx.db.insert("appointments", {
			// Client linking - store both userId and for web compatibility
			userId: args.userId,
			clientId: args.userId, // Also store as clientId for web compatibility
			// Support worker linking
			supportWorker: args.supportWorker,
			supportWorkerId: supportWorkerClerkId,
			avatarUrl: supportWorkerAvatar,
			// Date/time in both formats for cross-platform compatibility
			date: args.date,
			time: args.time,
			appointmentDate: args.date,
			appointmentTime: args.time,
			// Other details
			duration: args.duration || 60,
			type: args.type,
			status: "scheduled",
			notes: args.notes,
			meetingLink: args.meetingLink,
			specialization: args.specialization,
			orgId: args.orgId, // For web sync
			createdAt: now,
			updatedAt: now,
		});

		// Record activity
		await ctx.db.insert("activities", {
			userId: args.userId,
			activityType: "appointment_created",
			metadata: { appointmentId, date: args.date },
			createdAt: now,
		});

		// Create notification if user settings allow
		try {
			const settings = await ctx.db
				.query("settings")
				.withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
				.first();
			const enabled = settings?.notificationsEnabled !== false && settings?.notifAppointments !== false;
			if (enabled) {
				await ctx.db.insert("notifications", {
					userId: args.userId,
					type: "appointment",
					title: "Appointment Scheduled",
					message: `${args.supportWorker} on ${args.date} at ${args.time}`,
					isRead: false,
					createdAt: Date.now(),
				});
			}
		} catch (_e) {
			// non-blocking
		}

		return { id: appointmentId };
	},
});

/**
 * Reschedule appointment (update date/time)
 */
export const rescheduleAppointment = mutation({
	args: {
		appointmentId: v.id("appointments"),
		newDate: v.string(),
		newTime: v.string(),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, { appointmentId, newDate, newTime, reason }) => {
		const appointment = await ctx.db.get(appointmentId);
		if (!appointment) {
			throw new Error("Appointment not found");
		}
		
		const noteUpdate = reason 
			? `${appointment.notes || ''}\n\nRescheduled: ${reason}`.trim()
			: appointment.notes;
		
		await ctx.db.patch(appointmentId, {
			date: newDate,
			time: newTime,
			notes: noteUpdate,
			updatedAt: Date.now(),
		});

			// Notify user about reschedule if enabled
			try {
				const settings = await ctx.db
					.query("settings")
					.withIndex("by_userId", (q: any) => q.eq("userId", appointment.userId))
					.first();
				const enabled = settings?.notificationsEnabled !== false && settings?.notifAppointments !== false;
				if (enabled) {
					await ctx.db.insert("notifications", {
						userId: appointment.userId,
						type: "appointment",
						title: "Appointment Rescheduled",
						message: `New time: ${newDate} ${newTime}`,
						isRead: false,
						createdAt: Date.now(),
					});
				}
			} catch (_e) {
				// non-blocking
			}
		
		return { success: true };
	},
});

/**
 * Cancel appointment
 */
export const cancelAppointment = mutation({
	args: {
		appointmentId: v.id("appointments"),
		cancellationReason: v.optional(v.string()),
	},
	handler: async (ctx, { appointmentId, cancellationReason }) => {
		const appointment = await ctx.db.get(appointmentId);
		if (!appointment) {
			throw new Error("Appointment not found");
		}
		
		await ctx.db.patch(appointmentId, {
			status: "cancelled",
			cancellationReason,
			updatedAt: Date.now(),
		});

			// Notify user about cancellation if enabled
			try {
				const settings = await ctx.db
					.query("settings")
					.withIndex("by_userId", (q: any) => q.eq("userId", appointment.userId))
					.first();
				const enabled = settings?.notificationsEnabled !== false && settings?.notifAppointments !== false;
				if (enabled) {
					await ctx.db.insert("notifications", {
						userId: appointment.userId,
						type: "appointment",
						title: "Appointment Cancelled",
						message: cancellationReason || "Your appointment has been cancelled.",
						isRead: false,
						createdAt: Date.now(),
					});
				}
			} catch (_e) {
				// non-blocking
			}
		
		return { success: true };
	},
});

/**
 * Update appointment status
 */
export const updateAppointmentStatus = mutation({
	args: {
		appointmentId: v.id("appointments"),
		status: v.string(), // 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
	},
	handler: async (ctx, { appointmentId, status }) => {
			await ctx.db.patch(appointmentId, {
			status,
			updatedAt: Date.now(),
		});

			// Notify on key status changes if enabled
			try {
				const appointment = await ctx.db.get(appointmentId);
				if (appointment) {
					const settings = await ctx.db
						.query("settings")
						.withIndex("by_userId", (q: any) => q.eq("userId", appointment.userId))
						.first();
					const enabled = settings?.notificationsEnabled !== false && settings?.notifAppointments !== false;
					if (enabled && (status === 'confirmed' || status === 'completed')) {
						const title = status === 'confirmed' ? 'Appointment Confirmed' : 'Appointment Completed';
						await ctx.db.insert("notifications", {
							userId: appointment.userId,
							type: "appointment",
							title,
							message: `${appointment.date} ${appointment.time}`,
							isRead: false,
							createdAt: Date.now(),
						});
					}
				}
			} catch (_e) {
				// non-blocking
			}

		return { success: true };
	},
});

/**
 * Delete an appointment (soft delete by setting status to 'cancelled')
 */
export const deleteAppointment = mutation({
	args: {
		appointmentId: v.id("appointments"),
	},
	handler: async (ctx, { appointmentId }) => {
		await ctx.db.patch(appointmentId, {
			status: "cancelled",
			cancellationReason: "Deleted by user",
			updatedAt: Date.now(),
		});
		
		return { success: true };
	},
});
