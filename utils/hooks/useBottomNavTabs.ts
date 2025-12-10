import { useMemo } from 'react';
import { useFeatureAccess } from '../../contexts/FeatureAccessContext';

export interface BottomNavTab {
  id: string;
  name: string;
  icon: string;
  feature?: string; // Optional feature to gate this tab
}

/**
 * Hook to get filtered bottom navigation tabs based on feature access
 * Automatically filters out disabled features
 */
export function useBottomNavTabs(): BottomNavTab[] {
  const { hasFeature } = useFeatureAccess();

  const allTabs: BottomNavTab[] = [
    { id: 'home', name: 'Home', icon: 'home' },
    { id: 'community-forum', name: 'Community', icon: 'people', feature: 'community' },
    { id: 'appointments', name: 'Appointments', icon: 'calendar', feature: 'appointments' },
    { id: 'messages', name: 'Messages', icon: 'chatbubbles', feature: 'messaging' },
    { id: 'profile', name: 'Profile', icon: 'person' },
  ];

  return useMemo(
    () => allTabs.filter(tab => !tab.feature || hasFeature(tab.feature)),
    [hasFeature]
  );
}
