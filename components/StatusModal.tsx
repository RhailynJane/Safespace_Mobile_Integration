/**
 * StatusModal - Reusable modal component for displaying success/error messages
 * Replaces Alert.alert() with a consistent, theme-aware modal UI
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface StatusModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  buttonText?: string;
  // Optional secondary action (e.g., destructive confirm)
  secondaryButtonText?: string;
  onSecondaryButtonPress?: () => void;
  secondaryButtonType?: 'destructive' | 'default';
}

export default function StatusModal({
  visible,
  type,
  title,
  message,
  onClose,
  buttonText = 'OK',
  secondaryButtonText,
  onSecondaryButtonPress,
  secondaryButtonType = 'default',
}: StatusModalProps) {
  const { theme, isDarkMode } = useTheme();
  
  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#FF3B30';
      case 'info':
        return '#007AFF';
      default:
        return '#007AFF';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#FF3B30';
      case 'info':
        return '#007AFF';
      default:
        return '#007AFF';
    }
  };

  const getSecondaryButtonColors = () => {
    if (secondaryButtonType === 'destructive') {
      return { backgroundColor: 'transparent', borderColor: '#FF3B30', textColor: '#FF3B30' };
    }
    // default subtle style
    return { backgroundColor: 'transparent', borderColor: isDarkMode ? '#6B7280' : '#D1D5DB', textColor: isDarkMode ? '#E5E7EB' : '#374151' };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalOverlay,
        { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)' }
      ]}>
        <View style={[
          styles.modalContent,
          { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }
        ]}>
          <View style={styles.iconContainer}>
            <Ionicons name={getIconName()} size={64} color={getIconColor()} />
          </View>

          <Text style={[
            styles.title,
            { color: isDarkMode ? '#F9FAFB' : '#1F2937' }
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.message,
            { color: isDarkMode ? '#D1D5DB' : '#6B7280' }
          ]}>
            {message}
          </Text>

          {/* Buttons */}
          {secondaryButtonText ? (
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { borderColor: getSecondaryButtonColors().borderColor },
                ]}
                onPress={onSecondaryButtonPress}
              >
                <Text style={[styles.secondaryButtonText, { color: getSecondaryButtonColors().textColor }]}>
                  {secondaryButtonText}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: getButtonColor() }]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: getButtonColor() }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    // backgroundColor removed - now uses theme via inline override
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    // backgroundColor removed - now uses theme via inline override
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    // color removed - now uses theme via inline override
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
    // color removed - now uses theme via inline override
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 140,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
