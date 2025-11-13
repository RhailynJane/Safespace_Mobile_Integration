/**
 * ResourcesScreen - React Native Component
 * 
 * Main resources hub providing access to mental health content including:
 * - Categorized resources (Stress, Anxiety, Depression, Sleep, Motivation, Mindfulness)
 * - Quick access to daily affirmations and random quotes
 * - Search functionality across all resources
 * - Featured content highlighting
 * - External API integration for fresh content
 * 
 * Features:
 * - Category-based filtering with visual indicators
 * - Real-time search with debouncing
 * - Pull-to-refresh for content updates
 * - Featured resource spotlight
 * - Quick action buttons for instant access
 * - Responsive design with curved background
 * 
 * Content Types:
 * - Articles, exercises, and educational materials
 * - Daily affirmations for positive reinforcement
 * - Inspirational quotes from external APIs
 * - Categorized mental health resources
 * 
 * Navigation:
 * - Bottom tab navigation for app sections
 * - Resource detail screen for full content viewing
 * - Category-based filtering within resources
 * 
 * Data Flow:
 * - Loads resources from local database on mount
 * - Integrates external APIs for quotes and affirmations
 * - Filters content based on category selection
 * - Searches across title, content, and categories
 * 
 * LLM Prompt: Add comprehensive comments to this React Native component.
 * Reference: chat.deepseek.com
 */

// app/(app)/resources/index.tsx
import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import StatusModal from "../../../components/StatusModal";
import { useTheme } from "../../../contexts/ThemeContext";
import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Resource interface for Convex
interface Resource {
  id: string;
  title: string;
  type: 'Affirmation' | 'Quote' | 'Article' | 'Exercise' | 'Guide';
  duration: string;
  category: string;
  content: string;
  author?: string;
  image_emoji: string;
  backgroundColor: string;
  tags?: string[];
  isExternal?: boolean;
}

/**
 * Category interface defining the structure for resource categorization
 * Used for filtering and organizing mental health resources
 */
interface Category {
  id: string;
  name: string;
  icon: string; // Emoji representation
  color: string; // Background color for category cards
}

/**
 * Predefined categories for mental health resources
 * Each category has unique visual identity and purpose
 */
const CATEGORIES: Category[] = [
  {
    id: 'stress',
    name: 'Stress',
    icon: '💧', // Water drop symbolizing calmness
    color: '#FF8A65', // Soft orange
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    icon: '🧠', // Brain symbolizing mental processes
    color: '#81C784', // Calming green
  },
  {
    id: 'depression',
    name: 'Depression',
    icon: '👥', // People symbolizing support
    color: '#64B5F6', // Soothing blue
  },
  {
    id: 'sleep',
    name: 'Sleep',
    icon: '🛏️', // Bed symbolizing rest
    color: '#4DD0E1', // Tranquil teal
  },
  {
    id: 'motivation',
    name: 'Motivation',
    icon: '⚡', // Lightning bolt symbolizing energy
    color: '#FFB74D', // Energetic orange
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    icon: '🧘', // Meditation symbol
    color: '#BA68C8', // Spiritual purple
  }
];

/**
 * Main Resources Screen Component
 * 
 * Serves as the central hub for accessing mental health resources
 * with advanced filtering, search, and quick access features
 */
export default function ResourcesScreen() {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  
  // State management for UI and data
  const [loading, setLoading] = useState(true); // Initial loading state
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state
  const [activeTab, setActiveTab] = useState("resources"); // Bottom navigation active tab
  const [searchQuery, setSearchQuery] = useState(""); // Search input value
  const [selectedCategory, setSelectedCategory] = useState(""); // Currently selected category filter
  const [resources, setResources] = useState<Resource[]>([]); // Resource data array
  const [featuredResource, setFeaturedResource] = useState<Resource | null>(null); // Highlighted resource
  const [modalVisible, setModalVisible] = useState(false); // Status modal visibility
  const [modalConfig, setModalConfig] = useState({
    type: 'error' as 'success' | 'error' | 'info',
    title: '',
    message: ''
  }); // Modal configuration

  // Convex actions for external API
  const getDailyQuoteAction = useAction(api.resources.getDailyQuote);
  const getDailyAffirmationAction = useAction(api.resources.getDailyAffirmationExternal);
  const addBookmark = useMutation(api.resources.addBookmark);
  const removeBookmark = useMutation(api.resources.removeBookmark);

  // Fetch a fresh daily quote on mount to populate Featured (external API)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const quote = await getDailyQuoteAction();
        if (!cancelled && quote) {
          setFeaturedResource(quote as Resource);
        }
      } catch (_) {
        // ignore; featured will fall back to first quote/affirmation from DB
      }
    })();
    return () => { cancelled = true; };
  }, [getDailyQuoteAction]);

  /**
   * Create styles dynamically based on text size scaling
   * Uses useMemo for performance optimization
   */
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  /**
   * Bottom navigation tabs configuration
   * Provides navigation between main app sections
   */
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Show modal with specified configuration
   * Replaces Alert.alert with consistent modal UI
   */
  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  /**
   * Hide modal and reset configuration
   */
  const hideModal = () => {
    setModalVisible(false);
    setModalConfig({ type: 'error', title: '', message: '' });
  };

  // Live resources component using Convex subscriptions
  const LiveResources = () => {
    const liveResources = useQuery(
      api.resources.listResources,
      { limit: 100 }
    ) as { resources: Resource[] } | undefined;
    const bookmarkIds = useQuery(
      user?.id ? api.resources.listBookmarkedIds : undefined as any,
      user?.id ? { userId: user.id } : "skip"
    ) as { ids: string[] } | undefined;

    useEffect(() => {
      if (liveResources !== undefined) {
        if (liveResources?.resources) {
          setResources(liveResources.resources);
          // Set first quote or affirmation as featured content
          const featured = liveResources.resources.find((r: Resource) => r.type === 'Quote' || r.type === 'Affirmation');
          setFeaturedResource(featured || null);
        } else {
          setResources([]);
        }
        setLoading(false);
      }
    }, [liveResources]);

    // Track favorites set locally for quick lookup
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    useEffect(() => {
      if (bookmarkIds?.ids) {
        setFavoriteIds(new Set(bookmarkIds.ids.map(String)));
      }
    }, [bookmarkIds?.ids]);

    // Expose helper as property on component (closure alternative)
    (ResourcesScreen as any)._favoriteIds = favoriteIds;

    return null;
  };

  // Live category resources component
  const LiveCategoryResources = ({ category }: { category: string }) => {
    const liveResources = useQuery(
      api.resources.listByCategory,
      { category, limit: 50 }
    ) as { resources: Resource[] } | undefined;
    const bookmarkIds = useQuery(
      user?.id ? api.resources.listBookmarkedIds : undefined as any,
      user?.id ? { userId: user.id } : "skip"
    ) as { ids: string[] } | undefined;

    useEffect(() => {
      if (liveResources !== undefined) {
        if (liveResources?.resources) {
          setResources(liveResources.resources);
        } else {
          setResources([]);
        }
        setLoading(false);
      }
    }, [liveResources, category]);

    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    useEffect(() => {
      if (bookmarkIds?.ids) {
        setFavoriteIds(new Set(bookmarkIds.ids.map(String)));
      }
    }, [bookmarkIds?.ids]);
    (ResourcesScreen as any)._favoriteIds = favoriteIds;

    return null;
  };

  // Live search results component
  const LiveSearchResults = ({ query }: { query: string }) => {
    const searchResults = useQuery(
      api.resources.search,
      { query, limit: 50 }
    ) as { resources: Resource[] } | undefined;
    const bookmarkIds = useQuery(
      user?.id ? api.resources.listBookmarkedIds : undefined as any,
      user?.id ? { userId: user.id } : "skip"
    ) as { ids: string[] } | undefined;

    useEffect(() => {
      if (searchResults !== undefined) {
        if (searchResults?.resources) {
          setResources(searchResults.resources);
        } else {
          setResources([]);
        }
        setLoading(false);
      }
    }, [searchResults, query]);

    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    useEffect(() => {
      if (bookmarkIds?.ids) {
        setFavoriteIds(new Set(bookmarkIds.ids.map(String)));
      }
    }, [bookmarkIds?.ids]);
    (ResourcesScreen as any)._favoriteIds = favoriteIds;

    return null;
  };

  /**
   * Handle pull-to-refresh gesture
   * Reloads all resources and resets refresh state
   */
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Pull a fresh external daily quote on refresh
      const quote = await getDailyQuoteAction();
      if (quote) setFeaturedResource(quote as Resource);
    } catch (_) {
      // noop
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  /**
   * Handle category filter selection
   * Toggles category on/off
   * 
   * @param categoryId - The ID of the category to filter by
   */
  const handleCategoryPress = (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? "" : categoryId;
    setSelectedCategory(newCategory);
    setLoading(true);
  };

  /**
   * Handle search functionality
   * Live Convex subscription handles the actual search
   */
  useEffect(() => {
    // No manual search needed - LiveSearchResults component handles it
  }, [searchQuery]);

  /**
   * Handle bottom navigation tab press
   * Navigates between different app sections
   * 
   * @param tabId - The ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Handle resource item press
   * Navigates to resource detail screen with full content
   * 
   * @param resource - The resource object to display
   */
  const handleResourcePress = (resource: Resource) => {
    router.push({
      pathname: "/(app)/resources/resource-detail-screen",
      params: {
        id: resource.id,
        title: resource.title,
        content: resource.content,
        author: resource.author || "Unknown",
        type: resource.type,
        category: resource.category,
        imageEmoji: resource.image_emoji,
        backgroundColor: resource.backgroundColor,
      },
    });
  };

  // Toggle favorite (bookmark) for a resource
  const handleToggleFavorite = async (resource: Resource) => {
    if (!user?.id) return;
    const favoriteIds: Set<string> = (ResourcesScreen as any)._favoriteIds || new Set();
    const isFav = favoriteIds.has(resource.id);
    try {
      if (isFav) {
        await removeBookmark({ userId: user.id, resourceId: resource.id as any });
        favoriteIds.delete(resource.id);
      } else {
        await addBookmark({ userId: user.id, resourceId: resource.id as any });
        favoriteIds.add(resource.id);
      }
      (ResourcesScreen as any)._favoriteIds = new Set(favoriteIds);
      // Force a re-render by updating resources with same array reference (small hack)
      setResources((prev) => [...prev]);
    } catch (_) {
      // Optionally show modal on failure
    }
  };

  /**
   * Handle daily affirmation quick action
   * Fetches and displays a random affirmation using Convex action
   */
  const handleDailyAffirmation = async () => {
    try {
      const affirmation = await getDailyAffirmationAction();
      if (affirmation) {
        handleResourcePress(affirmation as Resource);
      } else {
        showModal(
          'error',
          'Affirmation Error',
          'Could not load daily affirmation. Please try again.'
        );
      }
    } catch (error) {
      console.error("Error getting daily affirmation:", error);
      showModal(
        'error',
        'Affirmation Error',
        'Could not load daily affirmation. Please check your connection and try again.'
      );
    }
  };

  /**
   * Handle random quote quick action
   * Fetches and displays a random inspirational quote using Convex action
   */
  const handleRandomQuote = async () => {
    try {
      const quote = await getDailyQuoteAction();
      if (quote) {
        handleResourcePress(quote as Resource);
      } else {
        showModal(
          'error',
          'Quote Error',
          'Could not load random quote. Please try again.'
        );
      }
    } catch (error) {
      console.error("Error getting random quote:", error);
      showModal(
        'error',
        'Quote Error',
        'Could not load random quote. Please check your connection and try again.'
      );
    }
  };

  return (
    <CurvedBackground>
      {/* Live resources subscriptions */}
      {searchQuery.length > 2 ? (
        <LiveSearchResults query={searchQuery} />
      ) : selectedCategory ? (
        <LiveCategoryResources category={selectedCategory} />
      ) : (
        <LiveResources />
      )}
      
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <AppHeader title="Resources" showBack={true} />

        {/* Main Scrollable Content Area */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Featured Resource Section - Only shows when no category filter is active */}
          {featuredResource && selectedCategory === "" && (
            <View style={styles.featuredContainer}>
              <View style={[styles.featuredCard, { 
                backgroundColor: theme.colors.surface,
                borderLeftColor: theme.colors.primary
              }]}>
                <Text style={[styles.featuredLabel, { color: theme.colors.primary }]}>✨ Featured</Text>
                <Text style={[styles.featuredText, { color: theme.colors.text }]}>&quot;{featuredResource.content}&quot;</Text>
                {featuredResource.author && (
                  <Text style={[styles.featuredAuthor, { color: theme.colors.textSecondary }]}>— {featuredResource.author}</Text>
                )}
              </View>
            </View>
          )}

          {/* Quick Actions Section - Instant access to popular features */}
          <View style={styles.quickActions}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
                onPress={handleDailyAffirmation}
              >
                <View style={[styles.actionIcon, { backgroundColor: theme.isDark ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E8' }]}>
                  <Text style={styles.actionEmoji}>🌟</Text>
                </View>
                <Text style={[styles.actionText, { color: theme.colors.text }]}>Daily Affirmation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
                onPress={handleRandomQuote}
              >
                <View style={[styles.actionIcon, { backgroundColor: theme.isDark ? 'rgba(255, 152, 0, 0.2)' : '#FFF3E0' }]}>
                  <Text style={styles.actionEmoji}>💭</Text>
                </View>
                <Text style={[styles.actionText, { color: theme.colors.text }]}>Random Quote</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar Section - Global resource search */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.icon}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Search resources..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {/* Clear search button - Only shows when there's text */}
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Categories Section - Horizontal scrolling category filters */}
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Categories</Text>
              <TouchableOpacity onPress={() => setSelectedCategory("")}>
                <Text style={[styles.seeAllButton, { color: theme.colors.primary }]}>
                  {selectedCategory ? "Clear" : "All"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContainer}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    { backgroundColor: category.color },
                    selectedCategory === category.id && [styles.selectedCategory, { borderColor: theme.colors.primary }],
                  ]}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[styles.categoryName, { color: theme.colors.text }]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Resources List Section - Dynamic content based on filters */}
          <View style={styles.resourcesSection}>
            <Text style={[styles.resourcesSectionTitle, { color: theme.colors.text }]}>
              {selectedCategory
                ? `${CATEGORIES.find((c) => c.id === selectedCategory)?.name} Resources`
                : "All Resources"}
            </Text>

            {loading ? (
              // Loading State
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading resources...</Text>
              </View>
            ) : resources.length === 0 ? (
              // Empty State
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>No resources found</Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  Try adjusting your search or filters
                </Text>
              </View>
            ) : (
              // Resources List
              <View style={styles.resourcesList}>
                {resources.map((resource) => (
                  <TouchableOpacity
                    key={resource.id}
                    style={[styles.resourceCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleResourcePress(resource)}
                    activeOpacity={0.7}
                  >
                    {/* Resource Image/Emoji Container */}
                    <View
                      style={[
                        styles.resourceImageContainer,
                        { backgroundColor: resource.backgroundColor },
                      ]}
                    >
                      <Text style={styles.resourceEmoji}>{resource.image_emoji}</Text>
                    </View>

                    {/* Resource Content Details */}
                    <View style={styles.resourceContent}>
                      <Text style={[styles.resourceTitle, { color: theme.colors.text }]} numberOfLines={2}>
                        {resource.title}
                      </Text>
                      <View style={styles.resourceMeta}>
                        <Text style={[styles.resourceType, { color: theme.colors.textSecondary }]}>{resource.type}</Text>
                        <View style={[styles.resourceDot, { backgroundColor: theme.colors.textSecondary }]} />
                        <Text style={[styles.resourceDuration, { color: theme.colors.textSecondary }]}>
                          {resource.duration}
                        </Text>
                      </View>
                      {resource.author && (
                        <Text style={[styles.resourceAuthor, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                          By {resource.author}
                        </Text>
                      )}
                    </View>

                    {/* Navigation Chevron */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity onPress={() => handleToggleFavorite(resource)}>
                        <Ionicons
                          name={(ResourcesScreen as any)._favoriteIds?.has(resource.id) ? "star" : "star-outline"}
                          size={20}
                          color={(ResourcesScreen as any)._favoriteIds?.has(resource.id) ? "#FFC107" : theme.colors.icon}
                        />
                      </TouchableOpacity>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.colors.icon}
                        style={styles.resourceChevron}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Navigation Component */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        {/* Status Modal for Error/Success Messages */}
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

/**
 * Stylesheet for ResourcesScreen component
 * Organized by component sections with consistent theming
 * Uses responsive design patterns and accessibility considerations
 * Now includes dynamic font scaling via scaledFontSize parameter
 */
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: scaledFontSize(14),
    color: "#666",
  },
  
  // Featured Resource Section Styles
  featuredContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  featuredCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50", // Accent border for visual emphasis
  },
  featuredLabel: {
    fontSize: scaledFontSize(12),
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  featuredText: {
    fontSize: scaledFontSize(16),
    fontStyle: "italic",
    color: "#333",
    lineHeight: 24,
    marginBottom: 8,
  },
  featuredAuthor: {
    fontSize: scaledFontSize(14),
    color: "#666",
    textAlign: "right",
  },
  
  // Quick Actions Section Styles
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionText: {
    fontSize: scaledFontSize(12),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  
  // Search Bar Section Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: scaledFontSize(16),
    color: "#333",
  },
  
  // Categories Section Styles
  categoriesSection: {
    paddingVertical: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    color: "#333",
  },
  seeAllButton: {
    fontSize: scaledFontSize(14),
    color: "#4CAF50",
    fontWeight: "600",
  },
  categoriesScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedCategory: {
    borderWidth: 3,
    borderColor: "#4CAF50", // Highlight selected category
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: scaledFontSize(11),
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  
  // Resources List Section Styles
  resourcesSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 140, // Extra padding for bottom navigation
  },
  resourcesSectionTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  resourcesList: {
    gap: 12,
  },
  resourceCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: "center",
  },
  resourceImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  resourceEmoji: {
    fontSize: 28,
  },
  resourceContent: {
    flex: 1,
    justifyContent: "center",
  },
  resourceTitle: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  resourceMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  resourceType: {
    fontSize: scaledFontSize(13),
    color: "#666",
  },
  resourceDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#666",
    marginHorizontal: 6,
  },
  resourceDuration: {
    fontSize: scaledFontSize(13),
    color: "#666",
  },
  resourceAuthor: {
    fontSize: scaledFontSize(12),
    color: "#999",
    fontStyle: "italic",
  },
  resourceChevron: {
    marginLeft: 8,
  },
  
  // Empty State Styles
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: scaledFontSize(14),
    color: "#666",
    textAlign: "center",
  },
});