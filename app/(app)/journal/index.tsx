import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import BottomNavigation from "../../../components/BottomNavigation";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
 import { useQuery } from "convex/react";
 import { api } from "../../../convex/_generated/api";
 import { useTheme } from "../../../contexts/ThemeContext";
 import StatusModal from "../../../components/StatusModal";
 import { LinearGradient } from "expo-linear-gradient";
 import OptimizedImage from "../../../components/OptimizedImage";
const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

// Template type from Convex listTemplates
type JournalTemplate = {
  id: number;
  name: string;
  description: string;
  icon: string;
  prompts?: string[];
};

export default function JournalScreen() {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("journal");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });
  const [timeOfDay, setTimeOfDay] = useState<'Morning' | 'Evening'>('Morning');

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  // Templates (Quick Journal)
  const templates = (useQuery(api.journal.listTemplates, {}) as JournalTemplate[] | undefined) ?? [];

  // Determine hero card copy and default template based on Morning/Evening
  const heroCopy = timeOfDay === 'Morning'
    ? { title: "Let's start your day", subtitle: "Begin with a mindful morning reflection." }
    : { title: "Unwind your evening", subtitle: "Slow down with a gentle check‑in and reflections." };

  const getTemplateIdByName = (name: string) => {
    const tpl = templates.find(t => t.name.toLowerCase().includes(name));
    return tpl?.id;
  };
  const morningTplId = getTemplateIdByName('gratitude') ?? 1;
  const eveningTplId = getTemplateIdByName('mood') ?? 2;


  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const handleCreateJournal = () => {
    router.push("/(app)/journal/journal-create");
  };

  const handleViewAllEntries = () => {
    router.push("/(app)/journal/journal-history");
  };

  const handleStartTemplate = (tplId: number) => {
    router.push({ pathname: "/(app)/journal/journal-create", params: { templateId: String(tplId) } });
  };

  const handleHeroPress = () => {
    const nextId = timeOfDay === 'Morning' ? morningTplId : eveningTplId;
    handleStartTemplate(nextId);
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Journal" showBack={true} showMenu={true} />

        <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}>
          <View style={styles.content}>
            <WeekStrip />

            {/* My Journal Header */}
            <SectionHeader
              title="My Journal"
              onSeeAll={handleViewAllEntries}
              textColor={theme.colors.text}
              hintColor={theme.colors.textSecondary}
            />

            {/* Feature Card + Vertical Time Toggle */}
            <View style={styles.featureRow}>
              <TouchableOpacity style={styles.featureCard} onPress={handleHeroPress} activeOpacity={0.9}>
                <LinearGradient
                  colors={[theme.isDark ? '#EEA84E' : '#F9C257', theme.isDark ? '#F1B766' : '#FAD58D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureGradient}
                >
                  <Text style={[styles.featureTitle, { color: '#1F1B14' }]}>{heroCopy.title}</Text>
                  <Text style={[styles.featureSubtitle, { color: '#3D3426' }]}>{heroCopy.subtitle}</Text>
                  <View style={styles.sunRow}>
                    <Ionicons name={timeOfDay === 'Morning' ? 'sunny' : 'moon'} size={48} color="#F57C00" />
                    <View style={styles.heroImageWrap}>
                      <OptimizedImage
                        source={require('../../../assets/images/journal.png')}
                        style={{ width: 90, height: 90, opacity: 0.9 }}
                        resizeMode="contain"
                        accessibilityLabel="Decorative journal"
                      />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.verticalPill, { backgroundColor: theme.isDark ? '#BDB4AA' : '#D7CFC7' }]}
                onPress={() => setTimeOfDay((prev) => (prev === 'Morning' ? 'Evening' : 'Morning'))}
                activeOpacity={0.8}
              >
                <View style={styles.pillLabelWrapper}>
                  <Text style={[styles.pillLabel, { color: '#2C2620' }]}>{timeOfDay}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Journal */}
            <SectionHeader
              title="Quick Journal"
              onSeeAll={handleViewAllEntries}
              textColor={theme.colors.text}
              hintColor={theme.colors.textSecondary}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRow}
            >
              {/* Show curated quick cards first, or templates if none */}
              <QuickCard
                title="Pause & reflect"
                subtitle="What are you grateful for today?"
                color="#E9D5CA"
                tag="Personal"
                emoji="🌸"
                onPress={() => handleStartTemplate(getTemplateIdByName('gratitude') ?? 1)}
              />
              <QuickCard
                title="Set Intentions"
                subtitle="How do you want to feel?"
                color="#E3DBFB"
                tag="Family"
                emoji="😊"
                onPress={() => handleStartTemplate(getTemplateIdByName('mood') ?? 2)}
              />
              <QuickCard
                title="Free Write"
                subtitle="Let your thoughts flow freely"
                color="#DFF0E6"
                tag="Notes"
                emoji="✍️"
                onPress={() => handleStartTemplate(getTemplateIdByName('free') ?? 3)}
              />
              <QuickCard
                title="Emotions"
                subtitle="Express how you're feeling"
                color="#F3EDE5"
                tag="Mood"
                emoji="💭"
                onPress={handleCreateJournal}
              />
              <QuickCard
                title="Daily Goal"
                subtitle="What do you want to achieve?"
                color="#FFE8D6"
                tag="Goals"
                emoji="🎯"
                onPress={handleCreateJournal}
              />
            </ScrollView>
          </View>
        </ScrollView>

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideModal}
          buttonText="OK"
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Helper small components
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getCurrentWeek = () => {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // convert Sun=0 -> 6, Mon=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  return days;
};

const WeekStrip = () => {
  const days = getCurrentWeek();
  const today = new Date();
  const { theme, scaledFontSize } = useTheme();
  const styles = createStyles(scaledFontSize);
  return (
    <View style={styles.weekStrip}>
      {daysOfWeek.map((label, idx) => {
        const d = days[idx]!;
        const isToday =
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear();
        return (
          <View key={label} style={styles.dayItem}>
            <Text style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
            <View
              style={[
                styles.dayCircle,
                {
                  backgroundColor: isToday
                    ? Colors.warning
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.dayNumber, { color: isToday ? '#1F1B14' : theme.colors.text }]}>
                {d.getDate()}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const SectionHeader = ({
  title,
  onSeeAll,
  textColor,
  hintColor,
}: {
  title: string;
  onSeeAll?: () => void;
  textColor: string;
  hintColor: string;
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xl, marginBottom: Spacing.lg }}>
    <Text style={{ fontSize: 22, fontWeight: '700', color: textColor }}>{title}</Text>
    {onSeeAll ? (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={{ color: hintColor, textDecorationLine: 'underline' }}>See all</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const QuickCard = ({ title, subtitle, color, tag, emoji, onPress }: { title: string; subtitle: string; color: string; tag: string; emoji?: string; onPress: () => void }) => {
  const { theme, scaledFontSize } = useTheme();
  const styles = createStyles(scaledFontSize);
  return (
    <TouchableOpacity style={[styles.quickCard, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.9}>
      {emoji && <Text style={styles.quickEmoji}>{emoji}</Text>}
      <Text style={[styles.quickTitle, { color: theme.isDark ? '#1F1B14' : '#1F1B14' }]} numberOfLines={1}>{title}</Text>
      <Text style={[styles.quickSubtitle, { color: '#3D3426' }]} numberOfLines={2}>{subtitle}</Text>
      <View style={styles.quickChipsRow}>
        <View style={[styles.chip, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.chipText, { color: '#2C2620' }]}>Today</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: '#FFE4E8' }]}>
          <Text style={[styles.chipText, { color: '#9A4455' }]}>{tag}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const pickTemplateColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('gratitude')) return '#F6E6DB'; // peach
  if (n.includes('mood')) return '#E8E2FA'; // lavender
  if (n.includes('free')) return '#DFF0E6'; // mint
  return '#EDE8E2';
};

const pickTemplateTag = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('gratitude')) return 'Personal';
  if (n.includes('mood')) return 'Family';
  if (n.includes('free')) return 'Notes';
  return 'General';
};

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  weekStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  dayItem: {
    alignItems: 'center',
    width: (Dimensions.get('window').width - Spacing.xl * 2) / 7 - 2,
  },
  dayLabel: {
    fontSize: scaledFontSize(11),
    marginBottom: 6,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: scaledFontSize(13),
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  featureCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  featureGradient: {
    padding: Spacing.xl,
    height: 200,
    justifyContent: 'space-between',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  featureSubtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  sunRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  heroImageWrap: {
    marginLeft: 'auto',
  },
  verticalPill: {
    width: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  pillLabelWrapper: {
    transform: [{ rotate: '-90deg' }],
  },
  pillLabel: {
    fontWeight: '500',
    fontSize: 11,
  },
  quickRow: {
    paddingVertical: Spacing.md,
    paddingBottom: 80,
  },
  quickCard: {
    width: 220,
    padding: Spacing.lg,
    borderRadius: 16,
    marginRight: Spacing.md,
  },
  quickEmoji: {
    fontSize: scaledFontSize(24),
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  quickSubtitle: {
    fontSize: 13,
    marginBottom: 10,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});