import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Pressable,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../constants/theme";
import BottomNavigation from "../../../components/BottomNavigation";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import { useTheme } from "../../../contexts/ThemeContext";
import StatusModal from "../../../components/StatusModal";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface MoodEntry {
  id: string;
  mood_type: string;
  intensity: number;
  notes?: string;
  created_at: string;
  mood_emoji: string;
  mood_label: string;
  mood_factors: Array<{ factor: string }>;
}

const { width } = Dimensions.get("window");
const EMOJI_SIZE = width / 4.5;

type MoodType = "very-happy" | "happy" | "neutral" | "sad" | "very-sad" | "ecstatic" | "content" | "displeased" | "frustrated" | "annoyed" | "angry" | "furious";

interface MoodOption {
  id: MoodType;
  emoji: string;
  label: string;
  color: string;
  scale: Animated.Value;
  opacity: Animated.Value;
}

const MoodTrackingScreen: React.FC = () => {
  const { theme, scaledFontSize } = useTheme();
  const [activeTab, setActiveTab] = useState("home");
  const [selectedMoodCard, setSelectedMoodCard] = useState<string | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [activeEmoji, setActiveEmoji] = useState<MoodType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({ type: "info", title: "", message: "" });

  // Navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const showStatusModal = (
    type: "success" | "error" | "info",
    title: string,
    message: string
  ) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };
  const hideStatusModal = () => setModalVisible(false);

  // Initialize animated values for mood emojis with visual feedback
  const moodOptions = useRef<MoodOption[]>([
    {
      id: "very-happy",
      emoji: "😄",
      label: "Very Happy",
      color: "#4CAF50",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
    {
      id: "happy",
      emoji: "🙂",
      label: "Happy",
      color: "#8BC34A",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
    {
      id: "neutral",
      emoji: "😐",
      label: "Neutral",
      color: "#FFC107",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
    {
      id: "sad",
      emoji: "🙁",
      label: "Sad",
      color: "#FF9800",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
    {
      id: "very-sad",
      emoji: "😢",
      label: "Very Sad",
      color: "#F44336",
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
  ]).current;

  // New 3x3 mood grid - each mood is its own type (no mapping)
  const moodGrid = [
    { id: 'ecstatic', label: 'Ecstatic', emoji: '🤩', bg: '#CCE5FF', mapTo: 'ecstatic' as MoodType },
    { id: 'happy', label: 'Happy', emoji: '😃', bg: '#FFD1E0', mapTo: 'happy' as MoodType },
    { id: 'content', label: 'Content', emoji: '🙂', bg: '#D0E4FF', mapTo: 'content' as MoodType },
    { id: 'neutral', label: 'Neutral', emoji: '😐', bg: '#D5EFDB', mapTo: 'neutral' as MoodType },
    { id: 'displeased', label: 'Displeased', emoji: '😕', bg: '#FFEDD2', mapTo: 'displeased' as MoodType },
    { id: 'frustrated', label: 'Frustrated', emoji: '😖', bg: '#DFCFFF', mapTo: 'frustrated' as MoodType },
    { id: 'annoyed', label: 'Annoyed', emoji: '😒', bg: '#FFDEE3', mapTo: 'annoyed' as MoodType },
    { id: 'angry', label: 'Angry', emoji: '😠', bg: '#FFE2CC', mapTo: 'angry' as MoodType },
    { id: 'furious', label: 'Furious', emoji: '🤬', bg: '#FFD3D3', mapTo: 'furious' as MoodType },
  ];

  const factorOptions = [
    'work','family','relationship','friends','myself','school','coworkers','health','social interaction','financial','physical activity','weather','sleep'
  ];

  // Live subscription for recent moods (child component to avoid conditional hook)
  const LiveRecentMoods = ({ userId, onData }: { userId: string; onData: (e: MoodEntry[]) => void }) => {
    const live = useQuery(api.moods.getRecentMoods, { userId, limit: 5 }) as any[] | undefined;
    useEffect(() => {
      if (Array.isArray(live)) {
        onData(live as unknown as MoodEntry[]);
        setLoading(false);
      }
    }, [live, onData]);
    return null;
  };

  // Handle emoji press animation for visual feedback
  const handleEmojiPressIn = (moodId: MoodType) => {
    setActiveEmoji(moodId);
    moodOptions.forEach((emoji) => {
      if (emoji.id === moodId) {
        Animated.spring(emoji.scale, {
          toValue: 1.2,
          useNativeDriver: true,
          friction: 3,
        }).start();
      } else {
        Animated.spring(emoji.opacity, {
          toValue: 0.3,
          useNativeDriver: true,
          friction: 3,
        }).start();
      }
    });
  };

  // Reset emoji animations when press is released
  const handleEmojiPressOut = () => {
    setActiveEmoji(null);
    moodOptions.forEach((emoji) => {
      Animated.parallel([
        Animated.spring(emoji.scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.spring(emoji.opacity, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
      ]).start();
    });
  };

  // Navigate to mood logging with the chosen canonical mood
  const proceedNext = () => {
    if (!selectedMoodCard) {
      showStatusModal('info', 'Choose a mood', 'Please pick how your day felt to continue.');
      return;
    }
    const selected = moodGrid.find(m => m.id === selectedMoodCard);
    const mapped = selected?.mapTo || 'neutral';
    const factorsParam = selectedFactors.join(',');
    handleEmojiPressOut();
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        try {
          const params = new URLSearchParams({ 
            selectedMood: mapped, 
            factors: factorsParam,
            selectedId: selected?.id || '',
            selectedLabel: selected?.label || '',
            selectedEmoji: selected?.emoji || '',
          });
          router.push(`/(app)/mood-tracking/mood-logging?${params.toString()}`);
        } catch (_e) {
          showStatusModal('error', 'Navigation Error', 'Unable to open mood logging. Please try again.');
        }
      });
    });
  };

  // Render original animated emoji (kept for possible reuse below grid)
  const renderMoodEmoji = (mood: MoodOption) => {
    return (
      <Pressable
        key={mood.id}
        onPressIn={() => handleEmojiPressIn(mood.id)}
        onPressOut={handleEmojiPressOut}
        onPress={() => setSelectedMoodCard(mood.id)}
        style={styles.emojiContainer}
      >
        <Animated.View
          style={[
            styles.emojiWrapper,
            {
              transform: [{ scale: mood.scale }],
              opacity: mood.opacity,
            },
          ]}
        >
          <View
            style={[
              styles.emojiBubble,
              { backgroundColor: mood.color + '26', shadowColor: theme.isDark ? '#000' : mood.color }
            ]}
          >
            <Text
              style={[
                styles.emoji,
                { textShadowColor: '#00000030', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
              ]}
            >
              {mood.emoji}
            </Text>
          </View>
          <Text style={[styles.emojiLabel, { color: theme.colors.text }]}>
            {mood.label}
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  return (
    <CurvedBackground>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        {/* Header with navigation controls */}
        <AppHeader title="Mood Tracker" showBack={true} />

        {/* Main scrollable content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* View History and Statistics buttons */}
          <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.isDark ? '#2A2A2A' : '#E8F5E9', flex: 1 }]}
                onPress={() => router.push('/(app)/mood-tracking/mood-history')}
              >
                <Ionicons name="time-outline" size={20} color="#7CB342" />
                <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>View History</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.isDark ? '#2A2A2A' : '#F3E5F5', flex: 1 }]}
                onPress={() => router.push('/(app)/mood-tracking/statistics')}
              >
                <Ionicons name="stats-chart-outline" size={20} color="#9C27B0" />
                <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Statistics</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mood selection grid (exact 3x3 using FlatList) */}
          <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>How was your day?</Text>
            <View style={styles.flatGridContent}>
              {/* Render mood grid in rows of 3 */}
              {[0, 1, 2].map((rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.columnWrapper}>
                  {moodGrid.slice(rowIndex * 3, rowIndex * 3 + 3).map((item) => {
                    const selected = selectedMoodCard === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.moodCardNew,
                          selected && styles.moodCardNewSelected,
                          { backgroundColor: item.bg },
                        ]}
                        activeOpacity={0.85}
                        onPress={() => setSelectedMoodCard(item.id)}
                      >
                        {/* Native text emoji */}
                        <Text style={styles.moodCardEmojiNew}>{item.emoji}</Text>
                        <Text style={styles.moodCardLabelNew}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Factors chips and selected factors summary */}
          <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: Spacing.md }]}>What was it about?</Text>
            <View style={styles.chipsRow}>
              {factorOptions.map((f) => {
                const isOn = selectedFactors.includes(f);
                return (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.chip,
                      isOn && styles.chipOn,
                      { backgroundColor: isOn ? Colors.primary : (theme.isDark ? '#2A2A2A' : '#F1F1F1') },
                    ]}
                    onPress={() =>
                      setSelectedFactors((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, { color: isOn ? '#FFF' : theme.colors.text }]}>{f}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.selectedFactorsBox, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? '#444' : '#E0E0E0' }] }>
              <Text style={[styles.selectedFactorsTitle, { color: theme.colors.text }]}>Selected factors</Text>
              <Text style={[styles.selectedFactorsText, { color: theme.colors.text }]}>
                {selectedFactors.length ? selectedFactors.join(', ') : 'None selected'}
              </Text>
            </View>
          </View>

          {/* Next button matching the reference flow */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: Colors.success, opacity: selectedMoodCard ? 1 : 0.6 }
            ]}
            onPress={proceedNext}
            disabled={!selectedMoodCard}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          {/* Extra bottom padding for better scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Status Modal for error handling */}
        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideStatusModal}
          buttonText="OK"
        />

        {/* Bottom navigation bar */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </View>
    </CurvedBackground>
  );
};

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
  },
  // Grid styles for FlatList 3 columns
  flatGridContent: {
    paddingTop: Spacing.md,
  },
  columnWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  moodCardNew: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodCardNewSelected: {
    borderColor: '#4CAF50',
  },
  moodCardEmojiImage: {
    width: '70%',
    height: '55%',
    marginBottom: 6,
  },
  moodCardEmojiNew: { // fallback text emoji style (unused in image version but retained)
    fontSize: 40,
    marginBottom: 6,
    opacity: 100,
  },
  moodCardLabelNew: {
    fontSize: scaledFontSize(12),
    fontWeight: '600',
    color: '#333',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#F1F1F1',
    minHeight: 38,
  },
  chipOn: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    color: '#000',
    fontSize: scaledFontSize(13),
    fontWeight: '600',
  },
  chipTextOn: {
    color: '#FFF',
  },
  selectedFactorsBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedFactorsTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedFactorsText: {
    fontSize: scaledFontSize(12),
  },
  nextButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: scaledFontSize(16),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: scaledFontSize(16), // Base size 16px
    marginBottom: Spacing.lg,
    color: "#666",
  },
  entriesCount: {
    fontSize: scaledFontSize(12), // Base size 12px
  },
  moodGrid: {
    marginTop: Spacing.md,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.xl,
  },
  emojiContainer: {
    alignItems: "center",
    width: EMOJI_SIZE,
  },
  emojiWrapper: {
    alignItems: "center",
  },
  emojiBubble: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    borderRadius: EMOJI_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  emoji: {
    fontSize: EMOJI_SIZE * 0.7,
    marginBottom: Spacing.sm,
  },
  emojiLabel: {
    fontSize: scaledFontSize(14), // Base size 14px
    fontWeight: "500",
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: Spacing.sm,
    color: "#666",
  },
  recentMoodsContainer: {
    // Container for recent moods cards
  },
  moodCard: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  moodCardEmoji: {
    fontSize: scaledFontSize(28), // Base size 28px
    marginRight: Spacing.md,
  },
  moodCardContent: {
    flex: 1,
  },
  moodCardTitle: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  moodCardDate: {
    fontSize: scaledFontSize(14), // Base size 14px
    color: "#666",
  },
  emptyState: {
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: scaledFontSize(16), // Base size 16px
    marginTop: Spacing.md,
    fontWeight: "500",
    color: "#666",
  },
  emptyStateSubtext: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: Spacing.xs,
    textAlign: "center",
    color: "#666",
  },
  historyLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historyLinkText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "500",
  },
  bottomPadding: {
    height: 140, 
  },
});

export default MoodTrackingScreen;