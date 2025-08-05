// File: app/(app)/mood.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/theme';
import BottomNavigation from '../../components/BottomNavigation';

type MoodType = 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad';

interface MoodOption {
  id: MoodType;
  emoji: string;
  label: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  { id: 'very-happy', emoji: '😄', label: 'Very Happy', color: '#4CAF50' },
  { id: 'happy', emoji: '🙂', label: 'Happy', color: '#8BC34A' },
  { id: 'neutral', emoji: '😐', label: 'Neutral', color: '#FFC107' },
  { id: 'sad', emoji: '🙁', label: 'Sad', color: '#FF9800' },
  { id: 'very-sad', emoji: '😢', label: 'Very Sad', color: '#F44336' },
];

const recentEntries = [
  { mood: 'happy', date: 'Today, 9:41 AM', emoji: '🙂' },
];

export default function MoodTrackingScreen() {
  const [hoveredMood, setHoveredMood] = useState<MoodType | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);

  const handleMoodPress = (moodId: MoodType) => {
    setSelectedMood(moodId);
    // Navigate to mood logging flow with the selected mood
    router.push({
      pathname: '/(app)/mood-logging',
      params: { selectedMood: moodId }
    });
  };

  const handleMoodPressIn = (moodId: MoodType) => {
    setHoveredMood(moodId);
  };

  const handleMoodPressOut = () => {
    setHoveredMood(null);
  };

  const renderMoodEmoji = (mood: MoodOption, index: number) => {
    const isHovered = hoveredMood === mood.id;
    const isOtherHovered = hoveredMood && hoveredMood !== mood.id;
    
    return (
      <Pressable
        key={mood.id}
        style={[
          styles.moodButton,
          isOtherHovered && styles.blurredMood,
          isHovered && styles.hoveredMood,
        ]}
        onPress={() => handleMoodPress(mood.id)}
        onPressIn={() => handleMoodPressIn(mood.id)}
        onPressOut={handleMoodPressOut}
      >
        <View style={[styles.emojiContainer, { backgroundColor: mood.color + '20' }]}>
          <Text style={styles.emoji}>{mood.emoji}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Mood</Text>
          
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
          <Text style={styles.questionText}>How are you feeling?</Text>
          <Text style={styles.subText}>Tap an emoji to quickly log your mood</Text>

          {/* Mood Status (if feeling low) */}
          <Text style={styles.statusText}>I am feeling very low</Text>

          {/* Mood Emojis Grid */}
          <View style={styles.moodGrid}>
            {moodOptions.map((mood, index) => renderMoodEmoji(mood, index))}
          </View>

          {/* Recent Mood Entries */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Mood Entries</Text>
            
            <View style={styles.recentContainer}>
              {recentEntries.length > 0 ? (
                recentEntries.map((entry, index) => (
                  <View key={index} style={styles.recentEntry}>
                    <Text style={styles.recentEmoji}>{entry.emoji}</Text>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentMood}>{entry.mood}</Text>
                      <Text style={styles.recentDate}>{entry.date}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noEntriesText}>No entries recorded</Text>
              )}
              
              <TouchableOpacity 
                style={styles.viewHistoryButton}
                onPress={() => router.push('/(app)/mood-history')}
              >
                <Text style={styles.viewHistoryText}>View Mood History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />
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
  questionText: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subText: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statusText: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.link,
    fontStyle: 'italic',
    marginBottom: Spacing.xxl,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.huge,
    paddingHorizontal: Spacing.lg,
  },
  moodButton: {
    margin: Spacing.md,
    transform: [{ scale: 1 }],
  },
  blurredMood: {
    opacity: 0.3,
  },
  hoveredMood: {
    transform: [{ scale: 1.1 }],
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    fontSize: 36,
  },
  recentSection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.lg,
  },
  recentContainer: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 16,
    padding: Spacing.xl,
    minHeight: 200,
  },
  recentEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  recentEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentMood: {
    ...Typography.body,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  recentDate: {
    ...Typography.caption,
    marginTop: 2,
  },
  noEntriesText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.huge,
    marginBottom: Spacing.huge,
  },
  viewHistoryButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  viewHistoryText: {
    ...Typography.link,
  },
});