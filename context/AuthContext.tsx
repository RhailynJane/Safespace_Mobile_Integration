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

// Define the shape of our authentication context
interface AuthContextType {
  user: User | null; // Current authenticated user or null if not signed in
  loading: boolean; // Whether auth state is still being determined
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user?: User; error?: string }>; // Sign in function with email/password
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<{ error?: string }>; // Sign up function with optional name fields
  resetPassword: (email: string) => Promise<{ error?: string }>; // Password reset function
  logout: () => Promise<void>; // Sign out function
}

// Create the authentication context with undefined as default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component that wraps the app and provides auth state
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // State to store the current user
  const [user, setUser] = useState<User | null>(null);
  // State to track if we're still loading the initial auth state
  const [loading, setLoading] = useState(true);

  // Effect to listen for auth state changes
  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Update user state when auth state changes
      setUser(firebaseUser ?? null);
      // Set loading to false once we have the initial auth state
      setLoading(false);
    });

    // Cleanup function to unsubscribe from the listener
    return unsubscribe;
  }, []);

  // Function to sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      // Attempt to sign in with Firebase
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user }; // Return user on success
    } catch (error: any) {
      console.log("Firebase signIn error:", error);
      // Return mapped error message on failure
      return { error: mapFirebaseAuthError(error) };
    }
  };

  // Function to create a new user account
  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      // Create new user account with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update user profile with display name if first/last name provided
      if (firstName || lastName) {
        await updateProfile(user, {
          displayName: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
        });
      }

      // Send email verification to new user
      await sendEmailVerification(user);
      return {}; // Return empty object on success
    } catch (error: any) {
      // Return mapped error message on failure
      return { error: mapFirebaseAuthError(error) };
    }
  };

  // Function to send password reset email
  const resetPassword = async (email: string) => {
    try {
      // Send password reset email via Firebase
      await sendPasswordResetEmail(auth, email);
      return {}; // Return empty object on success
    } catch (error: any) {
      console.log("Firebase resetPassword error:", error);
      // Return mapped error message on failure
      return { error: mapFirebaseAuthError(error) };
    }
  };

  // Function to sign out the current user
  const logout = async () => {
    await signOut(auth);
  };

  // Render the context provider with auth state and functions
  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, resetPassword, logout }}
    >
      {/* Only render children once loading is complete */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to access the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Throw error if hook is used outside of AuthProvider
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};

// Helper function to map Firebase auth errors to user-friendly messages
const mapFirebaseAuthError = (error: any): string => {
  console.log("Mapping error code:", error.code);
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
      // Fallback for any unmapped error codes
      return "An unknown error occurred.";
  }
};
