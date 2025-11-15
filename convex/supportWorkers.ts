import { query, mutation } from "./_generated/server";
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
    // 1) Prefer dedicated supportWorkers table if it has entries
    const tableWorkers = await ctx.db.query('supportWorkers').take(200);
    let base: any[] = [];
    if (tableWorkers.length > 0) {
      base = tableWorkers.map(w => ({
        id: w._id,
        name: w.name,
        title: w.title || 'Support Worker',
        avatarUrl: w.avatarUrl,
        specialization: w.specialization,
        specialties: w.specialties || (w.specialization ? w.specialization.split(',').map((s: string) => s.trim()) : []),
        bio: w.bio,
        yearsOfExperience: w.yearsOfExperience,
        hourlyRate: w.hourlyRate,
        languagesSpoken: w.languagesSpoken,
      }));
    }
    // 2) If none in table, fall back to derivation from appointments (legacy path)
    if (base.length === 0) {
    // Pull a sample of appointments to extract unique support workers
    // Prefer scheduled, then confirmed, then any if none found
    let sample = await ctx.db
      .query('appointments')
      .withIndex('by_status', (q) => q.eq('status', 'scheduled'))
      .take(500);

    if (sample.length === 0) {
      const confirmed = await ctx.db
        .query('appointments')
        .withIndex('by_status', (q) => q.eq('status', 'confirmed'))
        .take(500);
      sample = confirmed;
    }

    if (sample.length === 0) {
      // As a final fallback, take a general sample regardless of status
      sample = await ctx.db.query('appointments').take(200);
    }

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
      base = Array.from(map.values());
    }

    let workers = base;

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
      derived: base === workers && tableWorkers.length === 0, // true only if appointment-derived
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
    // First try dedicated table
    try {
      const maybe = await ctx.db.get(workerId as any) as any;
      if (maybe) {
        return toClient({
          id: maybe._id,
          name: maybe.name,
          title: maybe.title || 'Support Worker',
          avatarUrl: maybe.avatarUrl,
          specialization: maybe.specialization,
          specialties: maybe.specialties || (maybe.specialization ? maybe.specialization.split(',').map((s: string) => s.trim()) : []),
          bio: maybe.bio,
          yearsOfExperience: maybe.yearsOfExperience,
          hourlyRate: maybe.hourlyRate,
          languagesSpoken: maybe.languagesSpoken,
        });
      }
    } catch (_) { /* ignore invalid id format */ }
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

// Mutation: seed two hardcoded support workers if table empty
export const seedSupportWorkers = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('supportWorkers').first();
    if (existing) return { ok: true, skipped: true } as const;
    const now = Date.now();
    const workers = [
      {
        name: 'Alex Johnson',
        title: 'Registered Counsellor',
        avatarUrl: 'https://via.placeholder.com/150/4CAF50/FFFFFF?text=AJ',
        specialization: 'anxiety, stress, mindfulness',
        specialties: ['anxiety', 'stress', 'mindfulness'],
        bio: 'Alex focuses on practical coping strategies and mindfulness-based interventions.',
        yearsOfExperience: 6,
        hourlyRate: 95,
        languagesSpoken: ['English'],
      },
      {
        name: 'Bianca Lee',
        title: 'Clinical Social Worker',
        avatarUrl: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=BL',
        specialization: 'depression, trauma, youth',
        specialties: ['depression', 'trauma', 'youth'],
        bio: 'Bianca supports clients working through trauma recovery and mood stabilization.',
        yearsOfExperience: 9,
        hourlyRate: 110,
        languagesSpoken: ['English', 'French'],
      },
    ];
    for (const w of workers) {
      await ctx.db.insert('supportWorkers', { ...w, createdAt: now, updatedAt: now });
    }
    return { ok: true, skipped: false, count: workers.length } as const;
  }
});
