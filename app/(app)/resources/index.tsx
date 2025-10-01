// app/(app)/resources/index.tsx
import { useState, useEffect } from "react";
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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { 
  Resource, 
  fetchAllResourcesWithExternal,
  fetchResourcesByCategory,
  searchResources,
  getDailyAffirmation,
  getRandomQuote,
  getBookmarkedResources
} from "../../../utils/resourcesApi";

// Category definitions
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'saved',
    name: 'Saved',
    icon: '💾',
    color: '#9C27B0',
  },
  {
    id: 'stress',
    name: 'Stress',
    icon: '💧',
    color: '#FF8A65',
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    icon: '🧠',
    color: '#81C784',
  },
  {
    id: 'depression',
    name: 'Depression',
    icon: '👥',
    color: '#64B5F6',
  },
  {
    id: 'sleep',
    name: 'Sleep',
    icon: '🛏️',
    color: '#4DD0E1',
  },
  {
    id: 'motivation',
    name: 'Motivation',
    icon: '⚡',
    color: '#FFB74D',
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    icon: '🧘',
    color: '#BA68C8',
  }
];

export default function ResourcesScreen() {
  const { userId } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("resources");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [featuredResource, setFeaturedResource] = useState<Resource | null>(null);

  // Navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Load resources on component mount
  useEffect(() => {
    loadResources();
  }, []);

  // Load resources from local API with external integration
  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await fetchAllResourcesWithExternal();
      setResources(data);
      
      // Set first quote/affirmation as featured
      const featured = data.find(r => r.type === 'Quote' || r.type === 'Affirmation');
      setFeaturedResource(featured || null);
    } catch (error) {
      console.error("Error loading resources:", error);
      Alert.alert(
        "Error",
        "Could not load resources.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  // Handle category filter
  const handleCategoryPress = async (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? "" : categoryId;
    setSelectedCategory(newCategory);

    if (newCategory === 'saved') {
      setLoading(true);
      try {
        const savedResources = await getBookmarkedResources();
        setResources(savedResources);
      } catch (error) {
        console.error("Error loading saved resources:", error);
        Alert.alert("Error", "Could not load saved resources.");
      } finally {
        setLoading(false);
      }
    } else if (newCategory) {
      setLoading(true);
      try {
        const categoryResources = await fetchResourcesByCategory(newCategory);
        setResources(categoryResources);
      } catch (error) {
        console.error("Error loading category resources:", error);
      } finally {
        setLoading(false);
      }
    } else {
      loadResources();
    }
  };

  // Handle search with debounce
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(async () => {
        setLoading(true);
        try {
          const searchResults = await searchResources(searchQuery);
          setResources(searchResults);
        } catch (error) {
          console.error("Error searching resources:", error);
        } finally {
          setLoading(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (searchQuery.length === 0 && selectedCategory === "") {
      loadResources();
    }

    return undefined;
  }, [searchQuery, selectedCategory]);

  // Handle tab navigation
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Handle resource selection
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

  // Handle daily affirmation
  const handleDailyAffirmation = async () => {
    try {
      const affirmation = await getDailyAffirmation();
      handleResourcePress(affirmation);
    } catch (error) {
      console.error("Error getting daily affirmation:", error);
    }
  };

  // Handle random quote
  const handleRandomQuote = async () => {
    try {
      const quote = await getRandomQuote();
      handleResourcePress(quote);
    } catch (error) {
      console.error("Error getting random quote:", error);
    }
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Resources" showBack={true} />

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4CAF50"]}
              tintColor="#4CAF50"
            />
          }
        >
          {/* Featured Resource Section */}
          {featuredResource && selectedCategory === "" && (
            <View style={styles.featuredContainer}>
              <View style={styles.featuredCard}>
                <Text style={styles.featuredLabel}>✨ Featured</Text>
                <Text style={styles.featuredText}>&quot;{featuredResource.content}&quot;</Text>
                {featuredResource.author && (
                  <Text style={styles.featuredAuthor}>— {featuredResource.author}</Text>
                )}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={handleDailyAffirmation}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#E8F5E8' }]}>
                  <Text style={styles.actionEmoji}>🌟</Text>
                </View>
                <Text style={styles.actionText}>Daily Affirmation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={handleRandomQuote}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={styles.actionEmoji}>💭</Text>
                </View>
                <Text style={styles.actionText}>Random Quote</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons
                name="search"
                size={20}
                color="#999"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search resources..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Categories Section */}
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => setSelectedCategory("")}>
                <Text style={styles.seeAllButton}>
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
                    selectedCategory === category.id && styles.selectedCategory,
                  ]}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Resources List */}
          <View style={styles.resourcesSection}>
            <Text style={styles.resourcesSectionTitle}>
              {selectedCategory === 'saved'
                ? "Saved Resources"
                : selectedCategory
                ? `${CATEGORIES.find((c) => c.id === selectedCategory)?.name} Resources`
                : "All Resources"}
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading resources...</Text>
              </View>
            ) : resources.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>
                  {selectedCategory === 'saved' ? '💾' : '🔍'}
                </Text>
                <Text style={styles.emptyText}>
                  {selectedCategory === 'saved' 
                    ? "No saved resources yet"
                    : "No resources found"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {selectedCategory === 'saved'
                    ? "Bookmark resources to access them quickly"
                    : "Try adjusting your search or filters"}
                </Text>
              </View>
            ) : (
              <View style={styles.resourcesList}>
                {resources.map((resource) => (
                  <TouchableOpacity
                    key={resource.id}
                    style={styles.resourceCard}
                    onPress={() => handleResourcePress(resource)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.resourceImageContainer,
                        { backgroundColor: resource.backgroundColor },
                      ]}
                    >
                      <Text style={styles.resourceEmoji}>{resource.image_emoji}</Text>
                    </View>

                    <View style={styles.resourceContent}>
                      <Text style={styles.resourceTitle} numberOfLines={2}>
                        {resource.title}
                      </Text>
                      <View style={styles.resourceMeta}>
                        <Text style={styles.resourceType}>{resource.type}</Text>
                        <View style={styles.resourceDot} />
                        <Text style={styles.resourceDuration}>
                          {resource.duration}
                        </Text>
                      </View>
                      {resource.author && (
                        <Text style={styles.resourceAuthor} numberOfLines={1}>
                          By {resource.author}
                        </Text>
                      )}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#999"
                      style={styles.resourceChevron}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
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
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
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
    borderLeftColor: "#4CAF50",
  },
  featuredLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  featuredText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#333",
    lineHeight: 24,
    marginBottom: 8,
  },
  featuredAuthor: {
    fontSize: 14,
    color: "#666",
    textAlign: "right",
  },
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
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
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
    fontSize: 16,
    color: "#333",
  },
  categoriesSection: {
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  seeAllButton: {
    fontSize: 14,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedCategory: {
    borderWidth: 3,
    borderColor: "#4CAF50",
    transform: [{ scale: 1.05 }],
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  resourcesSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  resourcesSectionTitle: {
    fontSize: 18,
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
    fontSize: 15,
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
    fontSize: 13,
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
    fontSize: 13,
    color: "#666",
  },
  resourceAuthor: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  resourceChevron: {
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});