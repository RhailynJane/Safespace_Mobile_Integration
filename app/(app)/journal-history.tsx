// File: app/(app)/journal-history.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  emotion: string;
  emoji: string;
  date: string;
  fullDate: string;
}

// Mock journal entries
const journalEntries: JournalEntry[] = [
  {
    id: '1',
    title: 'A Quiet, Ordinary Day',
    content: 'Today felt heavy, nothing particularly exciting or upsetting. I spent some time around my family, but we mostly did our own things, which was fine by me. My thoughts like a constant chatter in my head - random stuff coming and going with no clear pattern...',
    emotion: 'neutral',
    emoji: '😐',
    date: 'Today, 9:41 AM',
    fullDate: 'May 13, 2024'
  },
  {
    id: '2',
    title: 'Productive Monday',
    content: 'Started the week with energy and motivation. Completed all my tasks and even had time for a walk in the park. Feeling grateful for small moments of peace.',
    emotion: 'happy',
    emoji: '🙂',
    date: 'Yesterday, 2:30 PM',
    fullDate: 'May 12, 2024'
  },
  {
    id: '3',
    title: 'Reflective Evening',
    content: 'Spent time thinking about my goals and where I want to be in the future. Sometimes uncertainty feels overwhelming, but tonight it feels like possibility.',
    emotion: 'hopeful',
    emoji: '😌',
    date: '2 days ago',
    fullDate: 'May 11, 2024'
  }
];

type FilterType = 'all' | 'week' | 'month';

export default function JournalHistoryScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const handleEntryPress = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

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

  const renderJournalEntry = (entry: JournalEntry) => {
    const isExpanded = expandedEntry === entry.id;
    
    return (
      <TouchableOpacity 
        key={entry.id}
        style={styles.entryCard}
        onPress={() => handleEntryPress(entry.id)}
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <Text style={styles.entryDate}>{entry.date}</Text>
          </View>
          <View style={styles.entryMeta}>
            <Text style={styles.entryEmoji}>{entry.emoji}</Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.textSecondary}
              style={styles.expandIcon}
            />
          </View>
        </View>
        
        <Text 
          style={styles.entryContent} 
          numberOfLines={isExpanded ? undefined : 3}
        >
          {entry.content}
        </Text>
        
        {!isExpanded && entry.content.length > 150 && (
          <Text style={styles.readMore}>Read more...</Text>
        )}
      </TouchableOpacity>
    );
  };

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
        
        <Text style={styles.headerTitle}>Journal</Text>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="grid-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Page Title */}
        <Text style={styles.pageTitle}>My Journal Entries</Text>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('week', 'Week')}
          {renderFilterButton('month', 'Month')}
        </View>

        {/* Journal Entries */}
        <View style={styles.entriesContainer}>
          {journalEntries.map(renderJournalEntry)}
        </View>

        {/* Empty State */}
        {journalEntries.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyStateText}>No journal entries yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start writing to capture your thoughts and feelings
            </Text>
            <TouchableOpacity 
              style={styles.addEntryButton}
              onPress={() => router.push('/(app)/journal-create')}
            >
              <Text style={styles.addEntryButtonText}>Write First Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Entry Button */}
        {journalEntries.length > 0 && (
          <TouchableOpacity 
            style={styles.floatingAddButton}
            onPress={() => router.push('/(app)/journal-create')}
          >
            <Ionicons name="add" size={28} color={Colors.surface} />
          </TouchableOpacity>
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
    paddingBottom: 100, // Space for floating button
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    ...Typography.subtitle,
    fontWeight: '600',
    marginBottom: 4,
  },
  entryDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  expandIcon: {
    marginLeft: Spacing.sm,
  },
  entryContent: {
    ...Typography.body,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  readMore: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateText: {
    ...Typography.title,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    color: Colors.textSecondary,
  },
  addEntryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  addEntryButtonText: {
    ...Typography.button,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});