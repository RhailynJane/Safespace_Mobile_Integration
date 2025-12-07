import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
  ) || [];

  const hasFeature = (feature: string) => {
    // If features array is empty (backward compatibility), allow all features
    if (!features || features.length === 0) {
      return true;
    }
    return features.includes(feature);
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
