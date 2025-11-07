import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Convex resources module
 * Provides mental health resources with live subscriptions
 */

type ResourceType = 'Affirmation' | 'Quote' | 'Article' | 'Exercise' | 'Guide';
type ResourceCategory = 'stress' | 'anxiety' | 'depression' | 'sleep' | 'motivation' | 'mindfulness';

/**
 * Transform DB resource to client shape
 */
function toClient(doc: any) {
	return {
		id: doc._id,
		title: doc.title,
		type: doc.type as ResourceType,
		duration: doc.duration,
		category: doc.category as ResourceCategory,
		content: doc.content,
		author: doc.author,
		image_emoji: doc.imageEmoji,
		backgroundColor: doc.backgroundColor,
		tags: doc.tags || [],
		isExternal: doc.isExternal || false,
	};
}

/**
 * Get all active resources
 * @param limit - Max number of resources to return (default 100)
 */
export const listResources = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { limit = 100 }) => {
		const resources = await ctx.db
			.query("resources")
			.withIndex("by_active", (q) => q.eq("active", true))
			.order("desc")
			.take(limit);

		return {
			resources: resources.map(toClient),
		};
	},
});

/**
 * Get resources by category
 * @param category - Category to filter by
 * @param limit - Max number of resources to return (default 50)
 */
export const listByCategory = query({
	args: {
		category: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { category, limit = 50 }) => {
		const resources = await ctx.db
			.query("resources")
			.withIndex("by_category", (q) => q.eq("category", category))
			.filter((q) => q.eq(q.field("active"), true))
			.take(limit);

		return {
			resources: resources.map(toClient),
		};
	},
});

/**
 * Get resources by type
 * @param type - Resource type to filter by
 * @param limit - Max number of resources to return (default 50)
 */
export const listByType = query({
	args: {
		type: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { type, limit = 50 }) => {
		const resources = await ctx.db
			.query("resources")
			.withIndex("by_type", (q) => q.eq("type", type))
			.filter((q) => q.eq(q.field("active"), true))
			.take(limit);

		return {
			resources: resources.map(toClient),
		};
	},
});

/**
 * Search resources by title or content
 * @param query - Search query string
 * @param limit - Max number of results (default 50)
 */
export const search = query({
	args: {
		query: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { query: searchQuery, limit = 50 }) => {
		const allResources = await ctx.db
			.query("resources")
			.withIndex("by_active", (q) => q.eq("active", true))
			.take(200);

		// Simple search: filter by title, content, or tags
		const lowerQuery = searchQuery.toLowerCase();
		const filtered = allResources.filter((resource) => {
			const titleMatch = resource.title.toLowerCase().includes(lowerQuery);
			const contentMatch = resource.content.toLowerCase().includes(lowerQuery);
			const tagsMatch = resource.tags?.some((tag) =>
				tag.toLowerCase().includes(lowerQuery)
			);
			return titleMatch || contentMatch || tagsMatch;
		});

		return {
			resources: filtered.slice(0, limit).map(toClient),
		};
	},
});

/**
 * Get a single resource by ID
 * @param resourceId - Resource ID
 */
export const getResource = query({
	args: {
		resourceId: v.id("resources"),
	},
	handler: async (ctx, { resourceId }) => {
		const resource = await ctx.db.get(resourceId);
		
		if (!resource) {
			return null;
		}

		return toClient(resource);
	},
});

/**
 * Get daily affirmation (random affirmation-type resource)
 */
export const getDailyAffirmation = query({
	args: {},
	handler: async (ctx) => {
		const affirmations = await ctx.db
			.query("resources")
			.withIndex("by_type", (q) => q.eq("type", "Affirmation"))
			.filter((q) => q.eq(q.field("active"), true))
			.collect();

		if (affirmations.length === 0) {
			return null;
		}

		// Return random affirmation
		const randomIndex = Math.floor(Math.random() * affirmations.length);
		return toClient(affirmations[randomIndex]!);
	},
});

/**
 * Get random quote
 */
export const getRandomQuote = query({
	args: {},
	handler: async (ctx) => {
		const quotes = await ctx.db
			.query("resources")
			.withIndex("by_type", (q) => q.eq("type", "Quote"))
			.filter((q) => q.eq(q.field("active"), true))
			.collect();

		if (quotes.length === 0) {
			return null;
		}

		// Return random quote
		const randomIndex = Math.floor(Math.random() * quotes.length);
		return toClient(quotes[randomIndex]!);
	},
});

/**
 * Create a new resource (for seeding or external API integration)
 * @param title - Resource title
 * @param type - Resource type
 * @param duration - Estimated duration (e.g., "5 mins")
 * @param category - Resource category
 * @param content - Resource content
 * @param author - Optional author name
 * @param imageEmoji - Emoji representation
 * @param backgroundColor - Background color hex
 * @param tags - Optional tags array
 * @param isExternal - Whether from external API
 */
export const createResource = mutation({
	args: {
		title: v.string(),
		type: v.string(),
		duration: v.string(),
		category: v.string(),
		content: v.string(),
		author: v.optional(v.string()),
		imageEmoji: v.string(),
		backgroundColor: v.string(),
		tags: v.optional(v.array(v.string())),
		isExternal: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const resourceId = await ctx.db.insert("resources", {
			title: args.title,
			type: args.type,
			duration: args.duration,
			category: args.category,
			content: args.content,
			author: args.author,
			imageEmoji: args.imageEmoji,
			backgroundColor: args.backgroundColor,
			tags: args.tags,
			isExternal: args.isExternal || false,
			active: true,
			sortOrder: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return { id: resourceId };
	},
});

/**
 * Seed resources from static data
 * This is a utility mutation to populate initial data
 */
export const seedResources = mutation({
	args: {
		resources: v.array(
			v.object({
				title: v.string(),
				type: v.string(),
				duration: v.string(),
				category: v.string(),
				content: v.string(),
				author: v.optional(v.string()),
				imageEmoji: v.string(),
				backgroundColor: v.string(),
				tags: v.optional(v.array(v.string())),
			})
		),
	},
	handler: async (ctx, { resources }) => {
		const results = [];
		
		for (const resource of resources) {
			const resourceId = await ctx.db.insert("resources", {
				title: resource.title,
				type: resource.type,
				duration: resource.duration,
				category: resource.category,
				content: resource.content,
				author: resource.author,
				imageEmoji: resource.imageEmoji,
				backgroundColor: resource.backgroundColor,
				tags: resource.tags,
				isExternal: false,
				active: true,
				sortOrder: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			
			results.push(resourceId);
		}

		return { count: results.length, ids: results };
	},
});

/**
 * Update a resource
 * @param resourceId - Resource ID to update
 * @param updates - Fields to update
 */
export const updateResource = mutation({
	args: {
		resourceId: v.id("resources"),
		title: v.optional(v.string()),
		content: v.optional(v.string()),
		author: v.optional(v.string()),
		active: v.optional(v.boolean()),
	},
	handler: async (ctx, { resourceId, ...updates }) => {
		await ctx.db.patch(resourceId, {
			...updates,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Delete a resource (soft delete by marking inactive)
 * @param resourceId - Resource ID to delete
 */
export const deleteResource = mutation({
	args: {
		resourceId: v.id("resources"),
	},
	handler: async (ctx, { resourceId }) => {
		await ctx.db.patch(resourceId, {
			active: false,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});
