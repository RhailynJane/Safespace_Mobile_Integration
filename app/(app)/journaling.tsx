// File: app/(app)/journal.tsx

import React, { useState, useEffect } from 'react';
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
}

// Mock journal entries (in real app, this would come from storage/backend)
const mockEntries: JournalEntry[] = [];

export default function JournalScreen() {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(mockEntries);

  // This would be called when returning from the create screen
  useEffect(() => {
    // In a real app, you'd fetch entries from storage here
  }, []);

  const handleCreateJournal = () => {
    router.push('/(app)/journal-create');
  };

  const handleViewAllEntries = () => {
    router.push('/(app)/journal-history');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Journal</Text>
            
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="grid-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            <Text style={styles.subText}>Express your thoughts and feelings</Text>

            {/* Create Journal Card */}
            <TouchableOpacity 
              style={styles.createCard}
              onPress={handleCreateJournal}
            >
              <View style={styles.createCardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="book" size={32} color={Colors.warning} />
                </View>
                
                <View style={styles.createTextContainer}>
                  <Text style={styles.createTitle}>Create Journal</Text>
                  <Text style={styles.createSubtitle}>
                    Set up a journal based on your current mood & conditions
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={handleCreateJournal}
                >
                  <Ionicons name="add-circle-outline" size={28} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Recent Journal Entries */}
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Journal Entries</Text>
              
              <View style={styles.recentContainer}>
                {journalEntries.length > 0 ? (
                  <>
                    {journalEntries.slice(0, 2).map((entry) => (
                      <TouchableOpacity key={entry.id} style={styles.entryCard}>
                        <View style={styles.entryHeader}>
                          <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                          <View style={styles.entryInfo}>
                            <Text style={styles.entryTitle}>{entry.title}</Text>
                            <Text style={styles.entryDate}>{entry.date}</Text>
                          </View>
                        </View>
                        <Text style={styles.entryPreview} numberOfLines={2}>
                          {entry.content}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    
                    <TouchableOpacity 
                      style={styles.viewAllButton}
                      onPress={handleViewAllEntries}
                    >
                      <Text style={styles.viewAllText}>View Journal Entries</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.noEntriesText}>No entries recorded</Text>
                    
                    <TouchableOpacity 
                      style={styles.viewAllButton}
                      onPress={handleViewAllEntries}
                    >
                      <Text style={styles.viewAllText}>View Journal Entries</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl, // Add padding for bottom navigation
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.primary + '30',
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
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
  notificationButton: {
    padding: Spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.xxl,
  },
  subText: {
    ...Typography.subtitle,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    color: Colors.textSecondary,
  },
  createCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    ...Typography.subtitle,
    fontWeight: '600',
    marginBottom: 4,
  },
  createSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  createButton: {
    padding: Spacing.sm,
  },
  recentSection: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  recentContainer: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 16,
    padding: Spacing.xl,
    minHeight: 200,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  entryEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  entryDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  entryPreview: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  noEntriesText: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: Spacing.huge,
    marginBottom: Spacing.huge,
  },
  viewAllButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  viewAllText: {
    ...Typography.link,
    textDecorationLine: 'underline',
  },
});