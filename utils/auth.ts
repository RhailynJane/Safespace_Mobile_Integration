import {
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export const resetPassword = async (
  email: string
): Promise<{ error?: string }> => {
  try {
    if (!email) {
      return { error: "Email is required" };
    }

    await sendPasswordResetEmail(auth, email);
    return {};
  } catch (error: any) {
    console.error("Password reset error:", error);

    switch (error.code) {
      case "auth/user-not-found":
        return { error: "No account found with this email address." };
      case "auth/invalid-email":
        return { error: "Please enter a valid email address." };
      case "auth/network-request-failed":
        return { error: "Network error. Please check your connection." };
      default:
        return {
          error: "Failed to send password reset email. Please try again.",
        };
    }
  }
};

export const resendEmailVerification = async (
  user: User
): Promise<{ error?: string }> => {
  try {
    await sendEmailVerification(user);
    return {};
  } catch (error: any) {
    console.error("Resend verification error:", error);

    switch (error.code) {
      case "auth/too-many-requests":
        return {
          error:
            "Too many requests. Please wait before requesting another verification email.",
        };
      case "auth/network-request-failed":
        return { error: "Network error. Please check your connection." };
      default:
        return {
          error: "Failed to send verification email. Please try again.",
        };
    }
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one symbol",
    };
  }

  return { isValid: true };
};

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  photoURL?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string;
  therapyType?: "adult" | "minor" | "guardian";
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  isActive: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
