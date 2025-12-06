import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { AppHeader } from '../../../components/AppHeader';
import CurvedBackground from '../../../components/CurvedBackground';

const { width } = Dimensions.get('window');

// Dangerous words that trigger crisis support prompt
const DANGEROUS_WORDS = [
  'death', 'kill', 'knife', 'hurt myself', 'suicide', 'die', 'end it',
  'harm myself', 'cut myself', 'self harm', 'self-harm', 'overdose',
  'jump off', 'hang myself', 'shooting', 'gun', 'pills'
];

interface Task {
  id: string;
  text: string;
  minutes: string;
  completed: boolean;
}

export default function FocusTimerScreen() {
  const { theme, scaledFontSize } = useTheme();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [flaggedText, setFlaggedText] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setActiveTaskId(null);
            Alert.alert('Timer Complete', 'Great job! You completed your task.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds]);

  // Check for dangerous words
  const checkForDangerousWords = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return DANGEROUS_WORDS.some(word => lowerText.includes(word));
  };

  // Handle task text change with dangerous word detection
  const handleTaskTextChange = (text: string) => {
    setNewTaskText(text);

    if (checkForDangerousWords(text)) {
      setFlaggedText(text);
      setShowCrisisModal(true);
    }
  };

  // Add new task
  const addTask = () => {
    if (!newTaskText.trim() || !newTaskMinutes.trim()) {
      Alert.alert('Missing Information', 'Please enter both a task and duration.');
      return;
    }

    const minutes = parseInt(newTaskMinutes);
    if (isNaN(minutes) || minutes <= 0 || minutes > 60) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration between 1 and 60 minutes.');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      minutes: newTaskMinutes,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setNewTaskText('');
    setNewTaskMinutes('');
  };

  // Start timer for a task
  const startTimer = (task: Task) => {
    const minutes = parseInt(task.minutes);
    setTimerSeconds(minutes * 60);
    setActiveTaskId(task.id);
    setIsTimerRunning(true);
  };

  // Pause/resume timer
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  // Stop timer
  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setActiveTaskId(null);
  };

  // Mark task as completed
  const toggleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    if (activeTaskId === taskId) {
      stopTimer();
    }
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Navigate to crisis support
  const handleCrisisSupport = () => {
    setShowCrisisModal(false);
    setNewTaskText('');
    router.back();
  };

  const styles = createStyles(scaledFontSize, theme);

  return (
    <CurvedBackground>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        {/* Use AppHeader component */}
        <AppHeader title="Focus Timer" showBack={true} showMenu={false} showNotifications={false} />

        {/* Timer Display */}
      {activeTaskId && (
        <View style={[styles.timerContainer, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.timerText}>{formatTime(timerSeconds)}</Text>
          <Text style={styles.timerLabel}>
            {tasks.find(t => t.id === activeTaskId)?.text}
          </Text>
          <View style={styles.timerControls}>
            <TouchableOpacity
              style={styles.timerButton}
              onPress={toggleTimer}
            >
              <Ionicons
                name={isTimerRunning ? 'pause' : 'play'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timerButton, styles.stopButton]}
              onPress={stopTimer}
            >
              <Ionicons name="stop" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prompt */}
        <View style={[styles.promptCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="leaf" size={24} color={theme.colors.primary} />
          <Text style={[styles.promptText, { color: theme.colors.text }]}>
            What is something calm that you enjoy that you can do right now?
          </Text>
        </View>

        {/* Task Input */}
        <View style={[styles.inputSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Add a calming activity</Text>

          <View style={styles.inputRow}>
            {/* Task Text Input - Left Column */}
            <View style={styles.taskInputContainer}>
              <TextInput
                style={[styles.taskInput, {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="e.g., Read a book, Take a walk..."
                placeholderTextColor={theme.colors.textSecondary}
                value={newTaskText}
                onChangeText={handleTaskTextChange}
                multiline
              />
            </View>

            {/* Minutes Input - Right Column */}
            <View style={styles.minutesInputContainer}>
              <TextInput
                style={[styles.minutesInput, {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="Min"
                placeholderTextColor={theme.colors.textSecondary}
                value={newTaskMinutes}
                onChangeText={setNewTaskMinutes}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.minutesLabel, { color: theme.colors.textSecondary }]}>min</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={addTask}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <View style={styles.taskList}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Tasks ({tasks.filter(t => !t.completed).length} remaining)
          </Text>

          {tasks.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="list-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No tasks yet. Add something calming to focus on.
              </Text>
            </View>
          ) : (
            tasks.map((task) => (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  { backgroundColor: theme.colors.surface },
                  task.completed && styles.taskCompleted,
                  activeTaskId === task.id && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
              >
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleTaskComplete(task.id)}
                >
                  <Ionicons
                    name={task.completed ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={task.completed ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text style={[
                    styles.taskText,
                    { color: theme.colors.text },
                    task.completed && styles.taskTextCompleted
                  ]}>
                    {task.text}
                  </Text>
                  <Text style={[styles.taskDuration, { color: theme.colors.textSecondary }]}>
                    {task.minutes} min
                  </Text>
                </View>

                <View style={styles.taskActions}>
                  {!task.completed && activeTaskId !== task.id && (
                    <TouchableOpacity
                      style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => startTimer(task)}
                    >
                      <Ionicons name="play" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteTask(task.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Encouragement */}
        <View style={[styles.encouragement, { backgroundColor: theme.isDark ? '#1B5E20' : '#E8F5E9' }]}>
          <Ionicons name="heart" size={24} color={theme.isDark ? '#81C784' : '#2E7D32'} />
          <Text style={[styles.encouragementText, { color: theme.isDark ? '#E8F5E9' : '#2E7D32' }]}>
            Remember: Focus on just the next hour. Small steps lead to big progress. You&apos;re doing great by taking this moment for yourself.
          </Text>
        </View>
      </ScrollView>

      {/* Crisis Support Modal */}
      <Modal
        visible={showCrisisModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCrisisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalIcon}>
              <Ionicons name="heart" size={48} color="#E53935" />
            </View>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              We Care About You
            </Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              We noticed some concerning words in your text. Would you like to talk to someone who can help?
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#E53935' }]}
              onPress={handleCrisisSupport}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.modalButtonText}>Call Crisis Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSecondaryButton, { borderColor: theme.colors.border }]}
              onPress={() => {
                setShowCrisisModal(false);
                setNewTaskText('');
              }}
            >
              <Text style={[styles.modalSecondaryText, { color: theme.colors.textSecondary }]}>
                I&apos;m okay, continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </CurvedBackground>
  );
}

const createStyles = (scaledFontSize: (size: number) => number, theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  timerContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  timerText: {
    fontSize: scaledFontSize(48),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerLabel: {
    fontSize: scaledFontSize(16),
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
  },
  timerControls: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  timerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: 'rgba(229, 57, 53, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  promptText: {
    flex: 1,
    fontSize: scaledFontSize(15),
    fontWeight: '500',
    lineHeight: 22,
  },
  inputSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: scaledFontSize(16),
    fontWeight: '600',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  taskInputContainer: {
    flex: 3,
  },
  taskInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: scaledFontSize(15),
    minHeight: 80,
    textAlignVertical: 'top',
  },
  minutesInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  minutesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: scaledFontSize(18),
    textAlign: 'center',
    width: '100%',
  },
  minutesLabel: {
    fontSize: scaledFontSize(12),
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: scaledFontSize(16),
    fontWeight: '600',
  },
  taskList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scaledFontSize(14),
    textAlign: 'center',
    marginTop: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  taskCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: scaledFontSize(15),
    fontWeight: '500',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
  },
  taskDuration: {
    fontSize: scaledFontSize(13),
    marginTop: 4,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  encouragement: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 40,
    gap: 12,
    alignItems: 'flex-start',
  },
  encouragementText: {
    flex: 1,
    fontSize: scaledFontSize(14),
    lineHeight: 20,
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
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: scaledFontSize(22),
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: scaledFontSize(15),
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
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
    fontSize: scaledFontSize(16),
    fontWeight: '600',
  },
  modalSecondaryButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: scaledFontSize(15),
  },
});
