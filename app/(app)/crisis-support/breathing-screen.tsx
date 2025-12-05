import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Types
interface BreathingMethod {
  name: string;
  inhale: number;
  holdAfterInhale: number;
  exhale: number;
  holdAfterExhale: number;
}

type BreathingPhase = 'inhale' | 'holdAfterInhale' | 'exhale' | 'holdAfterExhale' | 'idle';

// Constants
const { width } = Dimensions.get('window');
const BASE_CIRCLE_SIZE = width * 0.6;

const BREATHING_METHODS: BreathingMethod[] = [
  {
    name: '4-4-4-4 Box Breathing',
    inhale: 4,
    holdAfterInhale: 4,
    exhale: 4,
    holdAfterExhale: 4,
  },
  {
    name: '4-7-8 Relaxing Breath',
    inhale: 4,
    holdAfterInhale: 7,
    exhale: 8,
    holdAfterExhale: 0,
  },
];

// Colors
const COLORS = {
  offWhiteBackground: '#FFF5EE',
  blueGlow: '#4FC3F7',
  greenGlow: '#81C784',
  cyanGlow: '#00BCD4',
  purpleGlow: '#B388FF',
  brownText: '#5D4037',
  stopButton: '#EF9A9A',
};

const TOTAL_BREATHS = 5;

export default function BreathingScreen() {
  // State
  const [selectedMethod, setSelectedMethod] = useState<BreathingMethod>(BREATHING_METHODS[0]);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [currentBreath, setCurrentBreath] = useState(0);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Animation refs
  const circleScale = useRef(new Animated.Value(0.4)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const gradientRotation = useRef(new Animated.Value(0)).current;

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef<BreathingPhase>('idle');

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = currentPhase;
  }, [currentPhase]);

  // Glow pulse animation (continuous)
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();

    return () => glowAnimation.stop();
  }, []);

  // Gradient rotation animation (continuous)
  useEffect(() => {
    const rotationAnimation = Animated.loop(
      Animated.timing(gradientRotation, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );
    rotationAnimation.start();

    return () => rotationAnimation.stop();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const getPhaseText = (): string => {
    switch (currentPhase) {
      case 'inhale':
        return 'Inhale';
      case 'holdAfterInhale':
        return 'Hold';
      case 'exhale':
        return 'Exhale';
      case 'holdAfterExhale':
        return 'Pause';
      case 'idle':
        return 'Breathe with the circle';
    }
  };

  const getGlowColor = (): string => {
    return COLORS.blueGlow;
  };

  const runPhase = (phase: BreathingPhase, breath: number) => {
    setCurrentPhase(phase);

    // Fade in text
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    let phaseDuration: number;

    switch (phase) {
      case 'inhale':
        phaseDuration = selectedMethod.inhale;
        Animated.timing(circleScale, {
          toValue: 1,
          duration: phaseDuration * 1000,
          useNativeDriver: true,
        }).start();
        break;
      case 'holdAfterInhale':
        phaseDuration = selectedMethod.holdAfterInhale;
        break;
      case 'exhale':
        phaseDuration = selectedMethod.exhale;
        Animated.timing(circleScale, {
          toValue: 0.4,
          duration: phaseDuration * 1000,
          useNativeDriver: true,
        }).start();
        break;
      case 'holdAfterExhale':
        phaseDuration = selectedMethod.holdAfterExhale;
        break;
      default:
        return;
    }

    // Schedule next phase
    timerRef.current = setTimeout(() => {
      nextPhase(phase, breath);
    }, phaseDuration * 1000);
  };

  const nextPhase = (current: BreathingPhase, breath: number) => {
    let nextPhaseValue: BreathingPhase;
    let nextBreath = breath;

    switch (current) {
      case 'inhale':
        if (selectedMethod.holdAfterInhale > 0) {
          nextPhaseValue = 'holdAfterInhale';
        } else {
          nextPhaseValue = 'exhale';
        }
        break;
      case 'holdAfterInhale':
        nextPhaseValue = 'exhale';
        break;
      case 'exhale':
        if (selectedMethod.holdAfterExhale > 0) {
          nextPhaseValue = 'holdAfterExhale';
        } else {
          if (breath < TOTAL_BREATHS) {
            nextBreath = breath + 1;
            setCurrentBreath(nextBreath);
            nextPhaseValue = 'inhale';
          } else {
            completeSession();
            return;
          }
        }
        break;
      case 'holdAfterExhale':
        if (breath < TOTAL_BREATHS) {
          nextBreath = breath + 1;
          setCurrentBreath(nextBreath);
          nextPhaseValue = 'inhale';
        } else {
          completeSession();
          return;
        }
        break;
      default:
        return;
    }

    runPhase(nextPhaseValue, nextBreath);
  };

  const startBreathing = () => {
    setIsRunning(true);
    setCurrentBreath(1);
    runPhase('inhale', 1);
  };

  const stopBreathing = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    circleScale.stopAnimation();
    setIsRunning(false);
    setCurrentPhase('idle');
    setCurrentBreath(0);

    Animated.timing(circleScale, {
      toValue: 0.4,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const completeSession = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsRunning(false);
    setCurrentPhase('idle');
    setShowCompletionModal(true);
  };

  // Interpolate rotation for gradient effect simulation
  const rotateInterpolate = gradientRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.brownText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Breathe</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Method Picker */}
      <TouchableOpacity
        style={styles.methodPicker}
        onPress={() => !isRunning && setShowMethodPicker(true)}
        disabled={isRunning}
      >
        <Text style={styles.methodText}>{selectedMethod.name}</Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.blueGlow} />
      </TouchableOpacity>

      {/* Breathing Circle */}
      <View style={styles.circleContainer}>
        {/* Outer glow */}
        <Animated.View
          style={[
            styles.glowOuter,
            {
              opacity: glowOpacity,
              backgroundColor: getGlowColor(),
              transform: [{ scale: circleScale }],
            },
          ]}
        />

        {/* Inner glow */}
        <Animated.View
          style={[
            styles.glowInner,
            {
              opacity: glowOpacity,
              backgroundColor: getGlowColor(),
              transform: [{ scale: circleScale }],
            },
          ]}
        />

        {/* Main circle */}
        <Animated.View
          style={[
            styles.mainCircle,
            {
              borderColor: getGlowColor(),
              transform: [{ scale: circleScale }, { rotate: rotateInterpolate }],
            },
          ]}
        />
      </View>

      {/* Phase Text */}
      <Animated.Text
        style={[
          styles.phaseText,
          {
            opacity: textOpacity,
            color: isRunning ? getGlowColor() : `${COLORS.brownText}99`,
          },
        ]}
      >
        {getPhaseText()}
      </Animated.Text>

      {/* Breath Counter */}
      {isRunning && (
        <Text style={styles.breathCounter}>
          Breath {currentBreath} of {TOTAL_BREATHS}
        </Text>
      )}

      {/* Start/Stop Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: isRunning
              ? `${COLORS.stopButton}CC`
              : `${COLORS.blueGlow}CC`,
          },
        ]}
        onPress={isRunning ? stopBreathing : startBreathing}
      >
        <Text style={styles.actionButtonText}>{isRunning ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>

      {/* Method Picker Modal */}
      <Modal
        visible={showMethodPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMethodPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMethodPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Breathing Method</Text>
            {BREATHING_METHODS.map((method, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalOption,
                  selectedMethod.name === method.name && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedMethod(method);
                  setShowMethodPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedMethod.name === method.name && styles.modalOptionTextSelected,
                  ]}
                >
                  {method.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={60} color={COLORS.greenGlow} />
            <Text style={styles.modalTitle}>Session Complete</Text>
            <Text style={styles.modalMessage}>
              Great job! You completed {TOTAL_BREATHS} breaths using {selectedMethod.name}.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCompletionModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
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
    backgroundColor: COLORS.offWhiteBackground,
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
    fontSize: 24,
    fontWeight: '300',
    color: COLORS.brownText,
  },
  headerSpacer: {
    width: 40,
  },
  methodPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.blueGlow}4D`,
  },
  methodText: {
    fontSize: 16,
    color: COLORS.brownText,
    marginRight: 8,
  },
  circleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: BASE_CIRCLE_SIZE + 60,
    height: BASE_CIRCLE_SIZE + 60,
    borderRadius: (BASE_CIRCLE_SIZE + 60) / 2,
    opacity: 0.2,
  },
  glowInner: {
    position: 'absolute',
    width: BASE_CIRCLE_SIZE + 40,
    height: BASE_CIRCLE_SIZE + 40,
    borderRadius: (BASE_CIRCLE_SIZE + 40) / 2,
    opacity: 0.3,
  },
  mainCircle: {
    width: BASE_CIRCLE_SIZE,
    height: BASE_CIRCLE_SIZE,
    borderRadius: BASE_CIRCLE_SIZE / 2,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  phaseText: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 16,
  },
  breathCounter: {
    fontSize: 14,
    color: `${COLORS.brownText}80`,
    textAlign: 'center',
    marginBottom: 40,
  },
  actionButton: {
    alignSelf: 'center',
    width: 160,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: COLORS.blueGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.offWhiteBackground,
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.brownText,
    marginTop: 12,
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.brownText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalOption: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  modalOptionSelected: {
    backgroundColor: `${COLORS.blueGlow}20`,
    borderWidth: 1,
    borderColor: COLORS.blueGlow,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.brownText,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: COLORS.blueGlow,
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: COLORS.blueGlow,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});