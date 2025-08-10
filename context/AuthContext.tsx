import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
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
import { AuthUser, UserProfile, AuthResult } from "../types/auth";

export type TherapyType = "adult" | "minor" | "guardian";

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    therapyType?: TherapyType | null,
    phoneNumber?: string,
    age?: string
  ) => Promise<AuthResult>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!auth.currentUser) {
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      const { authUser, userProfile } = await syncUserProfile(auth.currentUser);
      setUser(authUser);
      setProfile(userProfile);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const { authUser, userProfile } = await syncUserProfile(firebaseUser);
          setUser(authUser);
          setProfile(userProfile);
        } catch (error) {
          console.error("Profile sync failed:", error);
          setUser(transformFirebaseUser(firebaseUser));
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const transformFirebaseUser = (firebaseUser: FirebaseUser): AuthUser => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "",
    emailVerified: firebaseUser.emailVerified,
    photoURL: firebaseUser.photoURL || undefined,
  });

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const { authUser, userProfile } = await syncUserProfile(result.user);
      setUser(authUser);
      setProfile(userProfile);
      return { success: true, user: authUser };
    } catch (error: any) {
      return { success: false, error: mapFirebaseAuthError(error) };
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
  ): Promise<AuthResult> => {
    try {
      // 1. Firebase account creation
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // 2. Update Firebase profile
      if (firstName || lastName) {
        await updateProfile(firebaseUser, {
          displayName: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
          // photoURL can be added here if needed
        });
      }

      // 3. Create Supabase profile
      const { error } = await supabase.from("clients").upsert({
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email,
        first_name: firstName,
        last_name: lastName,
        client_type: therapyType,
        phone: phoneNumber,
        age: age ? parseInt(age) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // 4. Send verification email
      await sendEmailVerification(firebaseUser);

      // 5. Update local state
      const authUser = transformFirebaseUser(firebaseUser);
      const userProfile = await getProfileFromSupabase(firebaseUser.uid);

      setUser(authUser);
      setProfile(userProfile);

      return { success: true, user: authUser };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { success: false, error: mapFirebaseAuthError(error) };
    }
  };

  const getProfileFromSupabase = async (
    uid: string
  ): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("firebase_uid", uid)
      .single();

    if (error || !data) return null;

    return {
      uid: data.firebase_uid,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      displayName: `${data.first_name} ${data.last_name}`.trim(),
      photoURL: data.photo_url || undefined,
      age: data.age,
      phoneNumber: data.phone,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      emailVerified: false, // This should come from Firebase
      isActive: true, // Default to true
    };
  };

  const syncUserProfile = async (firebaseUser: FirebaseUser) => {
    const authUser = transformFirebaseUser(firebaseUser);
    const userProfile = (await getProfileFromSupabase(firebaseUser.uid)) || {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      firstName: firebaseUser.displayName?.split(" ")[0] || "",
      lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
      displayName: firebaseUser.displayName || "",
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: firebaseUser.emailVerified,
      isActive: true,
    };

    // Ensure profile exists in Supabase
    if (!(await getProfileFromSupabase(firebaseUser.uid))) {
      await supabase.from("clients").upsert({
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email,
        first_name: userProfile.firstName,
        last_name: userProfile.lastName,
        updated_at: new Date().toISOString(),
      });
    }

    return { authUser, userProfile };
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: mapFirebaseAuthError(error) };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        resetPassword,
        logout,
        refreshUser,
      }}
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
