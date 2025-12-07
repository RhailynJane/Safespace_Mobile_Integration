/**
 * Feature Access Test Component
 * Add this to any screen to test feature access control
 */

import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFeatureAccess } from '../contexts/FeatureAccessContext';

export default function FeatureAccessTest() {
  const { hasFeature, features, isLoading } = useFeatureAccess();

  const allFeatures = [
    'appointments',
    'video_consultation',
    'mood_tracking',
    'crisis_support',
    'resources',
    'community',
    'messaging',
    'assessments',
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feature Access Control Test</Text>
        <Text style={styles.subtitle}>
          {isLoading ? 'Loading...' : `${features.length} features enabled`}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enabled Features from Backend:</Text>
        {isLoading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : features.length === 0 ? (
          <Text style={styles.warning}>⚠️ No features enabled!</Text>
        ) : (
          features.map((feature) => (
            <Text key={feature} style={styles.enabled}>
              ✅ {feature}
            </Text>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feature Access Check:</Text>
        {allFeatures.map((feature) => {
          const allowed = hasFeature(feature);
          return (
            <View key={feature} style={styles.featureRow}>
              <Text style={allowed ? styles.allowed : styles.blocked}>
                {allowed ? '✅' : '⛔'} {feature}
              </Text>
              <Text style={styles.status}>
                {allowed ? 'ALLOWED' : 'BLOCKED'}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Raw Data:</Text>
        <Text style={styles.json}>
          {JSON.stringify({ isLoading, features }, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  enabled: {
    fontSize: 14,
    color: '#22c55e',
    marginBottom: 5,
  },
  loading: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  warning: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  allowed: {
    fontSize: 14,
    color: '#22c55e',
  },
  blocked: {
    fontSize: 14,
    color: '#ef4444',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  json: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
});
