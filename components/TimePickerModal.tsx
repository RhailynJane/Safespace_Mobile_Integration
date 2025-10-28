import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
// @ts-ignore - react-native-timer-picker types
import { TimerPicker } from "react-native-timer-picker";
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
  onSelect,
  onCancel,
  title = 'Select Time',
}: TimePickerModalProps) {
  const { theme } = useTheme();

  // Parse HH:MM to hours and minutes (24-hour input)
  const [hh, mm] = useMemo(() => value.split(":").map(Number) as [number, number], [value]);

  // Local temp state while the modal is open
  const [hours, setHours] = useState<number>(hh);
  const [minutes, setMinutes] = useState<number>(isNaN(mm) ? 0 : mm);

  // Update state when modal opens or when value changes
  useEffect(() => {
    setHours(hh);
    setMinutes(isNaN(mm) ? 0 : mm);
  }, [visible, value, hh, mm]);

  const handleHourChange = useCallback((picked: { hours?: number; minutes?: number; seconds?: number } & any) => {
    console.log('Hour picker change:', picked);
    if (typeof picked.hours === 'number') {
      console.log('Setting hours to:', picked.hours);
      setHours(picked.hours);
    }
  }, []);

  const handleMinuteChange = useCallback((picked: { hours?: number; minutes?: number; seconds?: number } & any) => {
    console.log('Minute picker change:', picked);
    if (typeof picked.minutes === 'number') {
      console.log('Setting minutes to:', picked.minutes);
      setMinutes(picked.minutes);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    console.log('Confirm called - hours:', hours, 'minutes:', minutes);
    const h24 = String(hours).padStart(2, '0');
    const m24 = String(minutes).padStart(2, '0');
    console.log('Final time string:', `${h24}:${m24}`);
    onSelect(`${h24}:${m24}`);
  }, [hours, minutes, onSelect]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 280,
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            overflow: 'hidden',
          }}
        >
          {/* Title */}
          <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>{title}</Text>
          </View>

          {/* Picker area */}
          <View style={{ paddingHorizontal: 4, paddingVertical: 8, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {/* Hour picker */}
              <View style={{ width: 50 }}>
                <TimerPicker
                  key={`hour-${value}`}
                  allowFontScaling={false}
                  padWithNItems={2}
                  hideSeconds
                  hideMinutes
                  hourLimit={{ min: 0, max: 23 }}
                  hourLabel=""
                  minuteLabel=""
                  secondLabel=""
                  initialValue={{ hours, minutes: 0 }}
                  onDurationChange={handleHourChange}
                  styles={{
                    theme: 'light',
                    backgroundColor: theme.colors.surface,
                    pickerItem: {
                      fontSize: 20,
                      lineHeight: 24,
                      includeFontPadding: false as any,
                      textAlign: 'center',
                      color: theme.colors.text,
                    },
                    pickerItemContainer: {
                      width: 50,
                      height: 44,
                    },
                    pickerLabelContainer: {
                      width: 0,
                    },
                    pickerContainer: {
                      marginRight: 0,
                    },
                  }}
                />
              </View>
              
              {/* Colon */}
              <Text style={{ fontSize: 20, fontWeight: '600', color: theme.colors.text, marginHorizontal: 4 }}>:</Text>
              
              {/* Minute picker */}
              <View style={{ width: 50 }}>
                <TimerPicker
                  key={`minute-${value}`}
                  allowFontScaling={false}
                  padWithNItems={2}
                  hideSeconds
                  hideHours
                  minuteLimit={{ min: 0, max: 59 }}
                  hourLabel=""
                  minuteLabel=""
                  secondLabel=""
                  initialValue={{ hours: 0, minutes }}
                  onDurationChange={handleMinuteChange}
                  styles={{
                    theme: 'light',
                    backgroundColor: theme.colors.surface,
                    pickerItem: {
                      fontSize: 20,
                      lineHeight: 24,
                      includeFontPadding: false as any,
                      textAlign: 'center',
                      color: theme.colors.text,
                    },
                    pickerItemContainer: {
                      width: 50,
                      height: 44,
                    },
                    pickerLabelContainer: {
                      width: 0,
                    },
                    pickerContainer: {
                      marginRight: 0,
                    },
                  }}
                />
              </View>
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
            >
              <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable 
              onPress={() => {
                console.log('Confirm button pressed - hours:', hours, 'minutes:', minutes);
                handleConfirm();
              }}
              android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
              style={({ pressed }) => ({
                paddingVertical: 12,
                paddingHorizontal: 28,
                borderRadius: 8,
                backgroundColor: pressed ? theme.colors.primary : theme.colors.primary,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: theme.colors.surface, fontSize: 16, fontWeight: '700' }}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
