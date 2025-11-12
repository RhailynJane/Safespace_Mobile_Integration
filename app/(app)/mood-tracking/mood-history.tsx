import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  SectionList,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import BottomNavigation from "../../../components/BottomNavigation";
import { APP_TIME_ZONE } from "../../../utils/timezone";
import { useTheme } from "../../../contexts/ThemeContext";
import StatusModal from "../../../components/StatusModal";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";

// MoodEntry type for Convex
interface MoodEntry {
  id: string;
  mood_type: string;
  intensity: number;
  notes?: string;
  created_at: string;
  mood_emoji: string;
  mood_label: string;
  mood_factors?: Array<{ factor: string }>;
}

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

const moodTypes = [
  { value: "very-happy", label: "Very Happy", emoji: "😄" },
  { value: "happy", label: "Happy", emoji: "🙂" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "sad", label: "Sad", emoji: "🙁" },
  { value: "very-sad", label: "Very Sad", emoji: "😢" },
];

// Move live data components OUTSIDE of the screen component to keep their identity stable across renders
function LiveHistoryComponent(props: {
  userId: string;
  limit: number;
  offset: number;
  selectedMoodType?: string;
  selectedFactors: string[];
  startDate: Date | null;
  endDate: Date | null;
  setMoodHistory: React.Dispatch<React.SetStateAction<MoodEntry[]>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const {
    userId,
    limit,
    offset,
    selectedMoodType,
    selectedFactors,
    startDate,
    endDate,
    setMoodHistory,
    setHasMore,
    setLoading,
    setError,
  } = props;

  // Build filter parameters (memoized)
  const filterStartDate = useMemo(() => {
    if (!startDate) return undefined;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }, [startDate]);

  const filterEndDate = useMemo(() => {
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return end.toISOString();
    } else if (startDate && !endDate) {
      const end = new Date(startDate);
      end.setHours(23, 59, 59, 999);
      return end.toISOString();
    }
    return undefined;
  }, [startDate, endDate]);

  console.log("🔍 LiveHistory - Querying with params:", {
    userId,
    limit,
    offset,
    moodType: selectedMoodType || undefined,
    startDate: filterStartDate,
    endDate: filterEndDate,
    factors: selectedFactors.length > 0 ? selectedFactors : undefined,
  });

  const res = useQuery(api.moods.getMoodHistory, {
    userId,
    limit,
    offset,
    moodType: selectedMoodType || undefined,
    startDate: filterStartDate,
    endDate: filterEndDate,
    factors: selectedFactors.length > 0 ? selectedFactors : undefined,
  }) as { moods: any[] } | undefined;

  console.log("🔍 LiveHistory - Query result:", res);

  // Build a stable signature of the current result to decide when to update parent state
  const idsKey = useMemo(() => {
    if (!res || !Array.isArray(res.moods)) return "__undefined__";
    return res.moods.map((m: any) => m.id).join(",");
  }, [res]);

  const lastIdsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("🔍 LiveHistory useEffect - idsKey:", idsKey, "offset:", offset);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (res === undefined && offset === 0) {
      timeoutId = setTimeout(() => {
        console.log("⏱️ Query timeout - setting loading to false");
        setError("Unable to load mood history. Convex may not be running or authentication failed.");
        setLoading(false);
      }, 5000);
    }

    if (res !== undefined && Array.isArray(res.moods)) {
      if (timeoutId) clearTimeout(timeoutId);
      setError(null);

      if (lastIdsKeyRef.current !== idsKey) {
        lastIdsKeyRef.current = idsKey;
        const incoming = res.moods as unknown as MoodEntry[];
        setMoodHistory((prev) => {
          if (offset === 0) return incoming;
          const existingIds = new Set(prev.map((m) => m.id));
          const merged = [...prev, ...incoming.filter((m) => !existingIds.has(m.id))];
          return merged;
        });
        setHasMore(res.moods.length === limit);
        console.log(`📊 Loaded ${res.moods.length} mood entries`);
      }
      setLoading(false);
    } else if (res !== undefined) {
      if (timeoutId) clearTimeout(timeoutId);
      if (offset === 0) setMoodHistory([]);
      setHasMore(false);
      setLoading(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  // Intentionally omit 'res' to prevent infinite loop from new object identity each subscription tick.
  // Safe because we only act when idsKey changes and idsKey depends on res.
  // Including state setters and 'limit' is optional per React docs; they are stable from React.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, offset]);

  return null;
}

function LiveFactorsComponent(props: {
  userId: string;
  setAllFactors: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { userId, setAllFactors } = props;
  const res = useQuery(api.moods.getFactors, { userId }) as { factors: Array<{ factor: string }> } | undefined;

  const factorsKey = useMemo(() => {
    if (!res || !Array.isArray(res.factors)) return "__undefined__";
    return res.factors.map((f) => f.factor).sort().join(",");
  }, [res]);

  const lastFactorsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (res && Array.isArray(res.factors) && lastFactorsKeyRef.current !== factorsKey) {
      lastFactorsKeyRef.current = factorsKey;
      setAllFactors(res.factors.map((f) => f.factor));
    }
  // Intentionally omit 'res' to avoid effect firing on identical factor arrays with new reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factorsKey]);

  return null;
}

export default function MoodHistoryScreen() {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  const { getToken } = useAuth();
  const convex = useConvex();
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [allFactors, setAllFactors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("mood");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMoodId, setSelectedMoodId] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Pagination and filter states
  const LIMIT = 20;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMoodType, setSelectedMoodType] = useState<string>("");
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Mutations & status modal helpers
  const deleteMood = useMutation(api.moods.deleteMood);
  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };
  const hideStatusModal = () => setModalVisible(false);

  // Calendar state: month/week toggle and cursor date
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Helpers to compute ranges
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
  const startOfMonth = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth(), 1); x.setHours(0,0,0,0); return x; };
  const endOfMonth = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth()+1, 0); x.setHours(23,59,59,999); return x; };
  const startOfWeek = (d: Date) => { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x; };
  const addMonths = (d: Date, m: number) => { const x = new Date(d); x.setMonth(x.getMonth()+m); return x; };
  const addDays = (d: Date, days: number) => { const x = new Date(d); x.setDate(x.getDate()+days); return x; };

  // When calendar cursor changes or mode toggles, drive screen date filters
  useEffect(() => {
    let s: Date, e: Date;
    if (calendarMode === 'month') {
      s = startOfMonth(calendarDate); e = endOfMonth(calendarDate);
    } else {
      const sw = startOfWeek(calendarDate); s = startOfDay(sw); e = endOfDay(addDays(sw, 6));
    }
    setStartDate(s); setEndDate(e); setOffset(0);
  }, [calendarMode, calendarDate]);
  
  // Check if Convex is available
  useEffect(() => {
    if (!convex) {
      console.error("❌ Convex client not available");
      setError("Backend connection not available. Please restart the app.");
      setLoading(false);
    }
  }, [convex]);


  // Apply filters
  const applyFilters = () => {
    setFilterModalVisible(false);
    setOffset(0);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedMoodType("");
    setSelectedFactors([]);
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
    setOffset(0);
  };

  // Toggle factor selection
  const toggleFactor = (factor: string) => {
    setSelectedFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor]
    );
  };

  // Handle date change for start date
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  // Handle date change for end date
  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "Select date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: APP_TIME_ZONE,
    });
  };

  // Filter by search query (client-side for notes)
  const filteredHistory = moodHistory.filter((entry) =>
    searchQuery
      ? entry.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Build a date -> count map for calendar badges
  const dateKey = (d: Date | string) => {
    const dd = typeof d === 'string' ? new Date(d) : d;
    const y = dd.getFullYear();
    const m = (dd.getMonth()+1).toString().padStart(2,'0');
    const day = dd.getDate().toString().padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const countsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of moodHistory) {
      const k = dateKey(e.created_at);
      map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [moodHistory]);

  // If a day is selected, narrow list to that day
  const dayFilteredHistory = useMemo(() => {
    if (!selectedDay) return filteredHistory;
    const k = dateKey(selectedDay);
    return filteredHistory.filter(e => dateKey(e.created_at) === k);
  }, [filteredHistory, selectedDay]);

  // Group entries by month for SectionList
  const monthLabel = (d: Date | string) => {
    const dd = typeof d === 'string' ? new Date(d) : d;
    return dd.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: APP_TIME_ZONE });
  };
  const sections = useMemo(() => {
    const groups = new Map<string, MoodEntry[]>();
    for (const e of dayFilteredHistory) {
      const label = monthLabel(e.created_at);
      const arr = groups.get(label) || [];
      arr.push(e);
      groups.set(label, arr);
    }
    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [dayFilteredHistory]);

  // Handle tab navigation
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Delete mood entry
  const handleDelete = (moodId: string) => {
    setSelectedMoodId(moodId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    
    // Optimistic UI: remove immediately
    const deletedEntry = moodHistory.find((m) => m.id === selectedMoodId);
    setMoodHistory((prev) => prev.filter((m) => m.id !== selectedMoodId));
    
    try {
      await deleteMood({ id: selectedMoodId as any });
      showStatusModal('success', 'Success', 'Mood entry deleted successfully.');
    } catch (error) {
      // Rollback on failure
      if (deletedEntry) {
        setMoodHistory((prev) => {
          const restored = [...prev, deletedEntry].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          return restored;
        });
      }
      showStatusModal('error', 'Delete Failed', 'Unable to delete mood entry. Please try again.');
    }
  };

  // If there's no authenticated user, don't keep the screen in loading state forever
  useEffect(() => {
    if (!user?.id) {
      console.log("No user ID found, setting loading to false");
      setLoading(false);
      setError("Please sign in to view mood history");
    } else {
      console.log("User ID found:", user.id);
    }
  }, [user]);

  // Render mood entry card
  const renderMoodEntry = ({ item }: { item: MoodEntry }) => (
    <View style={[styles.entryCard, { backgroundColor: theme.colors.surface, shadowColor: theme.isDark ? "#000" : "#000" }]}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryEmoji}>{item.mood_emoji}</Text>
        <View style={styles.entryDetails}>
          <Text style={[styles.entryMood, { color: theme.colors.text }]}>{item.mood_label}</Text>
          <Text style={[styles.entryDate, { color: theme.colors.textSecondary }]}>
            {new Date(item.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: APP_TIME_ZONE,
            })}
          </Text>
        </View>
        <View style={styles.entryActions}>
          <Text style={[styles.entryIntensity, { color: theme.colors.primary }]}>★ {item.intensity}/5</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      {item.mood_factors && item.mood_factors.length > 0 && (
        <View style={styles.factorsContainer}>
          {item.mood_factors.map((factorObj, index) => (
            <View key={index} style={styles.factorChip}>
              <Text style={styles.factorText}>{factorObj.factor}</Text>
            </View>
          ))}
        </View>
      )}

      {item.notes && (
        <Text style={[styles.entryNotes, { color: theme.colors.textSecondary }]} numberOfLines={3}>
          {item.notes}
        </Text>
      )}
    </View>
  );

  // Active filters count
  const activeFiltersCount =
    (selectedMoodType ? 1 : 0) +
    selectedFactors.length +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  // Render LiveHistory and LiveFactors outside of loading check
  // so that useQuery hooks are always called (React rules of hooks)
  const liveComponents = user?.id ? (
    <>
      <LiveHistoryComponent
        userId={user.id}
        limit={LIMIT}
        offset={offset}
        selectedMoodType={selectedMoodType}
        selectedFactors={selectedFactors}
        startDate={startDate}
        endDate={endDate}
        setMoodHistory={setMoodHistory}
        setHasMore={setHasMore}
        setLoading={setLoading}
        setError={setError}
      />
      <LiveFactorsComponent userId={user.id} setAllFactors={setAllFactors} />
    </>
  ) : null;

  // Calendar UI components
  const WeekdayHeader = () => (
    <View style={styles.calendarWeekHeader}>
      {['S','M','T','W','T','F','S'].map((d) => (
        <Text key={d} style={styles.calendarWeekLabel}>{d}</Text>
      ))}
    </View>
  );

  const buildMonthGrid = (base: Date) => {
    const first = startOfMonth(base);
    const start = startOfWeek(first);
    const days: Date[] = [];
    for (let i=0;i<42;i++) days.push(addDays(start, i));
    return days;
  };

  const buildWeekRow = (base: Date) => {
    const start = startOfWeek(base);
    const days: Date[] = [];
    for (let i=0;i<7;i++) days.push(addDays(start, i));
    return days;
  };

  const CalendarView = () => {
    const isMonth = calendarMode === 'month';
    const days = isMonth ? buildMonthGrid(calendarDate) : buildWeekRow(calendarDate);
    const title = new Date(calendarDate).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: APP_TIME_ZONE });
    return (
      <View style={[styles.calendarCard, { backgroundColor: theme.colors.surface, shadowColor: theme.isDark ? '#000' : '#000' }]}>
        <View style={styles.calendarHeader}>
          <Text style={[styles.calendarTitle, { color: theme.colors.text }]}>{title}</Text>
          <View style={styles.calendarActions}>
            <View style={styles.segmented}>
              <TouchableOpacity
                style={[styles.segmentButton, isMonth && styles.segmentActive]}
                onPress={() => { setCalendarMode('month'); setSelectedDay(null); }}
              >
                <Text style={[styles.segmentText, isMonth && styles.segmentTextActive]}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, !isMonth && styles.segmentActive]}
                onPress={() => { setCalendarMode('week'); setSelectedDay(null); }}
              >
                <Text style={[styles.segmentText, !isMonth && styles.segmentTextActive]}>Week</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection:'row', gap: 8 }}>
              <TouchableOpacity
                style={styles.navPill}
                onPress={() => {
                  setSelectedDay(null);
                  setCalendarDate(isMonth ? addMonths(calendarDate, -1) : addDays(calendarDate, -7));
                }}
              >
                <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navPill}
                onPress={() => {
                  setSelectedDay(null);
                  setCalendarDate(isMonth ? addMonths(calendarDate, 1) : addDays(calendarDate, 7));
                }}
              >
                <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <WeekdayHeader />
        <View style={styles.calendarGrid}>
          {days.map((d) => {
            const isCurr = d.getMonth() === calendarDate.getMonth();
            const k = dateKey(d);
            const cnt = countsByDay[k] || 0;
            const isSel = selectedDay && dateKey(selectedDay) === k;
            return (
              <TouchableOpacity
                key={k}
                style={[styles.dayCell, isSel && styles.dayCellSelected, !isCurr && styles.dayCellFaded]}
                onPress={() => setSelectedDay((prev) => (prev && dateKey(prev) === k ? null : d))}
                activeOpacity={0.7}
              >
                <Text style={styles.dayNumber}>{d.getDate()}</Text>
                {cnt > 0 && (
                  <View style={styles.dayDot}><Text style={styles.dayDotText}>{cnt > 9 ? '9+' : String(cnt)}</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedDay && (
          <View style={styles.selectedDayBar}>
            <Text style={[styles.selectedDayText, { color: theme.colors.text }]}>
              {selectedDay.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', timeZone: APP_TIME_ZONE })}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDay(null)}>
              <Ionicons name="close-circle" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading && offset === 0) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {liveComponents}
          <AppHeader title="Mood History" showBack={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading mood history...
            </Text>
            {error && (
              <View style={{ marginTop: 20, padding: 16, backgroundColor: '#ffebee', borderRadius: 8 }}>
                <Text style={{ color: '#c62828', textAlign: 'center' }}>{error}</Text>
                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: theme.colors.primary,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setLoading(true);
                    setError(null);
                    setOffset(0);
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
  {liveComponents}

  {/* My Calendar */}
  <CalendarView />

        <AppHeader title="Mood History" showBack={true} />

        {/* Search and Filter Bar */}
        <View style={styles.searchBar}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search notes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color={theme.colors.primary} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active filters display */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedMoodType && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {moodTypes.find(m => m.value === selectedMoodType)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedMoodType("")}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {startDate && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    From: {formatDate(startDate)}
                  </Text>
                  <TouchableOpacity onPress={() => setStartDate(null)}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {endDate && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    To: {formatDate(endDate)}
                  </Text>
                  <TouchableOpacity onPress={() => setEndDate(null)}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {selectedFactors.map((factor) => (
                <View key={factor} style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{factor}</Text>
                  <TouchableOpacity onPress={() => toggleFactor(factor)}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mood History List grouped by month */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderMoodEntry}
          renderSectionHeader={({ section }) => (
            <View style={styles.monthHeaderContainer}>
              <Text style={[styles.monthHeaderText, { color: theme.colors.text }]}>{section.title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasMore && !loading) {
              setOffset((prev) => prev + LIMIT);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sad-outline" size={48} color="#999" />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                {activeFiltersCount > 0 
                  ? "No mood entries found for the selected filters" 
                  : "No mood entries found"
                }
              </Text>
              {activeFiltersCount > 0 && (
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  Try adjusting your filters or clear them to see all entries
                </Text>
              )}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push("/(app)/mood-tracking")}
              >
                <Text style={[styles.addButtonText, { color: theme.colors.surface }]}>Log Your First Mood</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loading && offset > 0 ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
            ) : null
          }
        />

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.filterModal, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderLight }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Filter Moods</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Mood Type Filter */}
                <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Mood Type</Text>
                <View style={styles.moodTypeGrid}>
                  {moodTypes.map((mood) => (
                    <TouchableOpacity
                      key={mood.value}
                      style={[
                        styles.moodTypeChip,
                        { backgroundColor: theme.colors.surface },
                        selectedMoodType === mood.value && [
                          styles.moodTypeChipActive,
                          { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' }
                        ],
                      ]}
                      onPress={() =>
                        setSelectedMoodType(
                          selectedMoodType === mood.value ? "" : mood.value
                        )
                      }
                    >
                      <Text style={styles.moodTypeEmoji}>{mood.emoji}</Text>
                      <Text style={[styles.moodTypeLabel, { color: theme.colors.textSecondary }]}>{mood.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Factors Filter */}
                {allFactors.length > 0 && (
                  <>
                    <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Factors</Text>
                    <View style={styles.factorsGrid}>
                      {allFactors.map((factor) => (
                        <TouchableOpacity
                          key={factor}
                          style={[
                            styles.factorFilterChip,
                            { backgroundColor: theme.colors.surface },
                            selectedFactors.includes(factor) && [
                              styles.factorFilterChipActive,
                              { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' }
                            ],
                          ]}
                          onPress={() => toggleFactor(factor)}
                        >
                          <Text
                            style={[
                              styles.factorFilterText,
                              { color: theme.colors.textSecondary },
                              selectedFactors.includes(factor) && [
                                styles.factorFilterTextActive,
                                { color: theme.colors.primary }
                              ],
                            ]}
                          >
                            {factor}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {/* Date Range Filter */}
                <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Date Range</Text>
                
                {/* Start Date */}
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>From:</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: theme.colors.primary + '20' }]}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
                      {formatDate(startDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  {startDate && (
                    <TouchableOpacity onPress={() => setStartDate(null)}>
                      <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* End Date */}
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>To:</Text>
                  <Text style={[styles.dateHint, { color: theme.colors.textSecondary }]}>(Leave empty for single day)</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: theme.colors.primary + '20' }]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
                      {formatDate(endDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  {endDate && (
                    <TouchableOpacity onPress={() => setEndDate(null)}>
                      <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Date Pickers */}
                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onStartDateChange}
                    maximumDate={endDate || new Date()}
                  />
                )}

                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onEndDateChange}
                    minimumDate={startDate || undefined}
                    maximumDate={new Date()}
                  />
                )}
              </ScrollView>

              <View style={[styles.modalActions, { borderTopColor: theme.colors.borderLight }]}>
                <TouchableOpacity
                  style={[styles.clearButton, { backgroundColor: theme.colors.borderLight }]}
                  onPress={clearFilters}
                >
                  <Text style={[styles.clearButtonText, { color: theme.colors.textSecondary }]}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
                  onPress={applyFilters}
                >
                  <Text style={[styles.applyButtonText, { color: theme.colors.surface }]}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.successModal, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.successIcon}>
                <Ionicons name="warning" size={64} color="#FF9800" />
              </View>
              <Text style={[styles.successTitle, { color: theme.colors.text }]}>Delete Entry</Text>
              <Text style={[styles.successMessage, { color: theme.colors.textSecondary }]}>
                Are you sure you want to delete this mood entry? This action cannot be undone.
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.isDark ? "#444" : "#E0E0E0" }]}
                  onPress={() => setShowDeleteConfirm(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#F44336" }]}
                  onPress={confirmDelete}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalButtonText, { color: "#FFF" }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Status Modal for error handling */}
        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideStatusModal}
          buttonText="OK"
        />

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  // Calendar styles
  calendarCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    padding: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: '700',
  },
  calendarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#EEEEEE',
    borderRadius: 999,
    overflow: 'hidden',
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: scaledFontSize(12),
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#4CAF50',
  },
  navPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  calendarWeekLabel: {
    width: `${100/7}%`,
    textAlign: 'center',
    fontSize: scaledFontSize(12),
    color: '#777',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  dayCell: {
    width: `${100/7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: '#4CAF500F',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  dayCellFaded: {
    opacity: 0.4,
  },
  dayNumber: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  dayDot: {
    position: 'absolute',
    bottom: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
  },
  dayDotText: {
    color: '#FFF',
    fontSize: scaledFontSize(10),
    fontWeight: '700',
  },
  selectedDayBar: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDayText: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: 12,
  },
  searchBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: scaledFontSize(16), // Base size 16px
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#F44336",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#FFF",
    fontSize: scaledFontSize(12), // Base size 12px
    fontWeight: "600",
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  activeFilterText: {
    color: "#2E7D32",
    fontSize: scaledFontSize(13), // Base size 13px
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  monthHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  monthHeaderText: {
    fontSize: scaledFontSize(18),
    fontWeight: '700',
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  entryEmoji: {
    fontSize: scaledFontSize(32), // Base size 32px
    marginRight: 12,
  },
  entryDetails: {
    flex: 1,
  },
  entryMood: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
  },
  entryDate: {
    fontSize: scaledFontSize(13), // Base size 13px
    marginTop: 2,
  },
  entryActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  entryIntensity: {
    fontSize: scaledFontSize(14), // Base size 14px
    fontWeight: "500",
  },
  factorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  factorChip: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  factorText: {
    color: "#2E7D32",
    fontSize: scaledFontSize(12), // Base size 12px
    fontWeight: "500",
  },
  entryNotes: {
    fontSize: scaledFontSize(14), // Base size 14px
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: scaledFontSize(16), // Base size 16px
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginBottom: 24,
    textAlign: "center",
  },
  addButton: {
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
  },
  addButtonText: {
    fontWeight: "600",
    fontSize: scaledFontSize(16), // Base size 16px
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  filterModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
  },
  modalContent: {
    padding: 20,
  },
  filterLabel: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 12,
  },
  moodTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  moodTypeChip: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    minWidth: 80,
  },
  moodTypeChipActive: {
    borderColor: "#4CAF50",
  },
  moodTypeEmoji: {
    fontSize: scaledFontSize(24), // Base size 24px
    marginBottom: 4,
  },
  moodTypeLabel: {
    fontSize: scaledFontSize(12), // Base size 12px
  },
  factorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  factorFilterChip: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  factorFilterChipActive: {
    borderColor: "#4CAF50",
  },
  factorFilterText: {
    fontSize: scaledFontSize(14), // Base size 14px
  },
  factorFilterTextActive: {
    fontWeight: "500",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  dateLabel: {
    fontSize: scaledFontSize(14), // Base size 14px
    width: 50,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateButtonText: {
    fontSize: scaledFontSize(14), // Base size 14px
  },
  dateHint: {
    fontSize: scaledFontSize(12), // Base size 12px
    fontStyle: 'italic',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
  },
  // Success/Error Modal Styles
  successModal: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: scaledFontSize(16), // Base size 16px
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  successButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: "stretch",
    alignItems: "center",
  },
  successButtonText: {
    fontWeight: "600",
    fontSize: scaledFontSize(16), // Base size 16px
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    alignSelf: "stretch",
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  modalButtonText: {
    fontWeight: "600",
    fontSize: scaledFontSize(16), // Base size 16px
  },
});