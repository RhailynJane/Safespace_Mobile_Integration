/**
 * Icon Attribution:
 * Nose icon created by Kalashnyk - Flaticon
 * https://www.flaticon.com/free-icons/nose
 *
 * Taste/Tongue icon created by pojok d - Flaticon
 * https://www.flaticon.com/free-icons/taste
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

// Colors
const COLORS = {
  background: '#FFF5EE',
  text: '#5D4037',
  textSecondary: '#8D6E63',
  primary: '#4FC3F7',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  red: '#E53935',
  green: '#4CAF50',
  blue: '#2196F3',
  orange: '#FF9800',
  purple: '#9C27B0',
  pink: '#E91E63',
};

interface GroundingCategory {
  id: string;
  count: number;
  sense: string;
  icon: string;
  customImage?: any; // For custom PNG images
  color: string;
  prompt: string;
  isRecording: boolean;
  isPlaying: boolean;
  hasRecording: boolean;
}

// Custom images
const noseImage = require('../../../assets/images/nose.png');
const tongueImage = require('../../../assets/images/tongue.png');

const initialCategories: GroundingCategory[] = [
  {
    id: 'see',
    count: 5,
    sense: 'SEE',
    icon: 'eye',
    color: COLORS.blue,
    prompt: 'Name 5 things you can see around you',
    isRecording: false,
    isPlaying: false,
    hasRecording: false,
  },
  {
    id: 'touch',
    count: 4,
    sense: 'TOUCH',
    icon: 'hand-left',
    color: COLORS.green,
    prompt: 'Name 4 things you can touch and feel',
    isRecording: false,
    isPlaying: false,
    hasRecording: false,
  },
  {
    id: 'hear',
    count: 3,
    sense: 'HEAR',
    icon: 'ear',
    color: COLORS.orange,
    prompt: 'Name 3 things you can hear right now',
    isRecording: false,
    isPlaying: false,
    hasRecording: false,
  },
  {
    id: 'smell',
    count: 2,
    sense: 'SMELL',
    icon: '',
    customImage: noseImage,
    color: COLORS.purple,
    prompt: 'Name 2 things you can smell nearby',
    isRecording: false,
    isPlaying: false,
    hasRecording: false,
  },
  {
    id: 'taste',
    count: 1,
    sense: 'TASTE',
    icon: '',
    customImage: tongueImage,
    color: COLORS.pink,
    prompt: 'Name 1 thing you can taste or would like to taste',
    isRecording: false,
    isPlaying: false,
    hasRecording: false,
  },
];

export default function GroundingScreen() {
  const [categories, setCategories] = useState<GroundingCategory[]>(initialCategories);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('see');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Store recordings and sounds in refs (not persisted)
  const recordingsRef = useRef<{ [key: string]: Audio.Recording | null }>({});
  const soundsRef = useRef<{ [key: string]: Audio.Sound | null }>({});
  const recordingUrisRef = useRef<{ [key: string]: string | null }>({});

  // Start recording for a category
  const startRecording = async (categoryId: string) => {
    try {
      // Request permission
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone access to record audio.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingsRef.current[categoryId] = recording;

      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId ? { ...cat, isRecording: true } : cat
        )
      );
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  // Stop recording for a category
  const stopRecording = async (categoryId: string) => {
    const recording = recordingsRef.current[categoryId];
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      recordingUrisRef.current[categoryId] = uri;
      recordingsRef.current[categoryId] = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, isRecording: false, hasRecording: true }
            : cat
        )
      );
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Play recording for a category
  const playRecording = async (categoryId: string) => {
    const uri = recordingUrisRef.current[categoryId];
    if (!uri) return;

    try {
      // Stop any currently playing sound for this category
      const existingSound = soundsRef.current[categoryId];
      if (existingSound) {
        await existingSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      soundsRef.current[categoryId] = sound;

      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId ? { ...cat, isPlaying: true } : cat
        )
      );

      // Listen for playback completion
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setCategories(prev =>
            prev.map(cat =>
              cat.id === categoryId ? { ...cat, isPlaying: false } : cat
            )
          );
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Playback Error', 'Failed to play recording.');
    }
  };

  // Stop playing recording
  const stopPlaying = async (categoryId: string) => {
    const sound = soundsRef.current[categoryId];
    if (!sound) return;

    try {
      await sound.stopAsync();
      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId ? { ...cat, isPlaying: false } : cat
        )
      );
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  // Delete recording for a category
  const deleteRecording = (categoryId: string) => {
    recordingUrisRef.current[categoryId] = null;
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, hasRecording: false, isPlaying: false } : cat
      )
    );
  };

  // Calculate completion percentage
  const getCompletionPercentage = (): number => {
    const completed = categories.filter(cat => cat.hasRecording).length;
    return Math.round((completed / categories.length) * 100);
  };

  // Check if exercise is complete
  const isComplete = (): boolean => {
    return categories.every(cat => cat.hasRecording);
  };

  // Handle completion
  const handleComplete = () => {
    if (isComplete()) {
      setShowCompletionModal(true);
    } else {
      Alert.alert(
        'Incomplete',
        'Record a voice memo for each sense to complete the grounding exercise.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>5-4-3-2-1 Grounding</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${getCompletionPercentage()}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {getCompletionPercentage()}% Complete
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Ionicons name="mic" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Record yourself naming things for each sense. Tap and hold to record, release to stop. Recordings are not saved after leaving this page.
          </Text>
        </View>

        {/* Categories */}
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryContainer}>
            <TouchableOpacity
              style={[
                styles.categoryHeader,
                { backgroundColor: category.color },
                expandedCategory === category.id && styles.categoryHeaderExpanded
              ]}
              onPress={() => setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )}
            >
              <View style={styles.categoryTitleRow}>
                <View style={styles.categoryIcon}>
                  {category.customImage ? (
                    <Image
                      source={category.customImage}
                      style={styles.customIconImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons name={category.icon as any} size={24} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.categoryTitleContainer}>
                  <Text style={styles.categoryCount}>{category.count}</Text>
                  <Text style={styles.categorySense}>{category.sense}</Text>
                </View>
                {category.hasRecording && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Ionicons
                name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {expandedCategory === category.id && (
              <View style={styles.categoryContent}>
                <Text style={styles.categoryPrompt}>
                  {category.prompt}
                </Text>

                {/* Voice Recording Controls */}
                <View style={styles.recordingControls}>
                  {!category.isRecording ? (
                    <TouchableOpacity
                      style={[styles.recordButton, { backgroundColor: COLORS.red }]}
                      onPress={() => startRecording(category.id)}
                    >
                      <Ionicons name="mic" size={28} color="#FFFFFF" />
                      <Text style={styles.recordButtonText}>
                        {category.hasRecording ? 'Re-record' : 'Record'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.recordButton, styles.recordingActive]}
                      onPress={() => stopRecording(category.id)}
                    >
                      <Ionicons name="stop" size={28} color="#FFFFFF" />
                      <Text style={styles.recordButtonText}>Stop</Text>
                    </TouchableOpacity>
                  )}

                  {category.hasRecording && (
                    <>
                      <TouchableOpacity
                        style={[styles.playButton, { backgroundColor: COLORS.primary }]}
                        onPress={() =>
                          category.isPlaying
                            ? stopPlaying(category.id)
                            : playRecording(category.id)
                        }
                      >
                        <Ionicons
                          name={category.isPlaying ? 'pause' : 'play'}
                          size={24}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.deleteButton]}
                        onPress={() => deleteRecording(category.id)}
                      >
                        <Ionicons name="trash-outline" size={22} color={COLORS.red} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {category.isRecording && (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>Recording...</Text>
                  </View>
                )}

                {category.hasRecording && !category.isRecording && (
                  <Text style={styles.recordedText}>
                    Voice memo recorded
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Complete Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            { backgroundColor: isComplete() ? COLORS.green : COLORS.border }
          ]}
          onPress={handleComplete}
        >
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>Complete Exercise</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="checkmark-circle" size={64} color={COLORS.green} />
            </View>
            <Text style={styles.modalTitle}>
              Well Done!
            </Text>
            <Text style={styles.modalMessage}>
              You've completed the 5-4-3-2-1 grounding exercise. Take a moment to notice how you feel now compared to before.
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
              onPress={() => {
                setShowCompletionModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={() => setShowCompletionModal(false)}
            >
              <Text style={styles.modalSecondaryText}>
                Stay on this page
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  categoryContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customIconImage: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  categoryCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  categorySense: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  checkmark: {
    marginLeft: 12,
  },
  categoryContent: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  categoryPrompt: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  recordingActive: {
    backgroundColor: '#757575',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.red,
  },
  recordingText: {
    fontSize: 14,
    color: COLORS.red,
    fontWeight: '500',
  },
  recordedText: {
    fontSize: 14,
    color: COLORS.green,
    marginTop: 12,
    fontWeight: '500',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: COLORS.text,
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    color: COLORS.textSecondary,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSecondaryButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
