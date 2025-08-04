// File: app/(app)/mood-history.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface MoodEntry {
  id: string;
  mood: string;
  emoji: string;
  date: string;
  intensity: number;
  factors: string[];
  notes?: string;
}

// Mock mood history data
const moodHistory: MoodEntry[] = [
  {
    id: '1',
    mood: 'Happy',
    emoji: '🙂',
    date: 'May 13',
    intensity: 4,
    factors: ['Family', 'Sleep Quality'],
    notes: 'Had a great day with family'
  },
  {
    id: '2',
    mood: 'Neutral',
    emoji: '😐',
    date: 'May 12',
    intensity: 3,
    factors: ['Work/School Stress'],
  },
  {
    id: '3',
    mood: 'Sad',
    emoji: '🙁',
    date: 'May 11',
    intensity: 2,
    factors: ['Health Concerns', 'Weather'],
    notes: 'Feeling under the weather'
  }
];

type FilterType = 'all' | 'week' | 'month';

export default function MoodHistoryScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const renderMoodEntry = ({ item }: { item: MoodEntry }) => (
    <TouchableOpacity style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryInfo}>
          <View style={styles.moodBadge}>
            <Text style={styles.entryDate}>{item.date}</Text>
          </View>
          <Text style={styles.entryMood}>{item.mood}</Text>
        </View>
        <Text style={styles.entryEmoji}>{item.emoji}</Text>
      </View>
      
      {item.factors.length > 0 && (
        <View style={styles.factorsContainer}>
          {item.factors.map((factor, index) => (
            <View key={index} style={styles.factorChip}>
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
        </View>
      )}
      
      {item.notes && (
        <Text style={styles.entryNotes}>{item.notes}</Text>
      )}
    </TouchableOpacity>
  );

  const renderFilterButton = (filter: FilterType, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text style={[
        styles.filterText,
        activeFilter === filter && styles.filterTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Mood</Text>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="grid-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Page Title */}
        <Text style={styles.pageTitle}>My Mood History</Text>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('week', 'Week')}
          {renderFilterButton('month', 'Month')}
        </View>

        {/* Mood Entries */}
        <View style={styles.entriesContainer}>
          {moodHistory.map((item) => (
            <View key={item.id}>
              {renderMoodEntry({ item })}
            </View>
          ))}
        </View>

        {/* Empty State */}
        {moodHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No mood entries yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start tracking your mood to see your history here
            </Text>
            <TouchableOpacity 
              style={styles.addMoodButton}
              onPress={() => router.push('/(app)/mood')}
            >
              <Text style={styles.addMoodButtonText}>Add Mood Entry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary + '30',
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...Typography.title,
    fontWeight: '600',
  },
  menuButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  pageTitle: {
    ...Typography.title,
    fontSize: 28,
    fontWeight: '600',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 25,
    padding: 4,
    marginBottom: Spacing.xxl,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: 21,
  },
  filterButtonActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  entriesContainer: {
    paddingBottom: Spacing.xxl,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  moodBadge: {
    backgroundColor: Colors.textSecondary,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  entryDate: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  entryMood: {
    ...Typography.subtitle,
    fontWeight: '600',
  },
  entryEmoji: {
    fontSize: 32,
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  factorChip: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
  },
  factorText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '500',
  },
  entryNotes: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyStateText: {
    ...Typography.title,
    marginBottom: Spacing.md,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  addMoodButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  addMoodButtonText: {
    ...Typography.button,
  },
});