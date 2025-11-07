import { query } from "./_generated/server";

/**
 * Get all available post categories
 * These are hardcoded categories for the community forum
 */
export const list = query({
  args: {},
  handler: async () => {
    // Return static categories - no need for database storage
    return [
      { id: "trending", name: "Trending", slug: "trending" },
      { id: "stress", name: "Stress", slug: "stress" },
      { id: "support", name: "Support", slug: "support" },
      { id: "stories", name: "Stories", slug: "stories" },
      { id: "self-care", name: "Self Care", slug: "self-care" },
      { id: "mindfulness", name: "Mindfulness", slug: "mindfulness" },
      { id: "creative", name: "Creative", slug: "creative" },
      { id: "therapy", name: "Therapy", slug: "therapy" },
      { id: "affirmation", name: "Affirmation", slug: "affirmation" },
      { id: "awareness", name: "Awareness", slug: "awareness" },
    ];
  },
});
