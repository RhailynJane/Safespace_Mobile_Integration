import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { supabase } from "../lib/supabase";

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  firebaseUser: FirebaseUser;
}

interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  clientType: "adult" | "minor" | "guardian";
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: ClientProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    clientType: "adult" | "minor" | "guardian",
    phone?: string
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<boolean>;
  checkEmailVerification: () => Promise<boolean>;
  updateDemographics: (data: any) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
  profile?: ClientProfile;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const transformFirebaseUser = (firebaseUser: FirebaseUser): AuthUser => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "",
    emailVerified: firebaseUser.emailVerified,
    firebaseUser: firebaseUser,
  });

  // Initialize user and profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const authUser = transformFirebaseUser(firebaseUser);
        setUser(authUser);

        // Load profile from Supabase
        const { data, error } = await supabase
          .from("clients")
          .select("id, first_name, last_name, client_type, phone")
          .eq("firebase_uid", firebaseUser.uid)
          .single();

        if (data && !error) {
          setProfile({
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            clientType: data.client_type,
            phone: data.phone,
          });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const authUser = transformFirebaseUser(result.user);
      setUser(authUser);

      // Load profile
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, client_type, phone")
        .eq("firebase_uid", result.user.uid)
        .single();

      if (error) throw error;

      const clientProfile = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        clientType: data.client_type,
        phone: data.phone,
      };
      setProfile(clientProfile);

      return { success: true, user: authUser, profile: clientProfile };
    } catch (error: any) {
      return { success: false, error: mapFirebaseAuthError(error) };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    clientType: "adult" | "minor" | "guardian",
    phone?: string
  ): Promise<AuthResult> => {
    try {
      // 1. Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // 2. Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`.trim(),
      });

      // 3. Create Supabase client record
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          firebase_uid: firebaseUser.uid,
          email,
          first_name: firstName,
          last_name: lastName,
          client_type: clientType,
          phone,
        })
        .select("id, first_name, last_name, client_type, phone")
        .single();

      if (clientError) throw clientError;

      // 4. Initialize empty demographics record
      await supabase.from("client_demographics").insert({
        client_id: clientData.id,
      });

      // 5. Send verification email
      await sendEmailVerification(firebaseUser);

      // 6. Update local state
      const authUser = transformFirebaseUser(firebaseUser);
      const clientProfile = {
        id: clientData.id,
        firstName,
        lastName,
        clientType: clientData.client_type,
        phone,
      };

      setUser(authUser);
      setProfile(clientProfile);

      return { success: true, user: authUser, profile: clientProfile };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { success: false, error: mapFirebaseAuthError(error) };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const sendVerificationEmail = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      await sendEmailVerification(user.firebaseUser);
      return true;
    } catch (error) {
      console.error("Verification email error:", error);
      return false;
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      await user.firebaseUser.reload();
      return user.firebaseUser.emailVerified;
    } catch (error) {
      console.error("Verification check error:", error);
      return false;
    }
  };

  const updateDemographics = async (data: any) => {
    if (!profile) return;
    await supabase
      .from("client_demographics")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("client_id", profile.id);
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      // Import sendPasswordResetEmail from firebase/auth
      const { sendPasswordResetEmail } = await import("firebase/auth");

      await sendPasswordResetEmail(auth, email);
      return {}; // No error means success
    } catch (error: any) {
      console.error("Password reset error:", error);
      return { error: mapFirebaseAuthError(error) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        logout,
        sendVerificationEmail,
        checkEmailVerification,
        updateDemographics,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const mapFirebaseAuthError = (error: any): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Email is already in use.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/user-not-found":
      return "No account found with this email. Please check the email address.";
    case "auth/invalid-email":
      return "The email address is badly formatted.";
    case "auth/missing-email":
      return "Please provide an email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      console.error("Auth error:", error);
      return "An error occurred. Please try again.";
  }
};
