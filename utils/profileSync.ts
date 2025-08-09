// utils/profileSync.ts
import { supabase } from "../lib/supabase";
import { User } from "firebase/auth";

export const syncUserProfile = async (firebaseUser: User) => {
  const { data, error } = await supabase
    .from("clients")
    .upsert(
      {
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "firebase_uid",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};
