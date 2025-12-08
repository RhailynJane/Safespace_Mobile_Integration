import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface TimePickerModalProps {
  visible: boolean;
  value: string; // HH:MM format (24-hour)
  onSelect: (time: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function TimePickerModal({
  visible,
  value,
  onCancel,
  title = 'Select Time',
  onSelect,
}: TimePickerModalProps) {
  const { theme } = useTheme();

  // Parse HH:MM to hours (24-hour input)
  const [hh] = useMemo(() => value.split(":").map(Number) as [number, number], [value]);

  // Local temp state while the modal is open
  const [selectedHour, setSelectedHour] = useState<number>(hh);

  // Update state when modal opens or when value changes
  useEffect(() => {
    setSelectedHour(hh);
  }, [visible, hh]);

  const handleConfirm = useCallback(() => {
    const h24 = String(selectedHour).padStart(2, '0');
    const timeString = `${h24}:00`;
    onSelect(timeString);
    onCancel();
  }, [selectedHour, onSelect, onCancel]);

  // Generate hour slots for every hour (09:00 to 20:00)
  const hours = Array.from({ length: 12 }, (_, i) => 9 + i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View testID="time-picker-modal" style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: '85%',
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            overflow: 'hidden',
          }}
        >
          {/* Title */}
          <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, textAlign: 'center' }}>{title}</Text>
          </View>

          {/* Time slots grid - 4 columns */}
          <View style={{ paddingHorizontal: 12, paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
              {hours.map((h) => (
                <Pressable
                  key={`hour-${h}`}
                  onPress={() => setSelectedHour(h)}
                  android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                  style={({ pressed }) => ({
                    flex: 0.22,
                    aspectRatio: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: h === selectedHour ? theme.colors.primary : theme.colors.background,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: h === selectedHour ? '700' : '600',
                      color: h === selectedHour ? theme.colors.surface : theme.colors.text,
                    }}
                  >
                    {String(h).padStart(2, '0')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 12, gap: 20, zIndex: 999 }}>
            <Pressable 
              onPress={onCancel} 
              android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
              style={({ pressed }) => ({
                paddingVertical: 12,
                paddingHorizontal: 28,
                borderRadius: 8,
                backgroundColor: pressed ? theme.colors.background : theme.colors.background,
                opacity: pressed ? 0.7 : 1,
              })}
              testID="cancel-time-button"
            >
              <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable 
              onPress={handleConfirm}
              android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
              style={({ pressed }) => ({
                paddingVertical: 12,
                paddingHorizontal: 28,
                borderRadius: 8,
                backgroundColor: pressed ? theme.colors.primary : theme.colors.primary,
                opacity: pressed ? 0.8 : 1,
              })}
              testID="confirm-time-button"
            >
              <Text style={{ color: theme.colors.surface, fontSize: 16, fontWeight: '700' }}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
