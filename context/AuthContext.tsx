import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { supabase } from "../lib/supabase";

export type TherapyType = "adult" | "minor" | "guardian";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user?: User; error?: string }>;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    therapyType?: TherapyType | null,
    phoneNumber?: string,
    age?: string
  ) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await syncUserProfile(firebaseUser);
        } catch (error) {
          console.error("Profile sync failed:", error);
        }
      }
      setUser(firebaseUser ?? null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user };
    } catch (error: any) {
      return { error: mapFirebaseAuthError(error) };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    therapyType?: TherapyType | null,
    phoneNumber?: string,
    age?: string
  ) => {
    try {
      // 1. Firebase account creation
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Update Firebase profile
      if (firstName || lastName) {
        await updateProfile(user, {
          displayName: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
        });
      }

      // 3. Create/Update Supabase profile with all fields
      const { error } = await supabase.from("clients").upsert(
        {
          firebase_uid: user.uid,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          client_type: therapyType,
          phone: phoneNumber,
          age: age ? parseInt(age) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "firebase_uid" }
      );

      if (error) throw error;

      // 4. Send verification email
      await sendEmailVerification(user);
      return {};
    } catch (error: any) {
      console.error("Signup error:", error);
      return { error: mapFirebaseAuthError(error) };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {};
    } catch (error: any) {
      return { error: mapFirebaseAuthError(error) };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, resetPassword, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};

const mapFirebaseAuthError = (error: any): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Email is already in use.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-not-found":
      return "Email doesn't exist";
    case "auth/wrong-password":
      return "Wrong password.";
    case "auth/weak-password":
      return "Password is too weak.";
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    default:
      return "An unknown error occurred.";
  }
};

async function syncUserProfile(firebaseUser: User) {
  if (!firebaseUser) return;

  const { data: existingUser, error: fetchError } = await supabase
    .from("clients")
    .select("*")
    .eq("firebase_uid", firebaseUser.uid)
    .single();

  if (!existingUser) {
    const displayName = firebaseUser.displayName || "";
    const [firstName, ...rest] = displayName.split(" ");
    const lastName = rest.join(" ") || null;

    await supabase.from("clients").upsert({
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email,
      first_name: firstName || null,
      last_name: lastName,
      updated_at: new Date().toISOString(),
    });
  } else if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }
}
