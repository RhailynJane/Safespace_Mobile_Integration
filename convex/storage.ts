import { action } from "./_generated/server";

// Generate a one-time upload URL for Convex Storage
export const generateUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl } as const;
  },
});
