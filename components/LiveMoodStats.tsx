import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from 'convex/react';

interface LiveMoodStatsProps {
  userId: string;
  days?: number;
  onStatsUpdate?: (stats: any) => void;
  renderStats?: (stats: any) => React.ReactNode;
}

/**
 * LiveMoodStats - Real-time mood statistics using Convex subscriptions
 * 
 * @param userId - Clerk user ID
 * @param days - Number of days to analyze (default 7)
 * @param onStatsUpdate - Callback when stats update
 * @param renderStats - Custom render function for stats display
 */
export function LiveMoodStats({ userId, days = 7, onStatsUpdate, renderStats }: LiveMoodStatsProps) {
  const [convexApi, setConvexApi] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dynamic import Convex API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('../convex/_generated/api');
        if (mounted) setConvexApi(mod.api);
      } catch (err) {
        if (mounted) {
          console.log('LiveMoodStats: Convex API not available yet');
          setError('Convex not available');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to live stats
  const stats = useQuery(
    convexApi?.moods.getMoodStats,
    convexApi ? { userId, days } : 'skip'
  ) as { totalEntries: number; distribution: Record<string, number>; averageMood: number } | undefined;

  // Notify parent on update
  useEffect(() => {
    if (stats && onStatsUpdate) {
      onStatsUpdate(stats);
    }
  }, [stats, onStatsUpdate]);

  if (error) {
    return null; // Silently fail if Convex unavailable
  }

  if (!convexApi || stats === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  // Use custom renderer if provided
  if (renderStats) {
    return <>{renderStats(stats)}</>;
  }

  // Default stats display
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood Trends ({days} days)</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalEntries}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.averageMood.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Average Mood</Text>
        </View>
      </View>
      {Object.keys(stats.distribution).length > 0 && (
        <View style={styles.distribution}>
          <Text style={styles.distributionTitle}>Distribution</Text>
          {Object.entries(stats.distribution).map(([mood, count]) => (
            <View key={mood} style={styles.distributionRow}>
              <Text style={styles.moodLabel}>{mood}</Text>
              <Text style={styles.moodCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  distribution: {
    marginTop: 8,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  moodLabel: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  moodCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
});
