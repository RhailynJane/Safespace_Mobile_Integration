// File: context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Mock types to replace Supabase types
interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    first_name: string;
    last_name: string;
  };
}

interface MockSession {
  user: MockUser;
  access_token: string;
}

// Define the shape of the context value
interface AuthContextType {
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  user: MockUser | null;
  session: MockSession | null;
  loading: boolean;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mock user database (in real app, this would be your backend)
const mockUsers: { [email: string]: { password: string; firstName: string; lastName: string } } = {
  'test@example.com': {
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe'
  }
};

// AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [session, setSession] = useState<MockSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing session on app start
    const checkExistingSession = async () => {
      // Simulate a small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll start with no session
      // In a real app, you might check AsyncStorage here
      setLoading(false);
    };

    checkExistingSession();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic validation
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters long' };
    }

    if (mockUsers[email]) {
      return { error: 'User already exists with this email' };
    }

    // "Save" the user to our mock database
    mockUsers[email] = { password, firstName, lastName };

    console.log('Mock user created:', { email, firstName, lastName });
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockUser = mockUsers[email];
    
    if (!mockUser) {
      return { error: 'No account found with this email address' };
    }

    if (mockUser.password !== password) {
      return { error: 'Incorrect password' };
    }

    // Create mock session
    const newUser: MockUser = {
      id: Math.random().toString(36).substring(7),
      email: email,
      user_metadata: {
        first_name: mockUser.firstName,
        last_name: mockUser.lastName,
      }
    };

    const newSession: MockSession = {
      user: newUser,
      access_token: 'mock_token_' + Math.random().toString(36).substring(7),
    };

    setUser(newUser);
    setSession(newSession);

    console.log('Mock user signed in:', { email, firstName: mockUser.firstName });
    return { error: null };
  };

  const signOut = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUser(null);
    setSession(null);
    console.log('Mock user signed out');
  };

  const value = {
    signUp,
    signIn,
    signOut,
    user,
    session,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}