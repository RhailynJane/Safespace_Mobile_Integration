import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
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
import { APP_TIME_ZONE } from "../../../utils/timezone";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from "../../../contexts/ThemeContext";
import StatusModal from "../../../components/StatusModal";

type FilterType = "all" | "week" | "month" | "custom";

const tabs = [
  { id: "home", name: "Home", icon: "home" },
  { id: "community-forum", name: "Community", icon: "people" },
  { id: "appointments", name: "Appointments", icon: "calendar" },
  { id: "messages", name: "Messages", icon: "chatbubbles" },
  { id: "profile", name: "Profile", icon: "person" },
];

export default function JournalHistoryScreen() {
  const { theme, scaledFontSize } = useTheme();
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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideStatusModal = () => {
    setModalVisible(false);
  };

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
      showStatusModal('error', 'Load Failed', 'Unable to load journal history. Please try again.');
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
      showStatusModal('error', 'Missing Date', 'Please select a start date to filter by custom date range.');
      return;
    }
    
    // Validate that end date is not before start date
    if (customEndDate && customEndDate < customStartDate) {
      showStatusModal('error', 'Invalid Date Range', 'End date cannot be before start date. Please adjust your selection.');
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
    return date.toLocaleDateString("en-US", { ...options, timeZone: APP_TIME_ZONE });
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", { ...options, timeZone: APP_TIME_ZONE });
  };

  const renderFilterButton = (filter: FilterType, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: theme.colors.borderLight },
        activeFilter === filter && [
          styles.filterButtonActive,
          { backgroundColor: theme.colors.surface }
        ],
      ]}
      onPress={() => handleFilterChange(filter)}
    >
      <Text
        style={[
          styles.filterText,
          { color: theme.colors.textSecondary },
          activeFilter === filter && [
            styles.filterTextActive,
            { color: theme.colors.text }
          ],
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
        style={[styles.entryCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleEntryPress(entry.id)}
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={[styles.entryTitle, { color: theme.colors.text }]}>{entry.title}</Text>
            <Text style={[styles.entryDate, { color: theme.colors.textSecondary }]}>{formatDate(entry.created_at)}</Text>
          </View>
          <View style={styles.entryMeta}>
            {entry.emoji ? (
              <Text style={styles.entryEmoji}>{entry.emoji}</Text>
            ) : null}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textSecondary}
              style={styles.expandIcon}
            />
          </View>
        </View>

        <Text
          style={[styles.entryContent, { color: theme.colors.textSecondary }]}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {entry.content}
        </Text>

        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {entry.tags.map((tag: string, index: number) => (
              <View 
                key={`${entry.id}-${tag}-${index}`} 
                style={[styles.tag, { backgroundColor: theme.colors.primary + '20' }]}
              >
                <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {entry.share_with_support_worker && (
          <View style={[styles.sharedBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="people" size={12} color={theme.colors.primary} />
            <Text style={[styles.sharedText, { color: theme.colors.primary }]}>Shared with Support Worker</Text>
          </View>
        )}

        {!isExpanded && entry.content.length > 150 && (
          <Text style={[styles.readMore, { color: theme.colors.primary }]}>Read more...</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Journal Entries" showBack={true} showMenu={true} />
        <ScrollView style={styles.content}>
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>My Journal Entries</Text>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search by title, content, or tags..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Filter Buttons */}
          <View style={[styles.filterContainer, { backgroundColor: theme.colors.borderLight }]}>
            {renderFilterButton("all", "All")}
            {renderFilterButton("week", "Week")}
            {renderFilterButton("month", "Month")}
            {renderFilterButton("custom", "Custom")}
          </View>

          {/* Active Custom Date Filter Display */}
          {activeFilter === "custom" && customStartDate && (
            <View style={[styles.activeDateFilter, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.activeDateText, { color: theme.colors.primary }]}>
                {formatDateForDisplay(customStartDate)}
                {customEndDate && ` - ${formatDateForDisplay(customEndDate)}`}
                {!customEndDate && " (Single Day)"}
              </Text>
              <TouchableOpacity onPress={handleClearDateFilter}>
                <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Results Count */}
          {!loading && (
            <Text style={[styles.resultsCount, { color: theme.colors.textSecondary }]}>
              {filteredEntries.length}{" "}
              {filteredEntries.length === 1 ? "entry" : "entries"} found
            </Text>
          )}

          <View style={styles.entriesContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading entries...</Text>
              </View>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map(renderJournalEntry)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name={searchQuery ? "search" : "book-outline"}
                  size={64}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
                  {searchQuery
                    ? "No entries match your search"
                    : activeFilter === "custom" 
                    ? "No entries found for selected date range"
                    : "No journal entries yet"}
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  {searchQuery
                    ? "Try a different search term"
                    : activeFilter === "custom"
                    ? "Try selecting a different date range"
                    : "Start writing to capture your thoughts and feelings"}
                </Text>
                {!searchQuery && activeFilter !== "custom" && (
                  <TouchableOpacity
                    style={[styles.addEntryButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => router.push("/(app)/journal/journal-create")}
                  >
                    <Text style={[styles.addEntryButtonText, { color: theme.colors.surface }]}>
                      Write First Entry
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {filteredEntries.length > 0 && (
            <TouchableOpacity
              style={[styles.floatingAddButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push("/(app)/journal/journal-create")}
            >
              <Ionicons name="add" size={28} color={theme.colors.surface} />
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
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Date Range</Text>

              <View style={styles.dateInputContainer}>
                <Text style={[styles.dateLabel, { color: theme.colors.text }]}>Start Date *</Text>
                <TouchableOpacity 
                  style={[styles.dateInput, { backgroundColor: theme.colors.primary + '20' }]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={[
                    styles.dateInputText,
                    { color: theme.colors.text },
                    !customStartDate && [styles.dateInputPlaceholder, { color: theme.colors.textSecondary }]
                  ]}>
                    {customStartDate ? formatDateForDisplay(customStartDate) : "Select start date"}
                  </Text>
                  <Ionicons name="calendar" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={[styles.dateLabel, { color: theme.colors.text }]}>End Date (Optional)</Text>
                <Text style={[styles.dateHint, { color: theme.colors.textSecondary }]}>
                  Leave empty to search for a single day
                </Text>
                <TouchableOpacity 
                  style={[styles.dateInput, { backgroundColor: theme.colors.primary + '20' }]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={[
                    styles.dateInputText,
                    { color: theme.colors.text },
                    !customEndDate && [styles.dateInputPlaceholder, { color: theme.colors.textSecondary }]
                  ]}>
                    {customEndDate ? formatDateForDisplay(customEndDate) : "Select end date (optional)"}
                  </Text>
                  <Ionicons name="calendar" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { backgroundColor: theme.colors.borderLight }]}
                  onPress={() => {
                    setShowDatePicker(false);
                    setActiveFilter("all");
                  }}
                >
                  <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalApplyButton,
                    { backgroundColor: theme.colors.primary },
                    !customStartDate && [styles.modalApplyButtonDisabled, { backgroundColor: theme.colors.borderLight }]
                  ]}
                  onPress={handleApplyCustomDate}
                  disabled={!customStartDate}
                >
                  <Text style={[styles.modalApplyText, { color: theme.colors.surface }]}>Apply</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    marginBottom: 60,
  },
  pageTitle: {
    fontSize: scaledFontSize(28), // Base size 28px
    fontWeight: "600",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: scaledFontSize(16), // Base size 16px
  },
  filterContainer: {
    flexDirection: "row",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: scaledFontSize(13), // Base size 13px
    fontWeight: "500",
  },
  filterTextActive: {
    fontWeight: "600",
  },
  activeDateFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  activeDateText: {
    fontSize: scaledFontSize(14), // Base size 14px
    fontWeight: "600",
  },
  resultsCount: {
    fontSize: scaledFontSize(14), // Base size 14px
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
    fontSize: scaledFontSize(14), // Base size 14px
    marginTop: Spacing.md,
  },
  entryCard: {
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
    fontSize: scaledFontSize(18), // Base size 18px
    fontWeight: "600",
    marginBottom: 4,
  },
  entryDate: {
    fontSize: scaledFontSize(14), // Base size 14px
  },
  entryMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryEmoji: {
    fontSize: scaledFontSize(24), // Base size 24px
    marginRight: Spacing.sm,
  },
  expandIcon: {
    marginLeft: Spacing.sm,
  },
  entryContent: {
    fontSize: scaledFontSize(16), // Base size 16px
    lineHeight: 22,
  },
  readMore: {
    fontSize: scaledFontSize(14), // Base size 14px
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
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    fontSize: scaledFontSize(14), // Base size 14px
  },
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  sharedText: {
    fontSize: scaledFontSize(10), // Base size 10px
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateText: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptyStateSubtext: {
    fontSize: scaledFontSize(14), // Base size 14px
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  addEntryButton: {
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  addEntryButtonText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
  },
  floatingAddButton: {
    position: "absolute",
    bottom: 80,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
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
    borderRadius: 16,
    padding: Spacing.xl,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  dateInputContainer: {
    marginBottom: Spacing.lg,
  },
  dateLabel: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: Spacing.lg,
  },
  dateInputText: {
    fontSize: scaledFontSize(16), // Base size 16px
  },
  dateInputPlaceholder: {
    color: Colors.textTertiary,
  },
  dateHint: {
    fontSize: scaledFontSize(14), // Base size 14px
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
  },
  modalApplyButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  modalApplyButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  modalApplyText: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
  },
});