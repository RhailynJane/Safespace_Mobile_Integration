import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  SectionList,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useTheme } from "../../../contexts/ThemeContext";
import CurvedBackground from "../../../components/CurvedBackground";
import BottomNavigation from "../../../components/BottomNavigation";
import StatusModal from "../../../components/StatusModal";
import { AppHeader } from "../../../components/AppHeader";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const LIMIT = 40;

interface MoodEntry {
  id: string;
  mood_type: string;
  mood_emoji: string;
  mood_label: string;
  notes?: string;
  created_at: string; // ISO date
}

const tabs = [
  { route: "/(tabs)/home", label: "Home", icon: "home", id: "home", name: "Home" },
  { route: "/(tabs)/community-forum", label: "Forum", icon: "people", id: "community-forum", name: "Forum" },
  { route: "/(tabs)/appointments", label: "Appointments", icon: "calendar", id: "appointments", name: "Appointments" },
  { route: "/(tabs)/messages", label: "Messages", icon: "chatbubbles", id: "messages", name: "Messages" },
  { route: "/(tabs)/profile", label: "Profile", icon: "person", id: "profile", name: "Profile" },
];

const truncate = (v?: string, max = 120) => {
  if (!v) return "";
  return v.length <= max ? v : v.slice(0, max - 1) + "…";
};

const getMoodCardColor = (moodType: string): string => {
  const colors: Record<string, string> = {
    // Original moods
    "very-happy": "#FFD6E8",
    happy: "#FFD1E0",
    neutral: "#D5EFDB",
    sad: "#D4E5FF",
    "very-sad": "#FFD4D4",
    // New 3x3 mood grid
    ecstatic: "#CCE5FF",
    content: "#D0E4FF",
    displeased: "#FFEDD2",
    frustrated: "#DFCFFF",
    annoyed: "#FFDEE3",
    angry: "#FFE2CC",
    furious: "#FFD3D3",
  };
  return colors[moodType.toLowerCase()] || "#FFE8D4";
};

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  monthCursor: Date;
  setMonthCursor: (d: Date) => void;
  moodsByDay: Record<string, MoodEntry[]>;
}

const CalendarView: React.FC<CalendarProps> = ({ selectedDate, onSelectDate, monthCursor, setMonthCursor, moodsByDay }) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<"month" | "week">("month");

  const daysInMonth = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const arr: (Date | null)[] = [];
    
    // Add empty cells for days before the 1st to align with day of week
    const firstDayOfWeek = first.getDay(); // 0 = Sunday, 1 = Monday, etc.
    for (let i = 0; i < firstDayOfWeek; i++) {
      arr.push(null);
    }
    
    // Add all days of the month
    for (let d = 1; d <= last.getDate(); d++) {
      arr.push(new Date(y, m, d));
    }
    
    return arr;
  }, [monthCursor]);

  const weekDays = useMemo(() => {
    const today = new Date();
    const referenceDate = selectedDate || today;
    const idx = referenceDate.getDay();
    const start = new Date(referenceDate);
    start.setDate(referenceDate.getDate() - idx);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const fmt = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const shown = mode === "month" ? daysInMonth : weekDays;

  const changeMonth = (delta: number) => {
    setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + delta, 1));
  };

  return (
    <View style={[styles.calendarWrapper, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.calendarHeaderRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
          {monthCursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.modeRow}>
        {["month", "week"].map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m as any)}
            style={[
              styles.modeChip, 
              { backgroundColor: mode === m ? theme.colors.primary : "#E0E0E0" }
            ]}
          >
            <Text style={[styles.modeChipText, { color: mode === m ? "#FFF" : "#666" }]}>
              {m === "month" ? "Month" : "Week"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.weekdayHeaderRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
          <Text key={`weekday-${i}`} style={[styles.weekdayHeaderText, { color: theme.colors.textSecondary }]}>{w}</Text>
        ))}
      </View>
      <View style={styles.daysGrid}>
        {shown.map((d, idx) => {
          if (!d) {
            // Empty cell for alignment
            return <View key={`empty-${idx}`} style={styles.dayCell} />;
          }
          const key = fmt(d);
          const dayMoods = key ? moodsByDay[key] : undefined;
          const emoji = dayMoods?.[0]?.mood_emoji;
          const isSel = selectedDate ? fmt(selectedDate) === key : false;
          const isToday = fmt(new Date()) === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.dayCell, 
                isSel && { backgroundColor: theme.colors.primary, borderRadius: 20 },
                isToday && !isSel && { backgroundColor: theme.colors.background, borderRadius: 20 }
              ]}
              onPress={() => onSelectDate(d)}
            >
              {emoji ? (
                <Text style={styles.dayEmojiStyle}>{emoji}</Text>
              ) : (
                <Text style={[styles.dayNumberStyle, { color: isSel ? "#FFF" : theme.colors.text }]}>
                  {d.getDate()}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MoodHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const userId = user?.id;

  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0); // simple pagination
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthCursor, setMonthCursor] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [status, setStatus] = useState<{ visible: boolean; title?: string; message?: string; type?: "success" | "error" }>({ visible: false });
  const [activeTab, setActiveTab] = useState("home");
  const [deleteConfirm, setDeleteConfirm] = useState<{ visible: boolean; entry?: MoodEntry }>({ visible: false });

  const deleteMood = useMutation(api.moods.deleteMood);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    router.push(tabs.find(t => t.id === tabId)?.route || "/(tabs)/home");
  };

  // Define month range for server filtering
  const startDate = useMemo(() => monthCursor.toISOString().split("T")[0] + "T00:00:00.000Z", [monthCursor]);
  const endDate = useMemo(() => new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(), [monthCursor]);

  const history = useQuery(api.moods.getMoodHistory, userId ? { userId, limit: LIMIT, offset, startDate, endDate } : "skip") as { moods: MoodEntry[] } | undefined;
  const moods: MoodEntry[] = useMemo(() => history?.moods || [], [history]);
  const hasMore = moods.length === LIMIT; // naive heuristic

  const filtered = useMemo(() => {
    if (!search.trim()) return moods;
    const q = search.toLowerCase();
    return moods.filter((m) => (m.notes || "").toLowerCase().includes(q));
  }, [moods, search]);

  const sections = useMemo(() => {
    const grouped: Record<string, MoodEntry[]> = {};
    filtered.forEach((m) => {
      const d = new Date(m.created_at);
      const key = d.toLocaleString(undefined, { month: "long", year: "numeric" });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
    return Object.keys(grouped).map((title) => ({ title, data: grouped[title] || [] }));
  }, [filtered]);

  const moodsByDay = useMemo(() => {
    const map: Record<string, MoodEntry[]> = {};
    filtered.forEach((m) => {
      const d = new Date(m.created_at);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dayIso = `${year}-${month}-${day}`;
      if (!map[dayIso]) map[dayIso] = [];
      map[dayIso].push(m);
    });
    return map;
  }, [filtered]);

  const selectedDayMoods = useMemo(() => {
    if (!selectedDate) return [];
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    return moodsByDay[key] || [];
  }, [selectedDate, moodsByDay]);

  const confirmDelete = useCallback((entry: MoodEntry) => {
    setDeleteConfirm({ visible: true, entry });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm.entry) return;
    try {
      await deleteMood({ id: deleteConfirm.entry.id as any });
      setDeleteConfirm({ visible: false });
      setStatus({ visible: true, type: "success", title: "Deleted", message: "Mood entry removed." });
    } catch (e: any) {
      setDeleteConfirm({ visible: false });
      setStatus({ visible: true, type: "error", title: "Error", message: e.message || "Failed to delete" });
    }
  }, [deleteConfirm.entry, deleteMood]);

  const renderItem = ({ item }: { item: MoodEntry }) => {
    const dt = new Date(item.created_at);
    const stamp = dt.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={() => router.push(`/mood-tracking/${item.id}`)}>
        <Text style={styles.cardEmoji}>{item.mood_emoji}</Text>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.mood_label}</Text>
          {!!item.notes && <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>{truncate(item.notes)}</Text>}
          <Text style={[styles.cardDate, { color: theme.colors.textSecondary }]}>{stamp}</Text>
        </View>
        <TouchableOpacity style={styles.trashBtn} onPress={() => confirmDelete(item)}>
          <Ionicons name="trash" size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>        
        <AppHeader title="Mood History" showBack={true} />
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.monthHeader}><Text style={[styles.monthHeaderText, { color: theme.colors.text }]}>{section.title}</Text></View>
          )}
          ListHeaderComponent={(
            <>
              <View style={styles.searchWrapper}>
                <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.surface }] }>
                  <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="Search notes..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
              </View>
              <CalendarView
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                monthCursor={monthCursor}
                setMonthCursor={setMonthCursor}
                moodsByDay={moodsByDay}
              />
              {selectedDate && selectedDayMoods.length > 0 && (
                <View style={styles.selectedDaySection}>
                  <View style={styles.selectedDayHeader}>
                    <Text style={styles.selectedDayTitle}>
                      {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </Text>
                    <TouchableOpacity 
                      style={styles.selectedDayEmojiCircle}
                      onPress={() => selectedDayMoods[0] && router.push(`/mood-tracking/${selectedDayMoods[0].id}`)}
                    >
                      <Text style={styles.selectedDayEmoji}>{selectedDayMoods[0]?.mood_emoji}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.selectedDayLabel}>I was feeling</Text>
                  
                  <View style={styles.selectedDayTagsRow}>
                    {selectedDayMoods.map((entry) => (
                      <View key={entry.id} style={styles.moodTag}>
                        <Text style={styles.moodTagText}>{entry.mood_label}</Text>
                      </View>
                    ))}
                  </View>

                  {selectedDayMoods.some(m => m.notes) && (
                    <View style={styles.selectedDayNotesBox}>
                      <Text style={styles.selectedDayNotesLabel}>What Happened</Text>
                      {selectedDayMoods.filter(m => m.notes).map((entry) => (
                        <TouchableOpacity
                          key={entry.id}
                          style={[styles.notesCard, { backgroundColor: getMoodCardColor(entry.mood_type) }]}
                          onPress={() => router.push(`/mood-tracking/${entry.id}`)}
                        >
                          <View style={styles.notesContent}>
                            <Text style={styles.notesTitle} numberOfLines={1}>
                              {entry.notes?.split('\n')[0]?.split('.')[0] || 'Untitled'}
                            </Text>
                            <Text style={styles.notesPreview} numberOfLines={1}>
                              {entry.notes || ''}
                            </Text>
                          </View>
                          <Ionicons name="arrow-forward" size={20} color="#000" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
          onEndReached={() => hasMore && setOffset((p) => p + LIMIT)}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={(
            <View style={styles.emptyBox}>
              <Ionicons name="sad-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>No mood entries found</Text>
              <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: theme.colors.primary }]} onPress={() => router.push("/(app)/mood-tracking")}>
                <Text style={[styles.ctaBtnText, { color: "#FFF" }]}>Log Your First Mood</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        <BottomNavigation tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
        
        {/* Delete Confirmation Modal */}
        <StatusModal
          visible={deleteConfirm.visible}
          onClose={() => setDeleteConfirm({ visible: false })}
          title="Delete Mood Entry"
          message="Are you sure you want to delete this mood entry? This action cannot be undone."
          type="error"
          buttonText="Cancel"
          secondaryButtonText="Delete"
          onSecondaryButtonPress={handleDelete}
          secondaryButtonType="destructive"
        />
        
        <StatusModal
          visible={status.visible}
          onClose={() => setStatus({ visible: false })}
          title={status.title || ""}
          message={status.message || ""}
          type={status.type || "info"}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
};

export default MoodHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 120, paddingHorizontal: 12 },
  searchWrapper: { paddingHorizontal: 12, paddingTop: 8 },
  searchInputContainer: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  monthHeader: { paddingVertical: 6, paddingHorizontal: 4 },
  monthHeaderText: { fontSize: 18, fontWeight: "600" },
  emptyBox: { alignItems: "center", marginTop: 40 },
  emptyText: { marginTop: 12, fontSize: 16 },
  card: { flexDirection: "row", padding: 12, borderRadius: 14, marginVertical: 6, elevation: 2 },
  cardEmoji: { fontSize: 34, marginRight: 10 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSubtitle: { fontSize: 14, marginTop: 4 },
  cardDate: { fontSize: 12, marginTop: 6 },
  trashBtn: { padding: 6, alignSelf: "center" },
  ctaBtn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText: { fontSize: 16, fontWeight: "600" },
  // Calendar
  calendarWrapper: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12, marginHorizontal: 12, marginTop: 8, borderRadius: 20 },
  calendarHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  monthTitle: { fontSize: 18, fontWeight: "600" },
  arrowBtn: { padding: 4, borderRadius: 8 },
  modeRow: { flexDirection: "row", marginBottom: 8 },
  modeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  modeChipText: { fontSize: 14, fontWeight: "500" },
  weekdayHeaderRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 0, marginBottom: 8 },
  weekdayHeaderText: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { 
    width: `${100 / 7}%`, 
    aspectRatio: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 4 
  },
  dayNumberStyle: { fontSize: 13, fontWeight: "500" },
  dayEmojiStyle: { fontSize: 24 },
  // Selected day section
  selectedDaySection: { 
    marginHorizontal: 12, 
    marginTop: 12, 
    marginBottom: 16, 
    borderRadius: 24, 
    padding: 20, 
    backgroundColor: "#2C2C2E" 
  },
  selectedDayHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 16 
  },
  selectedDayTitle: { fontSize: 28, fontWeight: "700", color: "#FFF" },
  selectedDayEmojiCircle: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: "transparent", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  selectedDayEmoji: { fontSize: 40 },
  selectedDayLabel: { fontSize: 14, fontWeight: "400", color: "#FFF", marginBottom: 8 },
  selectedDayTagsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  moodTag: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 8, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFF",
    backgroundColor: "transparent"
  },
  moodTagText: { fontSize: 13, fontWeight: "500", color: "#FFF" },
  selectedDayNotesBox: { marginTop: 4 },
  selectedDayNotesLabel: { fontSize: 14, fontWeight: "400", color: "#FFF", marginBottom: 12 },
  notesCard: { 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    marginBottom: 8
  },
  notesContent: { flex: 1, marginRight: 12 },
  notesTitle: { fontSize: 15, fontWeight: "700", color: "#000", marginBottom: 4 },
  notesPreview: { fontSize: 13, color: "#666", lineHeight: 18 },
});
