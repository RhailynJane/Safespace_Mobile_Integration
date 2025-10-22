import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { AppHeader } from "../../../components/AppHeader";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { journalApi, JournalEntry } from "../../../utils/journalApi";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from "../../../contexts/ThemeContext";

type FilterType = "all" | "week" | "month" | "custom";

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function JournalHistoryScreen() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("journal");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Move getDateFilters outside of fetchEntries and use useCallback
  const getDateFilters = React.useCallback(() => {
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (activeFilter === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (activeFilter === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (activeFilter === "custom" && customStartDate) {
      // For custom dates, set start date to beginning of day
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0); // Start of day
      
      if (customEndDate) {
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999); // End of day
      } else {
        // If no end date is selected, only filter by start date (single day)
        endDate = new Date(customStartDate);
        endDate.setHours(23, 59, 59, 999); // End of the same day
      }
    }

    console.log('Date filters:', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      activeFilter,
      customStartDate: customStartDate?.toISOString(),
      customEndDate: customEndDate?.toISOString()
    });

    return {
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
    };
  }, [activeFilter, customStartDate, customEndDate]);

  const fetchEntries = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const filters = getDateFilters();
      console.log('Fetching entries with filters:', filters);
      
      const response = await journalApi.getHistory(user.id, filters);
      console.log('API response:', response.entries?.length, 'entries');
      
      setEntries(response.entries || []);
      setFilteredEntries(response.entries || []);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      Alert.alert("Error", "Failed to load journal history");
    } finally {
      setLoading(false);
    }
  }, [user?.id, getDateFilters]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchEntries();
      }
    }, [user?.id, fetchEntries])
  );

  // Apply search filter whenever search query or entries change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.content.toLowerCase().includes(query) ||
        entry.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const handleEntryPress = (entryId: string) => {
    router.push(`/(app)/journal/journal-entry/${entryId}`);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    if (filter === "custom") {
      setShowDatePicker(true);
    } else {
      setCustomStartDate(null);
      setCustomEndDate(null);
      // Fetch entries immediately when switching to non-custom filters
      fetchEntries();
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setCustomStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setCustomEndDate(selectedDate);
    }
  };

  const handleApplyCustomDate = () => {
    if (!customStartDate) {
      Alert.alert("Error", "Please select a start date");
      return;
    }
    
    // Validate that end date is not before start date
    if (customEndDate && customEndDate < customStartDate) {
      Alert.alert("Error", "End date cannot be before start date");
      return;
    }
    
    setShowDatePicker(false);
    fetchEntries();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleClearDateFilter = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    setActiveFilter("all");
    setShowDatePicker(false);
    fetchEntries();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const renderFilterButton = (filter: FilterType, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => handleFilterChange(filter)}
    >
      <Text
        style={[
          styles.filterText,
          activeFilter === filter && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderJournalEntry = (entry: JournalEntry) => {
    const isExpanded = expandedEntry === entry.id;

    return (
      <TouchableOpacity
        key={entry.id}
        style={styles.entryCard}
        onPress={() => handleEntryPress(entry.id)}
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
          </View>
          <View style={styles.entryMeta}>
            {entry.emoji ? (
              <Text style={styles.entryEmoji}>{entry.emoji}</Text>
            ) : null}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.textSecondary}
              style={styles.expandIcon}
            />
          </View>
        </View>

        <Text
          style={styles.entryContent}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {entry.content}
        </Text>

        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {entry.tags.map((tag: string, index: number) => (
              <View key={`${entry.id}-${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {entry.share_with_support_worker && (
          <View style={styles.sharedBadge}>
            <Ionicons name="people" size={12} color={Colors.primary} />
            <Text style={styles.sharedText}>Shared with Support Worker</Text>
          </View>
        )}

        {!isExpanded && entry.content.length > 150 && (
          <Text style={styles.readMore}>Read more...</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Journal Entries" showBack={true} showMenu={true} />
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>My Journal Entries</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title, content, or tags..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textTertiary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Filter Buttons */}
          <View style={styles.filterContainer}>
            {renderFilterButton("all", "All")}
            {renderFilterButton("week", "Week")}
            {renderFilterButton("month", "Month")}
            {renderFilterButton("custom", "Custom")}
          </View>

          {/* Active Custom Date Filter Display */}
          {activeFilter === "custom" && customStartDate && (
            <View style={styles.activeDateFilter}>
              <Text style={styles.activeDateText}>
                {formatDateForDisplay(customStartDate)}
                {customEndDate && ` - ${formatDateForDisplay(customEndDate)}`}
                {!customEndDate && " (Single Day)"}
              </Text>
              <TouchableOpacity onPress={handleClearDateFilter}>
                <Ionicons name="close-circle" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Results Count */}
          {!loading && (
            <Text style={styles.resultsCount}>
              {filteredEntries.length}{" "}
              {filteredEntries.length === 1 ? "entry" : "entries"} found
            </Text>
          )}

          <View style={styles.entriesContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading entries...</Text>
              </View>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map(renderJournalEntry)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name={searchQuery ? "search" : "book-outline"}
                  size={64}
                  color={Colors.textTertiary}
                />
                <Text style={styles.emptyStateText}>
                  {searchQuery
                    ? "No entries match your search"
                    : activeFilter === "custom" 
                    ? "No entries found for selected date range"
                    : "No journal entries yet"}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery
                    ? "Try a different search term"
                    : activeFilter === "custom"
                    ? "Try selecting a different date range"
                    : "Start writing to capture your thoughts and feelings"}
                </Text>
                {!searchQuery && activeFilter !== "custom" && (
                  <TouchableOpacity
                    style={styles.addEntryButton}
                    onPress={() => router.push("/(app)/journal/journal-create")}
                  >
                    <Text style={styles.addEntryButtonText}>
                      Write First Entry
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {filteredEntries.length > 0 && (
            <TouchableOpacity
              style={styles.floatingAddButton}
              onPress={() => router.push("/(app)/journal/journal-create")}
            >
              <Ionicons name="add" size={28} color={Colors.surface} />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Custom Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date Range</Text>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Start Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={[
                    styles.dateInputText,
                    !customStartDate && styles.dateInputPlaceholder
                  ]}>
                    {customStartDate ? formatDateForDisplay(customStartDate) : "Select start date"}
                  </Text>
                  <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>End Date (Optional)</Text>
                <Text style={styles.dateHint}>
                  Leave empty to search for a single day
                </Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={[
                    styles.dateInputText,
                    !customEndDate && styles.dateInputPlaceholder
                  ]}>
                    {customEndDate ? formatDateForDisplay(customEndDate) : "Select end date (optional)"}
                  </Text>
                  <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setActiveFilter("all");
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalApplyButton,
                    !customStartDate && styles.modalApplyButtonDisabled
                  ]}
                  onPress={handleApplyCustomDate}
                  disabled={!customStartDate}
                >
                  <Text style={styles.modalApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={customStartDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            maximumDate={customEndDate || new Date()}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={customEndDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={customStartDate || undefined}
            maximumDate={new Date()}
          />
        )}

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    marginBottom: 60,
  },
  pageTitle: {
    ...Typography.title,
    fontSize: 28,
    fontWeight: "600",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 25,
    padding: 4,
    marginBottom: Spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: 21,
  },
  filterButtonActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "500",
    fontSize: 13,
  },
  filterTextActive: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  activeDateFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  activeDateText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
  },
  resultsCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  entriesContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    ...Typography.subtitle,
    fontWeight: "600",
    marginBottom: 4,
  },
  entryDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  entryMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  expandIcon: {
    marginLeft: Spacing.sm,
  },
  entryContent: {
    ...Typography.body,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  readMore: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  sharedText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: 4,
    fontSize: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateText: {
    ...Typography.title,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    textAlign: "center",
    marginBottom: Spacing.xl,
    color: Colors.textSecondary,
  },
  addEntryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  addEntryButtonText: {
    ...Typography.button,
  },
  floatingAddButton: {
    position: "absolute",
    bottom: 80,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    ...Typography.title,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  dateInputContainer: {
    marginBottom: Spacing.lg,
  },
  dateLabel: {
    ...Typography.subtitle,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    padding: Spacing.lg,
  },
  dateInputText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  dateInputPlaceholder: {
    color: Colors.textTertiary,
  },
  dateHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.disabled,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  modalCancelText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  modalApplyButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  modalApplyText: {
    ...Typography.button,
  },
});