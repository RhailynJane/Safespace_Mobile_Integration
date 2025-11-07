import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Support Workers Module - Convex Backend
 * Provides lightweight listing & detail queries to replace REST /api/support-workers endpoints.
 * Data is currently denormalized inside appointments (supportWorker, specialization, avatarUrl).
 * This module expects we seed or mirror support worker profiles into a virtual list derived from appointments.
 * If a dedicated supportWorkers table is added later, swap the internal data source without changing client calls.
 */

// Client shape returned to React Native screens
function toClient(doc: any) {
  return {
    id: doc.id,
    name: doc.name,
    title: doc.title || 'Support Worker',
    avatar: doc.avatarUrl || 'https://via.placeholder.com/150',
    specialties: doc.specialties || (doc.specialization ? doc.specialization.split(',').map((s: string) => s.trim()) : []),
    bio: doc.bio,
    yearsOfExperience: doc.yearsOfExperience,
    hourlyRate: doc.hourlyRate,
    languagesSpoken: doc.languagesSpoken,
  };
}

/**
 * listSupportWorkers
 * Derives a unique support worker list from existing appointments (temporary strategy).
 * Later replace with a dedicated supportWorkers table; keep API contract stable.
 */
export const listSupportWorkers = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    specialization: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 50, search, specialization }) => {
    // Pull a sample of appointments to extract unique support workers
    const sample = await ctx.db
      .query('appointments')
      .withIndex('by_status', (q) => q.eq('status', 'scheduled'))
      .take(500);

    const map = new Map<string, any>();
    for (const apt of sample) {
      const key = apt.supportWorker || 'Unknown';
      if (!map.has(key)) {
        map.set(key, {
          id: apt.supportWorkerId || key, // fallback to name string
          name: key,
          title: 'Support Worker',
          avatarUrl: apt.avatarUrl,
          specialization: apt.specialization,
          specialties: apt.specialization ? apt.specialization.split(',').map(s => s.trim()) : [],
        });
      }
    }

    let workers = Array.from(map.values());

    if (search) {
      const qLower = search.toLowerCase();
      workers = workers.filter(w => w.name.toLowerCase().includes(qLower));
    }

    if (specialization) {
      const specLower = specialization.toLowerCase();
      workers = workers.filter(w => (w.specialization || '').toLowerCase().includes(specLower));
    }

    // Sort alphabetically
    workers.sort((a, b) => a.name.localeCompare(b.name));

    return {
      workers: workers.slice(0, limit).map(toClient),
      total: workers.length,
      derived: true, // indicates data derived from appointments
    };
  },
});

/**
 * getSupportWorker
 * Fetch a single support worker by id (string or numeric). Since we derive from appointments,
 * we scan appointments for matching supportWorkerId or name.
 */
export const getSupportWorker = query({
  args: { workerId: v.string() },
  handler: async (ctx, { workerId }) => {
    // First attempt: match numeric id or name across appointments
    const appointments = await ctx.db.query('appointments').take(1000);
    for (const apt of appointments) {
      const idStr = apt.supportWorkerId ? String(apt.supportWorkerId) : apt.supportWorker;
      if (idStr === workerId) {
        return toClient({
          id: idStr,
          name: apt.supportWorker,
          title: 'Support Worker',
          avatarUrl: apt.avatarUrl,
          specialization: apt.specialization,
          specialties: apt.specialization ? apt.specialization.split(',').map((s: string) => s.trim()) : [],
        });
      }
    }
    return null;
  },
});
