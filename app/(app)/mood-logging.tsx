// File: app/(app)/mood-logging.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/theme';

type MoodType = 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad';
type LoggingStep = 'intensity' | 'factors' | 'notes' | 'complete';

interface MoodData {
  type: MoodType;
  emoji: string;
  label: string;
  intensity: number;
  factors: string[];
  notes: string;
}

const moodConfig = {
  'very-happy': { emoji: '😄', label: 'Very Happy' },
  'happy': { emoji: '🙂', label: 'Happy' },
  'neutral': { emoji: '😐', label: 'Neutral' },
  'sad': { emoji: '🙁', label: 'Sad' },
  'very-sad': { emoji: '😢', label: 'Very Sad' },
};

const moodFactors = [
  'Family', 'Health Concerns', 'Sleep Quality', 'Social Interaction',
  'Financial Stress', 'Physical Activity', 'Work/School Stress', 'Weather'
];

export default function MoodLoggingScreen() {
  const { selectedMood } = useLocalSearchParams<{ selectedMood: MoodType }>();
  const [currentStep, setCurrentStep] = useState<LoggingStep>('intensity');
  const [moodData, setMoodData] = useState<MoodData>({
    type: selectedMood,
    emoji: moodConfig[selectedMood]?.emoji || '🙂',
    label: moodConfig[selectedMood]?.label || 'Happy',
    intensity: 3,
    factors: [],
    notes: '',
  });

  const handleIntensityChange = (value: number) => {
    setMoodData(prev => ({ ...prev, intensity: value }));
  };

  const handleFactorToggle = (factor: string) => {
    setMoodData(prev => ({
      ...prev,
      factors: prev.factors.includes(factor)
        ? prev.factors.filter(f => f !== factor)
        : [...prev.factors, factor]
    }));
  };

  const handleNotesChange = (text: string) => {
    setMoodData(prev => ({ ...prev, notes: text }));
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'intensity':
        setCurrentStep('factors');
        break;
      case 'factors':
        setCurrentStep('notes');
        break;
      case 'notes':
        setCurrentStep('complete');
        break;
      case 'complete':
        // Save mood data and navigate back
        saveMoodEntry();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'intensity':
        router.back();
        break;
      case 'factors':
        setCurrentStep('intensity');
        break;
      case 'notes':
        setCurrentStep('factors');
        break;
      case 'complete':
        setCurrentStep('notes');
        break;
    }
  };

  const saveMoodEntry = () => {
    // In a real app, this would save to your backend/local storage
    console.log('Saving mood entry:', moodData);
    
    Alert.alert(
      'Mood Logged!',
      'Your mood has been saved successfully.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(app)/mood')
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
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
  );

  const renderIntensityStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>How are you feeling this day?</Text>
      
      <View style={styles.moodDisplay}>
        <Text style={styles.largeMoodEmoji}>{moodData.emoji}</Text>
        <Text style={styles.moodLabel}>{moodData.label}</Text>
      </View>

      <View style={styles.intensitySection}>
        <Text style={styles.intensityLabel}>Intensity (1 - 5)</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Low</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={moodData.intensity}
            onValueChange={handleIntensityChange}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.disabled}
            thumbTintColor={Colors.primary}
          />
          <Text style={styles.sliderLabel}>High</Text>
        </View>
      </View>
    </View>
  );

  const renderFactorsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>How are you feeling this day?</Text>
      
      <View style={styles.moodDisplay}>
        <Text style={styles.largeMoodEmoji}>{moodData.emoji}</Text>
        <Text style={styles.moodLabel}>{moodData.label}</Text>
      </View>

      <View style={styles.intensitySection}>
        <Text style={styles.intensityLabel}>Intensity (1 - 5)</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Low</Text>
          <View style={styles.intensityIndicator}>
            <View style={styles.intensityDot} />
            <Text style={styles.intensityValue}>{moodData.intensity}</Text>
          </View>
          <Text style={styles.sliderLabel}>High</Text>
        </View>
      </View>

      <View style={styles.factorsSection}>
        <Text style={styles.factorsLabel}>What factors are affecting your mood?</Text>
        <View style={styles.factorsGrid}>
          {moodFactors.map((factor) => (
            <TouchableOpacity
              key={factor}
              style={[
                styles.factorButton,
                moodData.factors.includes(factor) && styles.factorButtonSelected
              ]}
              onPress={() => handleFactorToggle(factor)}
            >
              <Text style={[
                styles.factorText,
                moodData.factors.includes(factor) && styles.factorTextSelected
              ]}>
                {factor}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderNotesStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>How are you feeling this day?</Text>
      
      <View style={styles.moodDisplay}>
        <Text style={styles.largeMoodEmoji}>{moodData.emoji}</Text>
        <Text style={styles.moodLabel}>{moodData.label}</Text>
      </View>

      <View style={styles.intensitySection}>
        <Text style={styles.intensityLabel}>Intensity (1 - 5)</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Low</Text>
          <View style={styles.intensityIndicator}>
            <View style={styles.intensityDot} />
            <Text style={styles.intensityValue}>{moodData.intensity}</Text>
          </View>
          <Text style={styles.sliderLabel}>High</Text>
        </View>
      </View>

      <View style={styles.factorsSection}>
        <Text style={styles.factorsLabel}>What factors are affecting your mood?</Text>
        <View style={styles.selectedFactorsContainer}>
          {moodData.factors.map((factor) => (
            <View key={factor} style={styles.selectedFactor}>
              <Text style={styles.selectedFactorText}>{factor}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.notesSection}>
        <Text style={styles.notesLabel}>Notes: (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Start typing..."
          value={moodData.notes}
          onChangeText={handleNotesChange}
          multiline
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.completeContainer}>
      <Text style={styles.questionText}>How are you feeling?</Text>
      <Text style={styles.subText}>Tap an emoji to quickly log your mood</Text>

      <View style={styles.moodGrid}>
        <View style={styles.completeMoodDisplay}>
          <Text style={styles.completeMoodEmoji}>{moodData.emoji}</Text>
        </View>
      </View>

      <View style={styles.successMessage}>
        <Text style={styles.successTitle}>Mood Logged!</Text>
        <Text style={styles.successSubtitle}>Your mood has been saved</Text>
        
        <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/(app)/mood')}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentEntryPreview}>
        <Text style={styles.recentEntryEmoji}>{moodData.emoji}</Text>
        <Text style={styles.recentEntryLabel}>{moodData.label}</Text>
        <Text style={styles.recentEntryDate}>Today, 9:41 AM</Text>
      </View>
    </View>
  );

  const renderActionButtons = () => {
    if (currentStep === 'complete') return null;

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleNext}
        >
          <Text style={styles.saveButtonText}>
            {currentStep === 'notes' ? 'Save' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {renderHeader()}
        
        {currentStep === 'intensity' && renderIntensityStep()}
        {currentStep === 'factors' && renderFactorsStep()}
        {currentStep === 'notes' && renderNotesStep()}
        {currentStep === 'complete' && renderCompleteStep()}
        
        {renderActionButtons()}
      </ScrollView>
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
  stepContainer: {
    flex: 1,
    paddingTop: Spacing.xxl,
  },
  questionText: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  subText: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  moodDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  largeMoodEmoji: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  moodLabel: {
    ...Typography.title,
    fontWeight: '600',
  },
  intensitySection: {
    marginBottom: Spacing.xxl,
  },
  intensityLabel: {
    ...Typography.subtitle,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  sliderLabel: {
    ...Typography.caption,
    minWidth: 30,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: Spacing.lg,
  },
  intensityIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
  },
  intensityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  intensityValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  factorsSection: {
    marginBottom: Spacing.xxl,
  },
  factorsLabel: {
    ...Typography.subtitle,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  factorButton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.disabled,
  },
  factorButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  factorText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  factorTextSelected: {
    color: Colors.surface,
    fontWeight: '600',
  },
  selectedFactorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  selectedFactor: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  selectedFactorText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '500',
  },
  notesSection: {
    marginBottom: Spacing.xxl,
  },
  notesLabel: {
    ...Typography.subtitle,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    height: 120,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.disabled,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.disabled,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.button,
  },
  completeContainer: {
    flex: 1,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  moodGrid: {
    marginVertical: Spacing.xxl,
  },
  completeMoodDisplay: {
    alignItems: 'center',
  },
  completeMoodEmoji: {
    fontSize: 80,
  },
  successMessage: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    margin: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successTitle: {
    ...Typography.title,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  closeButtonText: {
    ...Typography.button,
  },
  recentEntryPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
    minWidth: 200,
  },
  recentEntryEmoji: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  recentEntryLabel: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentEntryDate: {
    ...Typography.caption,
  },
});