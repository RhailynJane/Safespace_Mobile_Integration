import {
  sendPasswordResetEmail,
  sendEmailVerification,
  User,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";

// Password reset utility
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

// Resend email verification
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

// Email validation utility
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation utility
export const validatePassword = (
  password: string
): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long",
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  return { isValid: true };
};

// Name validation utility
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
};

// Format user display name
export const formatDisplayName = (
  firstName: string,
  lastName: string
): string => {
  return `${firstName.trim()} ${lastName.trim()}`;
};

// Check if user profile is complete
export const isProfileComplete = (userData: any): boolean => {
  return !!(
    userData?.firstName &&
    userData?.lastName &&
    userData?.email &&
    userData?.emailVerified
  );
};

// Generate username suggestion from email
export const generateUsernameFromEmail = (email: string): string => {
  const username = email.split("@")[0] ?? "";
  return username.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Auth error messages mapping
export const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    "auth/email-already-in-use":
      "This email is already registered. Please sign in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters long.",
    "auth/user-not-found": "No account found with this email address.",
    "auth/wrong-password": "Invalid password. Please try again.",
    "auth/invalid-credential": "Invalid email or password. Please try again.",
    "auth/user-disabled":
      "This account has been disabled. Please contact support.",
    "auth/too-many-requests":
      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
    "auth/requires-recent-login":
      "Please sign in again to complete this action.",
    "auth/credential-already-in-use":
      "This credential is already associated with another account.",
    "auth/account-exists-with-different-credential":
      "An account already exists with the same email but different sign-in credentials.",
  };

  return (
    errorMessages[errorCode] ||
    "An unexpected error occurred. Please try again."
  );
};

// Types for better type safety
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

// Form validation for sign up
export const validateSignUpForm = (
  firstName: string,
  lastName: string,
  email: string,
  password: string
): ValidationResult => {
  const errors: string[] = [];

  if (!firstName.trim()) {
    errors.push("First name is required");
  } else if (!validateName(firstName)) {
    errors.push(
      "First name must be at least 2 characters and contain only letters"
    );
  }

  if (!lastName.trim()) {
    errors.push("Last name is required");
  } else if (!validateName(lastName)) {
    errors.push(
      "Last name must be at least 2 characters and contain only letters"
    );
  }

  if (!email.trim()) {
    errors.push("Email is required");
  } else if (!validateEmail(email)) {
    errors.push("Please enter a valid email address");
  }

  if (!password) {
    errors.push("Password is required");
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid && passwordValidation.message) {
      errors.push(passwordValidation.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Form validation for sign in
export const validateSignInForm = (
  email: string,
  password: string
): ValidationResult => {
  const errors: string[] = [];

  if (!email.trim()) {
    errors.push("Email is required");
  } else if (!validateEmail(email)) {
    errors.push("Please enter a valid email address");
  }

  if (!password) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
