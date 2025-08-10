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
  async logMood(
    clientId: string,
    moodData: {
      type: "very-happy" | "happy" | "neutral" | "sad" | "very-sad";
      intensity: number;
      factors: string[];
      notes?: string;
    }
  ) {
    const { data, error } = await supabase.rpc("log_mood_with_factors", {
      p_client_id: clientId,
      p_mood_type: moodData.type,
      p_intensity: moodData.intensity,
      p_notes: moodData.notes || null,
      p_factors: moodData.factors,
    });

    if (error) throw error;
    return data;
  },

  async getMoodHistory(
    clientId: string,
    range: "week" | "month" | "all" = "all"
  ) {
    let query = supabase
      .from("mood_entries")
      .select(
        `
        id,
        mood_type,
        intensity,
        notes,
        created_at,
        factors: mood_factors(factor)
      `
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (range === "week") {
      query = query.gt(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );
    } else if (range === "month") {
      query = query.gt(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((entry) => ({
      id: entry.id,
      mood: entry.mood_type,
      emoji: this.getMoodEmoji(entry.mood_type),
      intensity: entry.intensity,
      notes: entry.notes,
      date: entry.created_at,
      formattedDate: new Date(entry.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      factors: entry.factors.map((f) => f.factor),
    }));
  },

  getMoodEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
      "very-happy": "😄",
      happy: "🙂",
      neutral: "😐",
      sad: "🙁",
      "very-sad": "😢",
    };
    return emojiMap[type] || "🙂";
  },
};
