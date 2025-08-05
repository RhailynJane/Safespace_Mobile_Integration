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
  age?: number;
  phoneNumber?: string;
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
