import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Modal, Pressable, Text, View, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
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
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Parse HH:MM to hours and minutes (24-hour input)
  const [hh, mm] = useMemo(() => value.split(":").map(Number) as [number, number], [value]);

  // Local temp state while the modal is open
  const [selectedHour, setSelectedHour] = useState<number>(hh);
  const [selectedMinute, setSelectedMinute] = useState<number>(isNaN(mm) ? 0 : mm);

  // Update state when modal opens or when value changes
  useEffect(() => {
    setSelectedHour(hh);
    setSelectedMinute(isNaN(mm) ? 0 : mm);
  }, [visible, hh, mm]);

  // Scroll to selected position ONLY when modal opens
  useEffect(() => {
    if (visible && hourScrollRef.current) {
      setTimeout(() => {
        const offsetY = hh * 44;
        hourScrollRef.current?.scrollTo({ y: offsetY, animated: false });
      }, 50);
    }
  }, [visible, hh]);

  useEffect(() => {
    if (visible && minuteScrollRef.current) {
      setTimeout(() => {
        const offsetY = (isNaN(mm) ? 0 : mm) * 44;
        minuteScrollRef.current?.scrollTo({ y: offsetY, animated: false });
      }, 50);
    }
  }, [visible, mm]);

  const handleConfirm = useCallback(() => {
    console.log('Confirm called - hours:', selectedHour, 'minutes:', selectedMinute);
    const h24 = String(selectedHour).padStart(2, '0');
    const m24 = String(selectedMinute).padStart(2, '0');
    const timeString = `${h24}:${m24}`;
    console.log('Final time string:', timeString);
    onSelect(timeString);
    onCancel();
  }, [selectedHour, selectedMinute, onSelect, onCancel]);

  // Generate hour and minute arrays
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleHourScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 44);
    setSelectedHour(Math.max(0, Math.min(23, index)));
  };

  const handleMinuteScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 44);
    setSelectedMinute(Math.max(0, Math.min(59, index)));
  };

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
            width: 280,
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            overflow: 'hidden',
          }}
        >
          {/* Title */}
          <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, textAlign: 'center' }}>{title}</Text>
          </View>

          {/* Picker area with ScrollView for hour and minute selection */}
          <View style={{ paddingHorizontal: 4, paddingVertical: 8, alignItems: 'center', height: 220, position: 'relative', overflow: 'hidden' }}>
            {/* Green highlight background for center - displays in the middle */}
            <View style={{
              position: 'absolute',
              top: 100,
              left: 20,
              right: 20,
              height: 44,
              backgroundColor: theme.colors.primary,
              borderRadius: 8,
              zIndex: 0,
              pointerEvents: 'none',
            }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%', zIndex: 1, paddingTop: 7 }}>
              {/* Hour picker */}
              <View style={{ width: 70, flex: 1 }}>
                <ScrollView
                  ref={hourScrollRef}
                  showsVerticalScrollIndicator={false}
                  scrollEventThrottle={16}
                  snapToInterval={44}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleHourScroll}
                  nestedScrollEnabled={true}
                  testID="hour-picker"
                >
                  <View style={{ height: 88 }} />
                  {hours.map((h) => (
                    <View
                      key={`hour-${h}`}
                      style={{
                        height: 44,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: h === selectedHour ? '700' : '500',
                          color: h === selectedHour ? '#FFFFFF' : theme.colors.text,
                        }}
                      >
                        {String(h).padStart(2, '0')}
                      </Text>
                    </View>
                  ))}
                  <View style={{ height: 88 }} />
                </ScrollView>
              </View>

              {/* Colon separator */}
              <Text style={{ fontSize: 25, fontWeight: '700', color: theme.colors.text, marginHorizontal: 7, zIndex: 3, paddingTop: 10 }}>:</Text>

              {/* Minute picker */}
              <View style={{ width: 70, flex: 1 }}>
                <ScrollView
                  ref={minuteScrollRef}
                  showsVerticalScrollIndicator={false}
                  scrollEventThrottle={16}
                  snapToInterval={44}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMinuteScroll}
                  nestedScrollEnabled={true}
                  testID="minute-picker"
                >
                  <View style={{ height: 88 }} />
                  {minutes.map((m) => (
                    <View
                      key={`minute-${m}`}
                      style={{
                        height: 44,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: m === selectedMinute ? '700' : '500',
                          color: m === selectedMinute ? '#FFFFFF' : theme.colors.text,
                        }}
                      >
                        {String(m).padStart(2, '0')}
                      </Text>
                    </View>
                  ))}
                  <View style={{ height: 88 }} />
                </ScrollView>
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
