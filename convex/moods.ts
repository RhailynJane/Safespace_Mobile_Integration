import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mapping helpers for UI expectations - Extended mood grid
const moodMeta: Record<string, { emoji: string; label: string }> = {
	// Original 5 canonical types
	"very-happy": { emoji: "😄", label: "Very Happy" },
	happy: { emoji: "🙂", label: "Happy" },
	neutral: { emoji: "😐", label: "Neutral" },
	sad: { emoji: "🙁", label: "Sad" },
	"very-sad": { emoji: "😢", label: "Very Sad" },
	// New 3x3 mood grid
	ecstatic: { emoji: "🤩", label: "Ecstatic" },
	// Use a distinct emoji for 'content' so it doesn't render as 'happy' in UIs doing emoji-based reverse mapping.
	content: { emoji: "😊", label: "Content" },
	displeased: { emoji: "😕", label: "Displeased" },
	frustrated: { emoji: "😖", label: "Frustrated" },
	annoyed: { emoji: "😒", label: "Annoyed" },
	angry: { emoji: "😠", label: "Angry" },
	furious: { emoji: "🤬", label: "Furious" },
};

function toClient(doc: any) {
	return {
		id: doc._id,
		mood_type: doc.moodType,
		intensity: doc.intensity ?? 3,
		notes: doc.notes,
		created_at: new Date(doc.createdAt).toISOString(),
		mood_emoji: doc.moodEmoji || moodMeta[doc.moodType]?.emoji || "😐",
		mood_label: doc.moodLabel || moodMeta[doc.moodType]?.label || "Neutral",
		mood_factors: (doc.factors || []).map((f: string) => ({ factor: f })),
	};
}

/** Get recent mood entries (limit default 10) */
export const getRecentMoods = query({
	args: { userId: v.string(), limit: v.optional(v.number()) },
	handler: async (ctx, { userId, limit = 10 }) => {
		const moods = await ctx.db
			.query("moods")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.order("desc")
			.take(limit);
		return moods.map(toClient);
	},
});

/** Get mood statistics (distribution + average) */
export const getMoodStats = query({
	args: { userId: v.string(), days: v.optional(v.number()) },
	handler: async (ctx, { userId, days = 7 }) => {
		const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
		const moods = await ctx.db
			.query("moods")
			.withIndex("by_user_and_date", (q) => q.eq("userId", userId).gte("createdAt", cutoff))
			.collect();

		const distribution: Record<string, number> = {};
		moods.forEach((m) => {
			distribution[m.moodType] = (distribution[m.moodType] || 0) + 1;
		});

		return {
			totalEntries: moods.length,
			distribution,
			averageMood: calculateAverageMood(moods),
		};
	},
});

/** Record a new mood entry */
export const recordMood = mutation({
	args: {
		userId: v.string(),
		moodType: v.string(),
		intensity: v.number(),
		factors: v.optional(v.array(v.string())),
		notes: v.optional(v.string()),
		shareWithSupportWorker: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const meta = moodMeta[args.moodType];
		const now = Date.now();
		const moodId = await ctx.db.insert("moods", {
			userId: args.userId,
			moodType: args.moodType,
			intensity: args.intensity,
			factors: args.factors || [],
			notes: args.notes,
			shareWithSupportWorker: args.shareWithSupportWorker ?? false,
			moodEmoji: meta?.emoji,
			moodLabel: meta?.label,
			createdAt: now,
			updatedAt: now,
		});

		console.log("[recordMood] Created mood:", { moodId, userId: args.userId, moodType: args.moodType });

		await ctx.db.insert("activities", {
			userId: args.userId,
			activityType: "mood_entry",
			metadata: { moodType: args.moodType },
			createdAt: now,
		});

		return { success: true, id: moodId };
	},
});

/** Update an existing mood entry */
export const updateMood = mutation({
	args: {
		id: v.id("moods"),
		moodType: v.optional(v.string()),
		intensity: v.optional(v.number()),
		factors: v.optional(v.array(v.string())),
		notes: v.optional(v.string()),
		shareWithSupportWorker: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.get(args.id);
		if (!existing) return { success: false, error: "Mood not found" };
		const updates: any = { updatedAt: Date.now() };
		if (args.moodType) {
			updates.moodType = args.moodType;
			const meta = moodMeta[args.moodType];
			updates.moodEmoji = meta?.emoji;
			updates.moodLabel = meta?.label;
		}
		if (typeof args.intensity === "number") updates.intensity = args.intensity;
		if (args.factors) updates.factors = args.factors;
		if (args.notes !== undefined) updates.notes = args.notes;
		if (args.shareWithSupportWorker !== undefined) updates.shareWithSupportWorker = args.shareWithSupportWorker;
		await ctx.db.patch(args.id, updates);
		return { success: true };
	},
});

/** Delete a mood entry */
export const deleteMood = mutation({
	args: { id: v.id("moods") },
	handler: async (ctx, { id }) => {
		const existing = await ctx.db.get(id);
		if (!existing) return { success: false, error: "Mood not found" };
		await ctx.db.delete(id);
		return { success: true };
	},
});

/** Get mood history with filters and pagination */
export const getMoodHistory = query({
	args: {
		userId: v.string(),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
		moodType: v.optional(v.string()),
		startDate: v.optional(v.string()), // ISO
		endDate: v.optional(v.string()),   // ISO
		factors: v.optional(v.array(v.string())),
	},
	handler: async (ctx, { userId, limit = 20, offset = 0, moodType, startDate, endDate, factors }) => {
		const hasDateFilter = !!startDate || !!endDate;
		const startTs = startDate ? Date.parse(startDate) : 0;
		const endTs = endDate ? Date.parse(endDate) : Date.now();
		const queryBase = hasDateFilter
			? ctx.db
					.query("moods")
					.withIndex("by_user_and_date", (q) => q.eq("userId", userId).gte("createdAt", startTs).lte("createdAt", endTs))
			: ctx.db
					.query("moods")
					.withIndex("by_userId", (q) => q.eq("userId", userId));

		const collected = await queryBase.order("desc").collect();
		console.log("[getMoodHistory] Retrieved moods for userId:", userId, "Count:", collected.length);
		if (collected.length > 0) {
			console.log("[getMoodHistory] First mood ID:", collected[0]._id);
		}
		
		const filtered = collected.filter((m) => {
			if (moodType && m.moodType !== moodType) return false;
			if (factors && factors.length > 0) {
				const hasAny = (m.factors || []).some((f: string) => factors.includes(f));
				if (!hasAny) return false;
			}
			return true;
		});
		const page = filtered.slice(offset, offset + limit).map(toClient);
		return { moods: page };
	},
});

/** Get distinct mood factors */
export const getFactors = query({
	args: { userId: v.string() },
	handler: async (ctx, { userId }) => {
		const moods = await ctx.db
			.query("moods")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();
		const set = new Set<string>();
		moods.forEach((m) => (m.factors || []).forEach((f: string) => set.add(f)));
		return { factors: Array.from(set).map((f) => ({ factor: f })) };
	},
});

/** Get mood chart data with streaks for visualization */
export const getMoodChartData = query({
	args: { userId: v.string(), days: v.optional(v.number()) },
	handler: async (ctx, { userId, days = 30 }) => {
		// Get all moods for the user
		const allMoods = await ctx.db
			.query("moods")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();

		// Helper to get local date string in America/Edmonton timezone
		const getLocalDateStr = (timestamp: number) => {
			// Convert to America/Edmonton timezone (MST/MDT)
			const d = new Date(timestamp);
			const dateStr = d.toLocaleString('en-US', {
				timeZone: 'America/Edmonton',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			});
			
			// Parse MM/DD/YYYY format to YYYY-MM-DD
			const parts = dateStr.split('/');
			const month = parts[0] || '01';
			const day = parts[1] || '01';
			const year = parts[2] || '2025';
			return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
		};

		// Group ALL moods by LOCAL date
		const moodsByDate: Record<string, any[]> = {};
		allMoods.forEach((m) => {
			const dateStr = getLocalDateStr(m.createdAt);
			if (!moodsByDate[dateStr]) moodsByDate[dateStr] = [];
			moodsByDate[dateStr].push(m);
		});

		console.log('[getMoodChartData] Moods grouped by date:', {
			totalMoods: allMoods.length,
			allMoodsWithDates: allMoods.slice(0, 5).map(m => ({
				type: m.moodType,
				createdAt: m.createdAt,
				utc: new Date(m.createdAt).toISOString(),
				localDate: getLocalDateStr(m.createdAt),
			})),
			moodsByDateKeys: Object.keys(moodsByDate),
			moodsByDate: Object.entries(moodsByDate).map(([date, moods]) => ({
				date,
				count: moods.length,
				moodTypes: moods.map(m => m.moodType),
			})),
		});

		// Generate last N days including today
		const today = new Date();
		const chartDates: string[] = [];
		
		console.log('[getMoodChartData] Generating date range:', {
			days,
			today: getLocalDateStr(today.getTime()),
			todayISO: today.toISOString(),
		});
		
		// Generate dates for the last N days (including today)
		for (let i = days - 1; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			const dateStr = getLocalDateStr(date.getTime());
			chartDates.push(dateStr);
		}
		
		console.log('[getMoodChartData] Chart dates:', chartDates);

		// Calculate streaks (consecutive days with mood entries)
		const datesWithMoods = Object.keys(moodsByDate).sort();
		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 0;
		const todayStr = getLocalDateStr(Date.now());
		const yesterdayStr = getLocalDateStr(Date.now() - 24 * 60 * 60 * 1000);

		console.log('[getMoodChartData] Streak calculation:', {
			todayStr,
			yesterdayStr,
			datesWithMoods,
		});

		// Calculate current streak (must include today or yesterday)
		const hasToday = datesWithMoods.includes(todayStr);
		const hasYesterday = datesWithMoods.includes(yesterdayStr);

		if (hasToday || hasYesterday) {
			const startDateStr = hasToday ? todayStr : yesterdayStr;
			let checkDateTimestamp = hasToday ? Date.now() : (Date.now() - 24 * 60 * 60 * 1000);
			
			while (true) {
				const dateStr = getLocalDateStr(checkDateTimestamp);
				console.log('[getMoodChartData] Checking streak for date:', dateStr, 'has mood:', datesWithMoods.includes(dateStr));
				if (datesWithMoods.includes(dateStr)) {
					currentStreak++;
					// Go back one day (24 hours in milliseconds)
					checkDateTimestamp -= 24 * 60 * 60 * 1000;
				} else {
					break;
				}
			}
		}

		console.log('[getMoodChartData] Streaks:', { currentStreak, hasToday, hasYesterday });

		// Calculate longest streak from all history
		if (datesWithMoods.length > 0) {
			tempStreak = 1;
			for (let i = 1; i < datesWithMoods.length; i++) {
				const prevDateStr = datesWithMoods[i - 1];
				const currDateStr = datesWithMoods[i];
				if (!prevDateStr || !currDateStr) continue;
				
				const prevDate = new Date(prevDateStr);
				const currDate = new Date(currDateStr);
				const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
				
				if (diffDays === 1) {
					tempStreak++;
				} else {
					longestStreak = Math.max(longestStreak, tempStreak);
					tempStreak = 1;
				}
			}
			longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
		}

		// Prepare chart data for ALL 30 days (including days without moods)
		const chartData = chartDates.map((date) => {
			const moods = moodsByDate[date] || [];
			const avgScore = moods.length > 0 ? calculateAverageMood(moods) : null;
			return {
				date,
				mood: moods[0] ? toClient(moods[0]) : null,
				averageScore: avgScore,
				count: moods.length,
				hasMood: moods.length > 0,
			};
		});

		console.log('[getMoodChartData] Generated 30-day chart:', {
			totalDays: chartData.length,
			daysWithMoods: chartData.filter(d => d.hasMood).length,
			dateRange: `${chartDates[0]} to ${chartDates[chartDates.length - 1]}`,
			chartDataDates: chartData.map(d => ({ date: d.date, hasMood: d.hasMood, score: d.averageScore })),
			// STREAK DEBUG INFO
			streakDebug: {
				todayStr: getLocalDateStr(Date.now()),
				datesWithMoods,
				currentStreak,
				longestStreak,
			}
		});

		return {
			currentStreak,
			longestStreak,
			chartData,
			totalEntries: allMoods.length,
		};
	},
});

// Average mood helper - Updated for new mood grid
function calculateAverageMood(moods: any[]): number {
	if (moods.length === 0) return 0;
	const moodScores: Record<string, number> = {
		"very-sad": 1,
		furious: 1,
		angry: 1.5,
		sad: 2,
		annoyed: 2,
		frustrated: 2,
		displeased: 2.5,
		neutral: 3,
		content: 3.5,
		happy: 4,
		ecstatic: 5,
		"very-happy": 5,
	};
	const total = moods.reduce((sum, m) => sum + (moodScores[m.moodType] || 3), 0);
	return total / moods.length;
}
