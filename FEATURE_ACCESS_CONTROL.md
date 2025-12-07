# Feature Access Control - Mobile App Integration Guide

## Overview
Organization administrators can now enable/disable specific features for their users through the web dashboard. The mobile app will automatically hide disabled features.

## Available Features
- `appointments` - Schedule and manage appointments
- `video_consultation` - Video calls with support workers  
- `mood_tracking` - Daily mood journal and analytics
- `crisis_support` - Emergency crisis resources and contacts
- `resources` - Educational content and resources
- `community` - Community posts and forums
- `messaging` - Direct messaging with support workers
- `assessments` - Self-assessment tools and questionnaires

## Usage in Mobile App

### 1. Import the hook
```tsx
import { useFeatureAccess } from '@/contexts/FeatureAccessContext';
```

### 2. Check if a feature is enabled
```tsx
function MyComponent() {
  const { hasFeature, features, isLoading } = useFeatureAccess();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  // Check single feature
  if (!hasFeature('appointments')) {
    return null; // Hide component if feature is disabled
  }

  return <AppointmentsView />;
}
```

### 3. Conditionally render navigation tabs
```tsx
function TabsLayout() {
  const { hasFeature } = useFeatureAccess();

  return (
    <Tabs>
      <Tabs.Screen name="home" />
      
      {hasFeature('appointments') && (
        <Tabs.Screen 
          name="appointments"
          options={{ title: 'Appointments' }}
        />
      )}
      
      {hasFeature('messaging') && (
        <Tabs.Screen 
          name="messages"
          options={{ title: 'Messages' }}
        />
      )}
      
      {hasFeature('community') && (
        <Tabs.Screen 
          name="community"
          options={{ title: 'Community' }}
        />
      )}
    </Tabs>
  );
}
```

### 4. Conditionally render menu items
```tsx
function ProfileMenu() {
  const { hasFeature } = useFeatureAccess();

  return (
    <View>
      <MenuItem title="Account Settings" onPress={() => {}} />
      
      {hasFeature('mood_tracking') && (
        <MenuItem title="Mood Journal" onPress={() => router.push('/mood-tracking')} />
      )}
      
      {hasFeature('assessments') && (
        <MenuItem title="Self Assessment" onPress={() => router.push('/self-assessment')} />
      )}
      
      {hasFeature('crisis_support') && (
        <MenuItem title="Crisis Support" onPress={() => router.push('/crisis-support')} />
      )}
    </View>
  );
}
```

### 5. Get all enabled features
```tsx
function DebugPanel() {
  const { features } = useFeatureAccess();

  return (
    <View>
      <Text>Enabled Features:</Text>
      {features.map(feature => (
        <Text key={feature}>✓ {feature}</Text>
      ))}
    </View>
  );
}
```

## Backend Configuration

### Enabling/Disabling Features (SuperAdmin)
1. Navigate to SuperAdmin → Organizations
2. Click on the organization to edit
3. Scroll to "Feature Access Control" section
4. Toggle features on/off
5. Click "Save Changes"

### Query for Features (Mobile App)
The mobile app automatically queries features using:
```typescript
const features = useQuery(api.organizations.getFeatures, { clerkId });
```

This returns an array of enabled feature strings, e.g.:
```typescript
['appointments', 'video_consultation', 'mood_tracking', 'crisis_support']
```

## Backward Compatibility
- If no features are configured, all features are enabled by default
- Existing users will have all features available until admin configures restrictions
- The `hasFeature()` function returns `true` for all features if the features array is empty

## Example: Complete Screen with Feature Check
```tsx
import { useFeatureAccess } from '@/contexts/FeatureAccessContext';
import { View, Text, ActivityIndicator } from 'react-native';

export default function AppointmentsScreen() {
  const { hasFeature, isLoading } = useFeatureAccess();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!hasFeature('appointments')) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center', fontSize: 16 }}>
          Appointments feature is not available for your organization.
        </Text>
        <Text style={{ textAlign: 'center', marginTop: 10, color: '#666' }}>
          Please contact your administrator for more information.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Your appointments content */}
    </View>
  );
}
```

## Testing
1. Create a test organization in the web admin
2. Disable a feature (e.g., 'appointments')
3. Login to mobile app with a user from that organization
4. Verify the appointments tab/screen is hidden
5. Re-enable the feature and verify it appears again
