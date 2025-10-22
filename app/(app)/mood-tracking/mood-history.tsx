import React, { useState, useEffect, useCallback } from "react";
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
  Alert,
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
import { useTheme } from "../../../contexts/ThemeContext";

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
  const { theme } = useTheme();
  const { user } = useUser();
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [allFactors, setAllFactors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mood");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
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
      console.error("Error loading mood history:", error);
      if (reset && moodHistory.length === 0) {
        // Only show alert on initial load if there's an error
        Alert.alert("Info", "Unable to load mood history. Please try again.");
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
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this mood entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await moodApi.deleteMood(moodId);
              setMoodHistory((prev) => prev.filter((m) => m.id !== moodId));
              Alert.alert("Success", "Mood entry deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete mood entry");
            }
          },
        },
      ]
    );
  };

  // Render mood entry card
  const renderMoodEntry = ({ item }: { item: MoodEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryEmoji}>{item.mood_emoji}</Text>
        <View style={styles.entryDetails}>
          <Text style={styles.entryMood}>{item.mood_label}</Text>
          <Text style={styles.entryDate}>
            {new Date(item.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View style={styles.entryActions}>
          <Text style={styles.entryIntensity}>★ {item.intensity}/5</Text>
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
        <Text style={styles.entryNotes} numberOfLines={3}>
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
            <ActivityIndicator size="large" color="#4CAF50" />
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
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color="#4CAF50" />
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
                    <Ionicons name="close-circle" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              )}
              {startDate && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    From: {formatDate(startDate)}
                  </Text>
                  <TouchableOpacity onPress={() => setStartDate(null)}>
                    <Ionicons name="close-circle" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              )}
              {endDate && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    To: {formatDate(endDate)}
                  </Text>
                  <TouchableOpacity onPress={() => setEndDate(null)}>
                    <Ionicons name="close-circle" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedFactors.map((factor) => (
                <View key={factor} style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{factor}</Text>
                  <TouchableOpacity onPress={() => toggleFactor(factor)}>
                    <Ionicons name="close-circle" size={16} color="#4CAF50" />
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
              <Text style={styles.emptyText}>
                {activeFiltersCount > 0 
                  ? "No mood entries found for the selected filters" 
                  : "No mood entries found"
                }
              </Text>
              {activeFiltersCount > 0 && (
                <Text style={styles.emptySubtext}>
                  Try adjusting your filters or clear them to see all entries
                </Text>
              )}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/(app)/mood-tracking")}
              >
                <Text style={styles.addButtonText}>Log Your First Mood</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loading && offset > 0 ? (
              <ActivityIndicator size="small" color="#4CAF50" style={{ marginVertical: 20 }} />
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
            <View style={styles.filterModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Moods</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Mood Type Filter */}
                <Text style={styles.filterLabel}>Mood Type</Text>
                <View style={styles.moodTypeGrid}>
                  {moodTypes.map((mood) => (
                    <TouchableOpacity
                      key={mood.value}
                      style={[
                        styles.moodTypeChip,
                        selectedMoodType === mood.value &&
                          styles.moodTypeChipActive,
                      ]}
                      onPress={() =>
                        setSelectedMoodType(
                          selectedMoodType === mood.value ? "" : mood.value
                        )
                      }
                    >
                      <Text style={styles.moodTypeEmoji}>{mood.emoji}</Text>
                      <Text style={styles.moodTypeLabel}>{mood.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Factors Filter */}
                {allFactors.length > 0 && (
                  <>
                    <Text style={styles.filterLabel}>Factors</Text>
                    <View style={styles.factorsGrid}>
                      {allFactors.map((factor) => (
                        <TouchableOpacity
                          key={factor}
                          style={[
                            styles.factorFilterChip,
                            selectedFactors.includes(factor) &&
                              styles.factorFilterChipActive,
                          ]}
                          onPress={() => toggleFactor(factor)}
                        >
                          <Text
                            style={[
                              styles.factorFilterText,
                              selectedFactors.includes(factor) &&
                                styles.factorFilterTextActive,
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
                <Text style={styles.filterLabel}>Date Range</Text>
                
                {/* Start Date */}
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>From:</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(startDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  {startDate && (
                    <TouchableOpacity onPress={() => setStartDate(null)}>
                      <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* End Date */}
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>To:</Text>
                  <Text style={styles.dateHint}>(Leave empty for single day)</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(endDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  {endDate && (
                    <TouchableOpacity onPress={() => setEndDate(null)}>
                      <Ionicons name="close-circle" size={20} color="#999" />
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

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyFilters}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF",
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
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  entryCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
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
    fontSize: 32,
    marginRight: 12,
  },
  entryDetails: {
    flex: 1,
  },
  entryMood: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  entryDate: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  entryActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  entryIntensity: {
    fontSize: 14,
    color: "#4CAF50",
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
    fontSize: 12,
    fontWeight: "500",
  },
  entryNotes: {
    fontSize: 14,
    color: "#666",
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
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginBottom: 24,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: "#FFF",
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
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  modalContent: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
    backgroundColor: "#E8F5E9",
  },
  moodTypeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodTypeLabel: {
    fontSize: 12,
    color: "#666",
  },
  factorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  factorFilterChip: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  factorFilterChipActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  factorFilterText: {
    fontSize: 14,
    color: "#666",
  },
  factorFilterTextActive: {
    color: "#2E7D32",
    fontWeight: "500",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    width: 50,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateButtonText: {
    fontSize: 14,
    color: "#333",
  },
  dateHint: {
    fontSize: 12,
    color: "#999",
    fontStyle: 'italic',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});