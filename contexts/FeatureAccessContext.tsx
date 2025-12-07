import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';

interface FeatureAccessContextType {
  hasFeature: (feature: string) => boolean;
  features: string[];
  isLoading: boolean;
}

const FeatureAccessContext = createContext<FeatureAccessContextType | undefined>(undefined);

export function FeatureAccessProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const clerkId = user?.id;

  const features = useQuery(
    api.organizations.getFeatures,
    clerkId ? { clerkId } : 'skip'
  );

  console.log('[FeatureAccessProvider] Features from Convex:', features);
  console.log('[FeatureAccessProvider] ClerkId:', clerkId);

  const hasFeature = (feature: string) => {
    // If query is still loading, return true to avoid hiding UI prematurely
    if (features === undefined) {
      console.log('[FeatureAccessProvider] Features still loading, allowing all features');
      return true;
    }

    // If features array is empty, it means no features are enabled - hide all
    if (!features || features.length === 0) {
      console.log('[FeatureAccessProvider] No features enabled, blocking:', feature);
      return false;
    }

    const hasAccess = features.includes(feature);
    console.log(`[FeatureAccessProvider] Feature "${feature}":`, hasAccess ? 'ALLOWED' : 'BLOCKED');
    return hasAccess;
  };

  return (
    <FeatureAccessContext.Provider
      value={{
        hasFeature,
        features: features || [],
        isLoading: features === undefined,
      }}
    >
      {children}
    </FeatureAccessContext.Provider>
  );
}

export function useFeatureAccess() {
  const context = useContext(FeatureAccessContext);
  if (context === undefined) {
    throw new Error('useFeatureAccess must be used within a FeatureAccessProvider');
  }
  return context;
}
