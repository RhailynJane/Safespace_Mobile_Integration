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

// Add this to your existing supabase client file (after MoodService)

export const JournalService = {
  async createEntry(
    clientId: string,
    entryData: {
      title: string;
      content: string;
      mood_type?: "very-happy" | "happy" | "neutral" | "sad" | "very-sad";
      tags?: string[];
    }
  ) {
    const { data, error } = await supabase.rpc("create_journal_entry", {
      p_client_id: clientId,
      p_title: entryData.title,
      p_content: entryData.content,
      p_mood_type: entryData.mood_type || null,
      p_tags: entryData.tags || [],
    });

    if (error) throw error;
    return data;
  },

  async getEntries(clientId: string, range: "all" | "week" | "month" = "all") {
    let query = supabase
      .from("journal_entries")
      .select(
        `
        id,
        title,
        content,
        mood_type,
        created_at,
        updated_at,
        tags: journal_tags(tag)
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
      title: entry.title,
      content: entry.content,
      mood_type: entry.mood_type,
      emoji: this.getMoodEmoji(entry.mood_type),
      date: entry.created_at,
      formattedDate: new Date(entry.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      tags: entry.tags.map((t) => t.tag),
    }));
  },

  async getEntryById(clientId: string, entryId: string) {
    const { data, error } = await supabase
      .from("journal_entries")
      .select(
        `
        id,
        title,
        content,
        mood_type,
        created_at,
        updated_at,
        tags: journal_tags(tag)
      `
      )
      .eq("client_id", clientId)
      .eq("id", entryId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      mood_type: data.mood_type,
      emoji: this.getMoodEmoji(data.mood_type),
      date: data.created_at,
      formattedDate: new Date(data.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      tags: data.tags.map((t) => t.tag),
    };
  },

  async updateEntry(
    clientId: string,
    entryId: string,
    updates: {
      title?: string;
      content?: string;
      mood_type?: "very-happy" | "happy" | "neutral" | "sad" | "very-sad";
      tags?: string[];
    }
  ) {
    // First update the entry itself
    const { data: entryData, error: entryError } = await supabase
      .from("journal_entries")
      .update({
        title: updates.title,
        content: updates.content,
        mood_type: updates.mood_type,
        updated_at: new Date().toISOString(),
      })
      .eq("client_id", clientId)
      .eq("id", entryId)
      .select()
      .single();

    if (entryError) throw entryError;

    // Then update tags if provided
    if (updates.tags) {
      // First delete all existing tags
      const { error: deleteError } = await supabase
        .from("journal_tags")
        .delete()
        .eq("journal_entry_id", entryId);

      if (deleteError) throw deleteError;

      // Then insert new tags if there are any
      if (updates.tags.length > 0) {
        const { error: insertError } = await supabase
          .from("journal_tags")
          .insert(
            updates.tags.map((tag) => ({ journal_entry_id: entryId, tag }))
          );

        if (insertError) throw insertError;
      }
    }

    return entryData;
  },

  async deleteEntry(clientId: string, entryId: string) {
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("client_id", clientId)
      .eq("id", entryId);

    if (error) throw error;
  },

  getMoodEmoji(type: string | null): string {
    if (!type) return "";
    const emojiMap: Record<string, string> = {
      "very-happy": "😄",
      happy: "🙂",
      neutral: "😐",
      sad: "🙁",
      "very-sad": "😢",
    };
    return emojiMap[type] || "";
  },
};
