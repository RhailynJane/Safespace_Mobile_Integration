import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AppHeader } from "../../../components/AppHeader";
import CurvedBackground from "../../../components/CurvedBackground";
import BottomNavigation from "../../../components/BottomNavigation";
import { moodApi, MoodEntry, MoodFilters } from "../../../utils/moodApi";
import { APP_TIME_ZONE } from "../../../utils/timezone";
import { useTheme } from "../../../contexts/ThemeContext";
import StatusModal from "../../../components/StatusModal";

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

export default function MoodHistoryScreen() {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [allFactors, setAllFactors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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
  
  // Filter states
  const [selectedMoodType, setSelectedMoodType] = useState<string>("");
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Pagination
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideStatusModal = () => {
    setModalVisible(false);
  };

  // Load mood history with filters
  const loadMoodHistory = useCallback(async (reset: boolean = false) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      const filters: MoodFilters = {
        limit: LIMIT,
        offset: currentOffset,
      };

      if (selectedMoodType) filters.moodType = selectedMoodType;
      
      // Fix date filtering logic
      if (startDate) {
        // Set start date to beginning of day
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        filters.startDate = startOfDay.toISOString();
      }
      
      if (endDate) {
        // Set end date to end of day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filters.endDate = endOfDay.toISOString();
      } else if (startDate && !endDate) {
        // If only start date is selected, search for that single day
        const endOfDay = new Date(startDate);
        endOfDay.setHours(23, 59, 59, 999);
        filters.endDate = endOfDay.toISOString();
      }
      
      if (selectedFactors.length > 0) {
        filters.factors = selectedFactors.join(",");
      }

      console.log('Loading mood history with filters:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        moodType: filters.moodType,
        factors: filters.factors
      });

      const data = await moodApi.getMoodHistory(user.id, filters);

      if (reset) {
        setMoodHistory(data.moods);
        setOffset(LIMIT);
      } else {
        setMoodHistory((prev) => [...prev, ...data.moods]);
        setOffset((prev) => prev + LIMIT);
      }

      setHasMore(data.moods.length === LIMIT);
      
      console.log('Loaded', data.moods.length, 'mood entries');
    } catch (error) {
      console.error("Failed to load mood history:", error);
      if (reset && moodHistory.length === 0) {
        // Only show alert on initial load if there's an error
        showStatusModal('error', 'Load Failed', 'Unable to load mood history. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedMoodType, selectedFactors, startDate, endDate, offset, moodHistory.length]);

  // Load available factors
  const loadFactors = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await moodApi.getFactors(user.id);
      setAllFactors(data.factors.map((f: any) => f.factor));
    } catch (error) {
      console.error("Error loading factors:", error);
      showStatusModal('error', 'Load Failed', 'Unable to load mood factors. Please try again.');
    }
  }, [user?.id]);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadMoodHistory(true);
        loadFactors();
      }
    }, [user?.id, loadMoodHistory, loadFactors])
  );

  // Apply filters
  const applyFilters = () => {
    setFilterModalVisible(false);
    setOffset(0);
    loadMoodHistory(true);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedMoodType("");
    setSelectedFactors([]);
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
    setOffset(0);
    loadMoodHistory(true);
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
    try {
      await moodApi.deleteMood(selectedMoodId);
      setMoodHistory((prev) => prev.filter((m) => m.id !== selectedMoodId));
      showStatusModal('success', 'Success', 'Mood entry deleted successfully.');
    } catch (error) {
      showStatusModal('error', 'Delete Failed', 'Unable to delete mood entry. Please try again.');
    }
  };

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

  if (loading && offset === 0) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Mood History" showBack={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading mood history...
            </Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

        {/* Mood History List */}
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderMoodEntry}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasMore && !loading) {
              loadMoodHistory(false);
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