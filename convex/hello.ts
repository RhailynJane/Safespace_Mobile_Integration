import { query } from "./_generated/server";
import { v } from "convex/values";

// Simple sample query to verify Convex is wired up.
export const greet = query({
  args: { name: v.optional(v.string()) },
  handler: async (_ctx: any, args: { name?: string }) => {
    return `Hello ${args.name ?? "world"} from Convex!`;
  },
});
