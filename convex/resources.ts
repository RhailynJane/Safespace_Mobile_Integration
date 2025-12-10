import { query, mutation, action } from "./_generated/server";
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

/**
 * List bookmarked resource ids for a user
 */
export const listBookmarkedIds = query({
	args: { userId: v.string() },
	handler: async (ctx, { userId }) => {
		const bookmarks = await ctx.db
			.query("resourceBookmarks")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();
		return { ids: bookmarks.map((b) => b.resourceId) };
	},
});

/**
 * Add a bookmark
 */
export const addBookmark = mutation({
	args: {
		userId: v.string(),
		resourceId: v.id("resources"),
	},
	handler: async (ctx, { userId, resourceId }) => {
		// Prevent duplicates
		const existing = await ctx.db
			.query("resourceBookmarks")
			.withIndex("by_user_and_resource", (q) => q.eq("userId", userId).eq("resourceId", resourceId))
			.take(1);
		if (existing.length > 0) return { success: true };

		await ctx.db.insert("resourceBookmarks", {
			userId,
			resourceId,
			createdAt: Date.now(),
		});
		return { success: true };
	},
});

/**
 * Remove a bookmark
 */
export const removeBookmark = mutation({
	args: {
		userId: v.string(),
		resourceId: v.id("resources"),
	},
	handler: async (ctx, { userId, resourceId }) => {
		const existing = await ctx.db
			.query("resourceBookmarks")
			.withIndex("by_user_and_resource", (q) => q.eq("userId", userId).eq("resourceId", resourceId))
			.take(1);
		if (existing.length === 0) return { success: true };

		await ctx.db.delete(existing[0]!._id);
		return { success: true };
	},
});

/**
 * Fetch random quote from external ZenQuotes API
 * Server-side action to avoid CORS issues
 */
export const fetchExternalQuote = action({
	args: {},
	handler: async () => {
		try {
			const response = await fetch('https://zenquotes.io/api/random');
			const data = await response.json();
			
			if (data?.[0]) {
				return {
					quote: data[0].q as string,
					author: data[0].a as string,
				};
			}
			
			// Fallback quote
			return {
				quote: "This moment is perfect as it is.",
				author: "Mindfulness Proverb",
			};
		} catch (error) {
			console.error("Error fetching external quote:", error);
			// Fallback quote
			return {
				quote: "This moment is perfect as it is.",
				author: "Mindfulness Proverb",
			};
		}
	},
});

/**
 * Fetch random affirmation from external Affirmations.dev API
 * Server-side action to avoid CORS issues
 */
export const fetchExternalAffirmation = action({
	args: {},
	handler: async () => {
		try {
			const response = await fetch('https://www.affirmations.dev');
			const data = await response.json();
			
			if (data?.affirmation) {
				return {
					affirmation: data.affirmation as string,
				};
			}
			
			// Fallback affirmation
			return {
				affirmation: "I am capable, I am strong, I am worthy of good things.",
			};
		} catch (error) {
			console.error("Error fetching external affirmation:", error);
			// Fallback affirmation
			return {
				affirmation: "I am capable, I am strong, I am worthy of good things.",
			};
		}
	},
});

/**
 * Get daily quote with external API integration
 * Fetches quote directly from external API
 */
export const getDailyQuote = action({
	args: {},
	handler: async () => {
		try {
			// Fetch from external API
			const response = await fetch('https://zenquotes.io/api/random');
			const data = await response.json();
			
			let quote = "This moment is perfect as it is.";
			let author = "Mindfulness Proverb";
			
			if (data?.[0]) {
				quote = data[0].q as string;
				author = data[0].a as string;
			}
			
			// Create resource object
			const resource = {
				id: `external-quote-${Date.now()}`,
				title: 'Daily Inspiration',
				type: 'Quote' as ResourceType,
				duration: '1 min',
				category: 'motivation' as ResourceCategory,
				content: quote,
				author: author,
				image_emoji: '💫',
				backgroundColor: '#FFF9C4',
				tags: ['daily', 'inspiration', 'motivation'],
				isExternal: true,
			};
			
			return resource;
		} catch (error) {
			console.error("Error getting daily quote:", error);
			// Return fallback quote
			return {
				id: `external-quote-${Date.now()}`,
				title: 'Daily Inspiration',
				type: 'Quote' as ResourceType,
				duration: '1 min',
				category: 'motivation' as ResourceCategory,
				content: "This moment is perfect as it is.",
				author: "Mindfulness Proverb",
				image_emoji: '💫',
				backgroundColor: '#FFF9C4',
				tags: ['daily', 'inspiration', 'motivation'],
				isExternal: true,
			};
		}
	},
});

/**
 * Get daily affirmation with external API integration
 * Fetches affirmation directly from external API
 */
export const getDailyAffirmationExternal = action({
	args: {},
	handler: async () => {
		try {
			// Fetch from external API
			const response = await fetch('https://www.affirmations.dev');
			const data = await response.json();
			
			let affirmationText = "I am capable, I am strong, I am worthy of good things.";
			
			if (data?.affirmation) {
				affirmationText = data.affirmation as string;
			}
			
			// Create resource object
			const resource = {
				id: `external-affirmation-${Date.now()}`,
				title: 'Daily Affirmation',
				type: 'Affirmation' as ResourceType,
				duration: '2 mins',
				category: 'motivation' as ResourceCategory,
				content: affirmationText,
				image_emoji: '🌟',
				backgroundColor: '#E8F5E8',
				tags: ['affirmation', 'daily', 'positivity'],
				isExternal: true,
			};
			
			return resource;
		} catch (error) {
			console.error("Error getting daily affirmation:", error);
			// Return fallback affirmation
			return {
				id: `external-affirmation-${Date.now()}`,
				title: 'Daily Affirmation',
				type: 'Affirmation' as ResourceType,
				duration: '2 mins',
				category: 'motivation' as ResourceCategory,
				content: "I am capable, I am strong, I am worthy of good things.",
				image_emoji: '🌟',
				backgroundColor: '#E8F5E8',
				tags: ['affirmation', 'daily', 'positivity'],
				isExternal: true,
			};
		}
	},
});
