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
			.withIndex("by_user", (q) => q.eq("userId", userId))
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
		const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD
		
		// Get appointments with upcoming statuses
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
			.take(limit);

		// Sort by date then time (ascending)
		const sorted = appointments.sort((a, b) => {
			const dateCompare = a.date.localeCompare(b.date);
			if (dateCompare !== 0) return dateCompare;
			return a.time.localeCompare(b.time);
		});

		return sorted.map(toClient);
	},
});

/**
 * Get past appointments (completed, cancelled, no_show, or date < today)
 */
export const getPastAppointments = query({
	args: { 
		userId: v.string(),
		limit: v.optional(v.number())
	},
	handler: async (ctx, { userId, limit = 50 }) => {
		const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD
		
		// Get appointments with past dates
		const pastDates = await ctx.db
			.query("appointments")
			.withIndex("by_user_and_date", (q) => 
				q.eq("userId", userId).lt("date", today)
			)
			.collect();
		
		// Get appointments with completed/cancelled/no_show status
		const completedStatuses = await ctx.db
			.query("appointments")
			.withIndex("by_user", (q) => q.eq("userId", userId))
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
			.withIndex("by_user", (q) => q.eq("userId", userId))
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
 * Get single appointment by ID
 */
export const getAppointment = query({
	args: { appointmentId: v.id("appointments") },
	handler: async (ctx, { appointmentId }) => {
		const appointment = await ctx.db.get(appointmentId);
		if (!appointment) return null;
		return toClient(appointment);
	},
});

/**
 * Create a new appointment
 */
export const createAppointment = mutation({
	args: {
		userId: v.string(),
		supportWorker: v.string(),
		supportWorkerId: v.optional(v.number()),
		date: v.string(), // YYYY-MM-DD
		time: v.string(), // HH:mm
		duration: v.optional(v.number()), // Duration in minutes
		type: v.string(), // 'video' | 'phone' | 'in_person'
		notes: v.optional(v.string()),
		meetingLink: v.optional(v.string()),
		specialization: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		
		const appointmentId = await ctx.db.insert("appointments", {
			userId: args.userId,
			supportWorker: args.supportWorker,
			supportWorkerId: args.supportWorkerId,
			date: args.date,
			time: args.time,
			duration: args.duration || 60,
			type: args.type,
			status: "scheduled",
			notes: args.notes,
			meetingLink: args.meetingLink,
			specialization: args.specialization,
			avatarUrl: args.avatarUrl,
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
