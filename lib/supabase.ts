import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

// Access variables directly from process.env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables not configured!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
});

// Mood tracking table functions
export const MoodService = {
  async logMood(userId: string, moodData: any) {
    const { data, error } = await supabase
      .from("mood_entries")
      .insert([{ user_id: userId, ...moodData }])
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async getMoodHistory(
    userId: string,
    range: "week" | "month" | "all" = "all"
  ) {
    let query = supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (range === "week") {
      query = query.gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );
    } else if (range === "month") {
      query = query.gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};
