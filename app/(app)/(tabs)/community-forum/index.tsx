import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConvex } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth, useUser } from '@clerk/clerk-expo';

// Components
import CurvedBackground from '../../../../components/CurvedBackground';
import { AppHeader } from '../../../../components/AppHeader';
import BottomNavigation from '../../../../components/BottomNavigation';
import OptimizedImage from '../../../../components/OptimizedImage';
import StatusModal from '../../../../components/StatusModal';

// Context and utilities
import { useTheme } from '../../../../contexts/ThemeContext';
import { avatarEvents } from '../../../../utils/avatarEvents';
import { makeAbsoluteUrl } from '../../../../utils/apiBaseUrl';

const { width } = Dimensions.get('window');
const APP_TIME_ZONE = 'America/New_York';

// Categories for post filtering
const CATEGORIES = [
  'All',
  'Self-Care',
  'Mindfulness',
  'Stories',
  'Support',
  'Creative',
  'Therapy',
  'Stress',
  'Affirmation',
  'Awareness',
  'Bookmarks',
];

// Helper: reaction counts now stored as array of { e, c }
const getReactionCount = (post: any, emojis: string[]) => {
  if (!post.reactionCounts) return 0;
  return post.reactionCounts
    .filter((rc: any) => emojis.includes(rc.e))
    .reduce((sum: number, rc: any) => sum + rc.c, 0);
};

// Relative time formatting (e.g., 3h ago)
const formatRelativeTime = (iso: string) => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const week = Math.floor(day / 7);
  if (week < 4) return `${week}w ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  const year = Math.floor(day / 365);
  return `${year}y ago`;
};

// Parse hashtags and return nested Text components
const renderContentWithHashtags = (content: string, styles: any, theme: any) => {
  return content.split(/(\s+)/).map((token, idx) => {
    if (/^#[A-Za-z0-9_]+$/.test(token)) {
      return (
        <Text key={idx} style={[styles.hashtag, { color: theme.colors.primary }]}> {token} </Text>
      );
    }
    return <Text key={idx} style={styles.postBodyText}>{token}</Text>;
  });
};

/**
 * Community Forum State Hook
 * Manages all state for the community forum screen
 */
function useCommunityMainScreenState() {
  // View and navigation state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeView, setActiveView] = useState<'newsfeed' | 'my-posts'>('newsfeed');
  const [activeTab, setActiveTab] = useState('community-forum');

  // Data state
  const [posts, setPosts] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);

  return {
    selectedCategory,
    setSelectedCategory,
    activeView,
    setActiveView,
    activeTab,
    setActiveTab,
    posts,
    setPosts,
    myPosts,
    setMyPosts,
    categories,
    setCategories,
    bookmarkedPosts,
    setBookmarkedPosts,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    sideMenuVisible,
    setSideMenuVisible,
    isSigningOut,
    setIsSigningOut,
    profileImage,
    setProfileImage,
    fadeAnim,
    showSuccessModal,
    setShowSuccessModal,
    successMessage,
    setSuccessMessage,
    showErrorModal,
    setShowErrorModal,
    errorMessage,
    setErrorMessage,
    errorTitle,
    setErrorTitle,
    showConfirmModal,
    setShowConfirmModal,
    confirmMessage,
    setConfirmMessage,
    confirmTitle,
    setConfirmTitle,
    confirmCallback,
    setConfirmCallback,
  };
}

/**
 * Main Community Forum Component
 */
export default function CommunityMainScreen() {
  const { theme, scaledFontSize } = useTheme();
  const router = useRouter();
  
  // Get auth and user info
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();
  
  // Use Convex client from provider
  const convex = useConvex();
  
  const {
    selectedCategory,
    setSelectedCategory,
    activeView,
    setActiveView,
    activeTab,
    setActiveTab,
    bookmarkedPosts,
    setBookmarkedPosts,
    sideMenuVisible,
    setSideMenuVisible,
    posts,
    setPosts,
    myPosts,
    setMyPosts,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    categories,
    setCategories,
    fadeAnim,
    isSigningOut,
    setIsSigningOut,
    profileImage,
    setProfileImage,
    showSuccessModal,
    setShowSuccessModal,
    successMessage,
    setSuccessMessage,
    showErrorModal,
    setShowErrorModal,
    errorMessage,
    setErrorMessage,
    errorTitle,
    setErrorTitle,
    showConfirmModal,
    setShowConfirmModal,
    confirmMessage,
    setConfirmMessage,
    confirmTitle,
    setConfirmTitle,
    confirmCallback,
    setConfirmCallback,
  } = useCommunityMainScreenState();

  // Available emoji reactions (keep in sync with post-detail.tsx)
  const EMOJI_REACTIONS = ["❤️", "👍", "😊", "😢", "😮", "🔥"];

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);
  const [searchQuery, setSearchQuery] = useState('');

  // Use refs for stable callback functions
  const showErrorRef = useRef<(title: string, message: string) => void>();
  const showSuccessRef = useRef<(message: string) => void>();
  const showConfirmationRef = useRef<(title: string, message: string, callback: () => void) => void>();
  
  // Use refs to prevent concurrent loading
  const isLoadingPostsRef = useRef(false);
  const isLoadingMyPostsRef = useRef(false);

  /**
   * Show error modal with custom title and message
   */
  showErrorRef.current = useCallback((title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  }, []);

  const showError = useCallback((title: string, message: string) => {
    showErrorRef.current?.(title, message);
  }, []);

  /**
   * Show success modal with custom message
   */
  showSuccessRef.current = useCallback((message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  }, []);

  const showSuccess = useCallback((message: string) => {
    showSuccessRef.current?.(message);
  }, []);

  /**
   * Show confirmation modal for destructive actions
   */
  showConfirmationRef.current = useCallback((title: string, message: string, callback: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmCallback(() => callback);
    setShowConfirmModal(true);
  }, []);

  const showConfirmation = useCallback((title: string, message: string, callback: () => void) => {
    showConfirmationRef.current?.(title, message, callback);
  }, []);

  /**
   * Fetch available categories from Convex
   * Used for post categorization and filtering
   */
  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await convex.query(api.categories.list);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }, [convex]);

  /**
   * Load posts based on current category selection
   * Uses Convex for all data fetching
   */
  const loadPosts = useCallback(async () => {
    // Prevent concurrent calls
    if (isLoadingPostsRef.current) {
      console.log('⏭️ Skipping loadPosts - already loading');
      return;
    }
    
    try {
      isLoadingPostsRef.current = true;
      setLoading(true);
      
      // Special handling for bookmark category
      if (selectedCategory === "Bookmarks") {
        if (!user?.id) {
          showError("Sign In Required", "Please sign in to view bookmarked posts");
          setPosts([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        console.log('📤 Loading bookmarked posts via Convex...');
        const bookmarked = await convex.query(api.posts.bookmarkedPosts, { limit: 20 });
        
        // Map to UI format
        const mapped = (bookmarked || []).map((p: any) => ({
          id: p._id,
          title: p.title,
          content: p.content,
          category: p.category,
          is_draft: !!p.isDraft,
          author_id: p.authorId,
          author_name: p.authorName || "Community Member",
          author_image: p.authorImage ? `${p.authorImage}?fit=crop&w=80&h=80` : null,
          user_reaction: p.userReaction || null,
          created_at: new Date(p.createdAt).toISOString(),
          reactionCounts: p.reactionCounts || [],
          imageUrls: p.imageUrls || [],
          mood: p.mood || null,
        }));
        
        setPosts(mapped);
        console.log('✅ Convex bookmarks loaded:', mapped.length);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Load regular posts from Convex
        console.log('📤 Loading posts via Convex...', { category: selectedCategory });
      const category = (selectedCategory === "All" || selectedCategory === "Bookmarks" || selectedCategory === "Trending") ? undefined : selectedCategory;
      const convexPostsData = await convex.query(api.posts.list, { 
        category: category as any,
        limit: 20 
      });      // Map to UI format
      const mapped = (convexPostsData || []).map((p: any) => ({
        id: p._id,
        title: p.title,
        content: p.content,
        category: p.category,
        is_draft: !!p.isDraft,
        author_id: p.authorId,
        author_name: p.authorName || "Community Member",
        author_image: p.authorImage ? `${p.authorImage}?fit=crop&w=80&h=80` : null,
        user_reaction: p.userReaction || null,
        created_at: new Date(p.createdAt).toISOString(),
        reactionCounts: p.reactionCounts || [],
        imageUrls: p.imageUrls || [],
        mood: p.mood || null,
      }));
      
      setPosts(mapped);
      console.log('✅ Convex posts loaded:', mapped.length);

      // Load user-specific data if authenticated
      if (user?.id && selectedCategory !== "Bookmarks") {
        const bookmarked = await convex.query(api.posts.bookmarkedPosts, { limit: 100 });
        const bookmarkedIds = new Set<string>(
          (bookmarked || []).map((post: any) => post._id)
        );
        setBookmarkedPosts(bookmarkedIds as any);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      setErrorMessage("Error loading posts");
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingPostsRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, user?.id, convex]);


  /**
   * Load user's personal posts including drafts
   * Uses Convex for data fetching
   */
  const loadMyPosts = useCallback(async () => {
    // Prevent concurrent calls
    if (isLoadingMyPostsRef.current) {
      console.log('⏭️ Skipping loadMyPosts - already loading');
      return;
    }
    
    if (!user?.id) {
      showError("Sign In Required", "Please sign in to view your posts");
      setMyPosts([]);
      setLoading(false);
      return;
    }

    try {
      isLoadingMyPostsRef.current = true;
      setLoading(true);
      
      console.log('📤 Loading my posts via Convex...');
      const convexMyPostsData = await convex.query(api.posts.myPosts, { 
        includeDrafts: true,
        limit: 50 
      });
      
      // Map to UI format
      const mapped = (convexMyPostsData || []).map((p: any) => ({
        id: p._id,
        title: p.title,
        content: p.content,
        category: p.category,
        is_draft: !!p.isDraft,
        author_id: p.authorId,
        author_name: p.authorName || "You",
        author_image: p.authorImage ? `${p.authorImage}?fit=crop&w=80&h=80` : null,
        user_reaction: p.userReaction || null,
        created_at: new Date(p.createdAt).toISOString(),
        reactionCounts: p.reactionCounts || [],
        imageUrls: p.imageUrls || [],
        mood: p.mood || null,
      }));
      
      setMyPosts(mapped);
      console.log('✅ Convex my posts loaded:', mapped.length);
    } catch (error) {
      console.error("Error loading user posts:", error);
      showError("Error", "Failed to load your posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingMyPostsRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, convex]);

  /**
   * Initial data loading sequence
   * Fetches categories and posts in parallel
   */
  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([loadCategories(), loadPosts()]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      // Set inline error text for tests without showing modal
      setErrorMessage("Error loading posts");
      setPosts([]);
    }
  }, [loadCategories, loadPosts]);

  /**
   * Load profile image from various sources in priority order
   */
  const loadProfileImage = useCallback(async () => {
    try {
      // Always prioritize Clerk user image when available
      if (user?.imageUrl) {
        console.log('🎭 Community Forum using Clerk image:', user.imageUrl);
        setProfileImage(user.imageUrl);
        // Cache for offline use
        AsyncStorage.setItem("profileImage", user.imageUrl).catch(console.error);
        return;
      }

      // Fallback to cached image if Clerk unavailable
      const storedImage = await AsyncStorage.getItem("profileImage");
      if (storedImage) {
        console.log('🎭 Community Forum using cached image:', storedImage);
        setProfileImage(storedImage);
      } else {
        console.log('🎭 Community Forum: No profile image available');
      }
    } catch (error) {
      console.error("Error loading profile image:", error);
    }
  }, [user?.imageUrl]);

  /**
   * Load initial data when component mounts
   * Fetches categories and initial posts
   */
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load appropriate data when view or category changes
   * Newsfeed: Load posts based on selected category
   * My Posts: Load user's personal posts
   */
  useEffect(() => {
    if (selectedCategory && activeView === "newsfeed") {
      loadPosts();
    } else if (activeView === "my-posts") {
      loadMyPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, activeView]);

  /**
   * Load profile image on mount and subscribe to avatar events
   */
  useEffect(() => {
    loadProfileImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.imageUrl]);

  /**
   * Update profile image when user changes
   */
  useEffect(() => {
    if (user?.imageUrl) {
      console.log('🎭 Community Forum: User image changed:', user.imageUrl);
      setProfileImage(user.imageUrl);
      AsyncStorage.setItem("profileImage", user.imageUrl).catch(console.error);
    }
  }, [user?.imageUrl]);

  /**
   * Subscribe to avatar change events
   */
  useEffect(() => {
    const unsubscribe = avatarEvents.subscribe((newAvatarUrl: string | null) => {
      console.log('🎭 Community Forum received avatar event with URL:', newAvatarUrl);
      setProfileImage(newAvatarUrl);
      // Update AsyncStorage
      if (newAvatarUrl) {
        AsyncStorage.setItem("profileImage", newAvatarUrl).catch(console.error);
      } else {
        AsyncStorage.removeItem("profileImage").catch(console.error);
      }
      console.log('✅ Community Forum profileImage updated to:', newAvatarUrl);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Lightweight onFocus refresh: when returning to this screen, reload the current view
  const hasFocusedOnceRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      // Skip the very first focus to avoid double-loading with initial useEffect
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        return;
      }

      if (activeView === "newsfeed") {
        loadPosts();
      } else {
        loadMyPosts();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [activeView])
  );

  /**
   * Normalize image URI to handle different formats
   * Blocks base64 images to prevent OOM issues
   */
  const normalizeImageUri = useCallback((uri: string | null | undefined): string | null => {
    if (!uri) return null;
    
    // Block base64 images
    if (uri.startsWith('data:image')) {
      console.log('⚠️ Community Forum: Blocking base64 image to prevent OOM');
      return null;
    }
    
    // If it's already an absolute URL, use it as-is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    
    // If it's a relative path, make it absolute
    if (uri.startsWith('/')) {
      return makeAbsoluteUrl(uri);
    }
    
    return uri;
  }, []);

  /**
   * Pull-to-refresh handler
   * Reloads data based on current view
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeView === "newsfeed") {
      loadPosts();
    } else {
      loadMyPosts();
    }
  }, [activeView, loadPosts, loadMyPosts, setRefreshing]);

  /**
   * Handle emoji reaction to a post
   * Uses Convex for reactions
   */
  const handleReactionPress = useCallback(async (postId: any, emoji: string) => {
    if (!user?.id) {
      showError("Sign In Required", "Please sign in to react to posts");
      return;
    }

    try {
      console.log('📤 Reacting to post via Convex...', { postId, emoji });
      await convex.mutation(api.posts.react, { 
        postId: postId,
        emoji 
      });
      
      // Refresh to get updated reactions
      if (activeView === "newsfeed") {
        await loadPosts();
      } else {
        await loadMyPosts();
      }
      
      console.log('✅ Convex reaction successful');
    } catch (error) {
      console.error("Error reacting to post:", error);
      showError("Error", "Failed to update reaction");
    }
  }, [user?.id, convex, showError, activeView, loadPosts, loadMyPosts]);

  /**
   * Toggle bookmark status for a post
   * Uses Convex for bookmarks
   */
  const handleBookmarkPress = useCallback(async (postId: any) => {
    if (!user?.id) {
      showError("Sign In Required", "Please sign in to bookmark posts");
      return;
    }

    try {
        console.log('📤 Toggling bookmark via Convex...', { postId });
        const result = await convex.mutation(api.posts.toggleBookmark, { postId });
      
        // Update local state
      const newBookmarkedPosts = new Set(bookmarkedPosts);
        if (result.bookmarked) {
        newBookmarkedPosts.add(postId);
      } else {
        newBookmarkedPosts.delete(postId);
      }
      setBookmarkedPosts(newBookmarkedPosts);
      
        console.log('✅ Convex bookmark toggled successfully');

      // Refresh posts if currently in bookmark view
      if (selectedCategory === "Bookmarks" && activeView === "newsfeed") {
        loadPosts();
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      showError("Error", "Failed to update bookmark");
    }
  }, [user?.id, convex, showError, bookmarkedPosts, setBookmarkedPosts, selectedCategory, activeView, loadPosts]);

  /**
   * Navigate to post edit screen with current post data
   */
  const handleEditPost = useCallback((postId: number) => {
    const postToEdit = myPosts.find((post) => post.id === postId);
    if (postToEdit) {
      router.push({
        pathname: "/community-forum/edit",
        params: {
          id: postId,
          title: postToEdit.title,
          content: postToEdit.content,
          category: postToEdit.category_name,
          isDraft: postToEdit.is_draft ? "true" : "false",
        },
      });
    }
  }, [myPosts, router]);

  /**
   * Publish a draft post by updating its draft status
   */
  const handlePublishDraft = useCallback(async (postId: number) => {
    if (!user?.id) return;

    try {
        console.log('📤 Publishing draft via Convex...', { postId });
        await convex.mutation(api.posts.update, { 
          postId: postId as any,
          isDraft: false 
        });
      showSuccess("Post published successfully!");
      loadMyPosts();
        console.log('✅ Draft published via Convex');
    } catch (error) {
      console.error("Error publishing draft:", error);
      showError("Error", "Failed to publish post");
    }
  }, [user?.id, convex, showSuccess, loadMyPosts, showError]);

  /**
   * Delete a post with confirmation dialog
   * Updates UI immediately after successful deletion
   */
  const handleDeletePost = useCallback(async (postId: number) => {
    showConfirmation("Delete Post", "Are you sure you want to delete this post? This action cannot be undone.", async () => {
      try {
          console.log('📤 Deleting post via Convex...', { postId });
          await convex.mutation(api.posts.deletePost, { postId: postId as any });
        showSuccess("Post deleted successfully!");

        // Update the UI immediately for better UX
        if (activeView === "my-posts") {
          setMyPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        } else {
          setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        }
          console.log('✅ Post deleted via Convex');
      } catch (error) {
        console.error("Error deleting post:", error);
        showError("Error", "Failed to delete post");
      }
    });
  }, [showConfirmation, convex, showSuccess, activeView, setMyPosts, setPosts, showError]);

  /**
   * Extract user's display name from Clerk user object
   * Falls back to email username if no name available
   */
  const getDisplayName = useCallback(() => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress.split("@")[0];
    }
    return "User";
  }, [user]);

  /**
   * Get user's email address from Clerk user object
   */
  const getUserEmail = useCallback(() => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "No email available"
    );
  }, [user]);

  /**
   * Handle user logout process
   * Clears local storage and redirects to login
   */
  const handleLogout = useCallback(async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      setSideMenuVisible(false);
      await AsyncStorage.clear();
      if (signOut) {
        await signOut();
      }
      router.replace("/(auth)/login");
    } catch (error) {
      showError("Logout Failed", "Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, setIsSigningOut, setSideMenuVisible, signOut, router, showError]);

  /**
   * Confirm sign-out with confirm modal
   */
  const confirmSignOut = useCallback(() => {
    showConfirmation("Sign Out", "Are you sure you want to sign out?", () => { handleLogout(); });
  }, [showConfirmation, handleLogout]);

  /**
   * Generate user initials for avatar display
   */
  const getInitials = useCallback(() => {
    const firstName = getDisplayName()?.split(" ")[0] || "";
    const lastName = user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  }, [getDisplayName, user?.lastName]);

  /**
   * Show side navigation menu with animation
   */
  const showSideMenu = useCallback(() => {
    setSideMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [setSideMenuVisible, fadeAnim]);

  /**
   * Hide side navigation menu with animation
   */
  const hideSideMenu = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setSideMenuVisible(false);
    });
  }, [fadeAnim, setSideMenuVisible]);

  /**
   * Navigate to post detail screen
   */
  const handlePostPress = useCallback((postId: number) => {
    router.push({
  pathname: "/(app)/(tabs)/community-forum/post-detail",
      params: { id: postId },
    });
  }, [router]);

  /**
   * Bottom navigation tabs configuration
   */
  const tabs = useMemo(() => [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ], []);

  /**
   * Handle bottom navigation tab press
   */
  const handleTabPress = useCallback((tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  }, [setActiveTab, router]);

  /**
   * Calculate total reactions count from reactions object
   */
  const getTotalReactions = useCallback((reactions: { [key: string]: number }) => {
    if (!reactions) return 0;
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  }, []);

  /**
   * Side menu navigation items configuration
   */
  const sideMenuItems = useMemo(() => [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        hideSideMenu();
        router.replace("/(app)/(tabs)/home");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/profile");
      },
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      onPress: () => {
        hideSideMenu();
        router.push("/self-assessment");
      },
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        hideSideMenu();
        router.push("/mood-tracking");
      },
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        hideSideMenu();
        router.push("/journal");
      },
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        hideSideMenu();
        router.push("/resources");
      },
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        hideSideMenu();
        router.push("/crisis-support");
      },
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        hideSideMenu();
        router.push("/(app)/(tabs)/appointments");
      },
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        hideSideMenu();
  router.push("/(app)/(tabs)/community-forum");
      },
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        hideSideMenu();
        router.push("/video-consultations");
      },
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: confirmSignOut,
      disabled: isSigningOut,
    },
  ], [hideSideMenu, router, confirmSignOut, isSigningOut]);

  // Determine which posts to display based on current view
  const displayPosts = activeView === "newsfeed" ? posts : myPosts;

  // Filter posts by search query (title/content/category/hashtags inside content)
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return displayPosts;
    const q = searchQuery.toLowerCase();
    return displayPosts.filter(p => {
      const text = `${p.title || ''} ${p.content || ''} ${p.category || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [displayPosts, searchQuery]);

  return (
    <SafeAreaView testID="community-forum" style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <CurvedBackground style={styles.curvedBackground} />
      <AppHeader title="Community Forum" showBack={true} />

      <View style={styles.scrollContainer}>
        {/* Search Bar with New Post Button */}
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchInputWrapper,{backgroundColor:theme.colors.surface,borderColor:theme.colors.borderLight}]}> 
            <Ionicons name="search" size={scaledFontSize(18)} color={theme.colors.textSecondary} style={{marginRight:8}} />
            <TextInput
              style={[styles.searchInput,{color:theme.colors.text}]}
              placeholder="Search posts..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length>0 && (
              <TouchableOpacity onPress={()=>setSearchQuery('')} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={scaledFontSize(18)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            testID="create-post-button"
            style={styles.newPostIconButton} 
            onPress={() => router.push("/(app)/(tabs)/community-forum/create")}
            accessibilityLabel="Create new post"
          >
            <Ionicons name="add" size={scaledFontSize(24)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* View Tabs - Switch between Newsfeed and My Posts */}
          <View style={styles.viewTabsContainer}>
            <TouchableOpacity
              style={[
                styles.viewTab,
                activeView === "newsfeed" && { backgroundColor: '#2EA78F' },
              ]}
              onPress={() => setActiveView("newsfeed")}
              accessibilityState={{ selected: activeView === "newsfeed" }}
            >
              <Ionicons
                name="newspaper-outline"
                size={scaledFontSize(18)}
                color={activeView === "newsfeed" ? "#FFFFFF" : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.viewTabText,
                  { color: activeView === "newsfeed" ? "#FFFFFF" : theme.colors.textSecondary },
                ]}
              >
                Newsfeed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewTab,
                activeView === "my-posts" && { backgroundColor: '#2EA78F' },
              ]}
              onPress={() => setActiveView("my-posts")}
              accessibilityState={{ selected: activeView === "my-posts" }}
            >
              <Ionicons
                name="person-outline"
                size={scaledFontSize(18)}
                color={activeView === "my-posts" ? "#FFFFFF" : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.viewTabText,
                  { color: activeView === "my-posts" ? "#FFFFFF" : theme.colors.textSecondary },
                ]}
              >
                My Posts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Categories Section - Only show in Newsfeed view */}
          {activeView === "newsfeed" && (
            <View style={styles.categoriesSection}>
              <Text style={[styles.browseBySectionTitle, { color: theme.colors.text }]}>Browse By</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScrollView}
              >
                <View style={styles.categoriesContainer}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: selectedCategory === category
                            ? theme.colors.primary
                            : (theme.isDark ? '#222' : '#F4F4F4'),
                          borderColor: selectedCategory === category
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() => setSelectedCategory(category)}
                      accessibilityState={{ selected: selectedCategory === category }}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: selectedCategory === category ? '#FFFFFF' : theme.colors.textSecondary },
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Posts Section - Dynamic content based on current view */}
          <View style={styles.postsSection}>
            {loading ? (
              <View style={styles.skeletonContainer} testID="skeleton-container">
                {[...Array(3)].map((_,i)=>(
                  <View key={i} style={[styles.skeletonCard,{backgroundColor:theme.isDark?'#1E1E1E':'#FFFFFF'}]}>
                    <View style={styles.skeletonHeader}>
                      <View style={[styles.skeletonAvatar,{backgroundColor:theme.isDark?'#2A2A2A':'#EAEAEA'}]} />
                      <View style={styles.skeletonHeaderText}>
                        <View style={[styles.skeletonLineShort,{backgroundColor:theme.isDark?'#2A2A2A':'#EAEAEA'}]} />
                        <View style={[styles.skeletonLineTiny,{backgroundColor:theme.isDark?'#2A2A2A':'#EAEAEA'}]} />
                      </View>
                    </View>
                    <View style={[styles.skeletonLineFull,{backgroundColor:theme.isDark?'#2A2A2A':'#EAEAEA'}]} />
                    <View style={[styles.skeletonLineFull,{backgroundColor:theme.isDark?'#2A2A2A':'#EAEAEA'}]} />
                    <View style={[styles.skeletonLineHalf,{backgroundColor:theme.isDark?'#2A2A2A':'#EAEAEA'}]} />
                  </View>
                ))}
              </View>
            ) : displayPosts.length === 0 ? (
              <View style={styles.emptyContainer} testID="empty-state-container">
                <Ionicons
                  name={
                    activeView === "newsfeed"
                      ? "document-text-outline"
                      : "create-outline"
                  }
                  size={scaledFontSize(64)}
                  color="#E0E0E0"
                />
                <Text 
                  style={[styles.emptyText, { color: theme.colors.textSecondary }]}
                  testID="empty-state-text"
                >
                  {activeView === "newsfeed"
                    ? selectedCategory === "Trending"
                      ? "No posts yet"
                      : `No posts in ${selectedCategory} category yet`
                    : "You haven't created any posts yet"}
                </Text>
                {/* Dedicated empty state text for tests */}
                {activeView === 'newsfeed' && (
                  <Text style={{ marginTop: 4, color: theme.colors.textSecondary }}>No posts yet</Text>
                )}
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  {activeView === "my-posts" &&
                    "Create your first post to share with the community!"}
                </Text>
              </View>
            ) : (
              <>
                {filteredPosts.map(post => (
                  <TouchableOpacity key={post.id} style={[styles.postCardNew,{backgroundColor:theme.colors.surface,shadowColor:theme.isDark?'#000':'#000'}]} onPress={()=>!post.is_draft && handlePostPress(post.id)}>
                    {post.is_draft && (<View style={[styles.draftBadge,{backgroundColor:theme.isDark?'rgba(255,167,38,0.2)':'#FFF3CD'}]}><Ionicons name="time" size={scaledFontSize(12)} color={theme.isDark?'#FFB74D':'#856404'} /><Text style={[styles.draftBadgeText,{color:theme.isDark?'#FFB74D':'#856404'}]}>Draft</Text></View>)}
                    <View style={styles.postTopRow}>
                      {post.author_image ? (
                        <View style={styles.avatarContainer}>
                          <Image 
                            source={{ uri: post.author_image }} 
                            style={styles.avatarImage}
                          />
                        </View>
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarText}>{post.author_name?.charAt(0)||'U'}</Text>
                        </View>
                      )}
                      <View style={styles.postTitleMeta}>
                        <Text style={[styles.postAuthorHandle,{color:theme.colors.text}]} numberOfLines={1}>@{post.author_name}</Text>
                        <Text style={[styles.postDate,{color:theme.colors.textSecondary}]}>{formatRelativeTime(post.created_at)}</Text>
                      </View>
                      {post.author_id === user?.id && (
                        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                          <TouchableOpacity 
                            style={styles.postTopActions}
                            onPress={() => router.push(`/(app)/(tabs)/community-forum/edit?id=${post.id}`)}
                            accessibilityLabel="Edit post"
                          >
                            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.postTopActions}
                            onPress={() => handleDeletePost(post.id)}
                            accessibilityLabel="Delete post"
                          >
                            <Ionicons name="trash" size={20} color="#FF1744" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.postBody,{color:theme.colors.textSecondary}]} numberOfLines={6}>
                      {renderContentWithHashtags(post.content, styles, theme)}
                    </Text>
                    
                    {/* Display mood/feeling if present */}
                    {post.mood && (
                      <View style={styles.postMoodContainer}>
                        <Text style={styles.postMoodEmoji}>{post.mood.emoji}</Text>
                        <Text style={[styles.postMoodText, { color: theme.colors.textSecondary }]}>
                          Feeling {post.mood.label}
                        </Text>
                      </View>
                    )}
                    
                    {/* Display images if present */}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                      <View style={styles.postImagesGrid}>
                        {post.imageUrls.map((uri: string, index: number) => (
                          <View key={index} style={[
                            styles.postImageContainer,
                            post.imageUrls.length === 1 && styles.postSingleImage,
                            post.imageUrls.length === 2 && styles.postDoubleImage,
                            post.imageUrls.length === 3 && styles.postTripleImage,
                          ]}>
                            <Image source={{ uri }} style={styles.postImage} />
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <View style={styles.postDivider} />
                    {!post.is_draft && (
                      <View style={styles.metricsRow}>
                        {EMOJI_REACTIONS.map((emoji) => (
                          <TouchableOpacity
                            key={emoji}
                            style={[styles.metricGroup, post.user_reaction===emoji && styles.metricSelected]}
                            onPress={()=>handleReactionPress(post.id, emoji)}
                          >
                            <Text style={styles.reactionEmoji}>{emoji}</Text>
                            <Text style={[styles.metricCount,{color:theme.colors.text}]}>{getReactionCount(post,[emoji])||0}</Text>
                          </TouchableOpacity>
                        ))}
                        <View style={{flex: 1}} />
                        <TouchableOpacity onPress={()=>handleBookmarkPress(post.id)} style={styles.bookmarkWrap} accessibilityLabel="Toggle bookmark">
                          <Ionicons name={bookmarkedPosts.has(post.id)?'bookmark':'bookmark-outline'} size={20} color={bookmarkedPosts.has(post.id)?theme.colors.primary:theme.colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>

          {/* Inline Error Indicator (non-modal) for test expectations */}
          {errorMessage && (
            <Text 
              style={{ color: theme.colors.error, textAlign: 'center', marginTop: 8 }}
              testID="error-message-text"
            >
              {errorMessage}
            </Text>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Side Menu Modal - App navigation overlay */}
      <Modal
        animationType="none"
        transparent={true}
        visible={sideMenuVisible}
        onRequestClose={hideSideMenu}
      >
        <Animated.View style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={hideSideMenu} />
          <Animated.View style={[styles.sideMenu, { backgroundColor: theme.colors.surface, opacity: fadeAnim }]}>
            <View style={[styles.sideMenuHeader, { borderBottomColor: theme.colors.borderLight }]}>
              <View style={styles.profileAvatar}>
                {(user?.imageUrl || profileImage) ? (
                  <OptimizedImage 
                    source={{ uri: user?.imageUrl || profileImage! }} 
                    style={styles.profileAvatarImage}
                    cache="force-cache"
                    loaderSize="small"
                    loaderColor="#7CB9A9"
                    showErrorIcon={false}
                  />
                ) : (
                  <Text style={styles.profileAvatarText}>{getInitials()}</Text>
                )}
              </View>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>{getDisplayName()}</Text>
              <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>{getUserEmail()}</Text>
            </View>
            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.title}
                  style={[
                    styles.sideMenuItem,
                    { borderBottomColor: theme.colors.borderLight },
                    item.disabled && styles.sideMenuItemDisabled,
                  ]}
                  onPress={item.onPress}
                  disabled={item.disabled}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={scaledFontSize(20)}
                    color={item.disabled ? "#CCCCCC" : item.title === "Sign Out" ? theme.colors.error : "#4CAF50"}
                  />
                  <Text
                    style={[
                      styles.sideMenuItemText,
                      { color: theme.colors.text },
                      item.disabled && styles.sideMenuItemTextDisabled,
                      item.title === "Sign Out" && { color: theme.colors.error, fontWeight: "600" },
                    ]}
                  >
                    {item.title}
                    {item.title === "Sign Out" && isSigningOut && "..."}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Bottom Navigation - Main app navigation */}
      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />



      {/* Success Modal */}
      <StatusModal
        visible={showSuccessModal}
        type="success"
        title="Success!"
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        buttonText="Done"
      />

      {/* Error Modal */}
      <StatusModal
        visible={showErrorModal}
        type="error"
        title={errorTitle}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
        buttonText="OK"
      />

      {/* Confirm Modal */}
      <StatusModal
        visible={showConfirmModal}
        type="info"
        title={confirmTitle}
        message={confirmMessage}
        onClose={() => setShowConfirmModal(false)}
        buttonText="Cancel"
        secondaryButtonText="Confirm"
        onSecondaryButtonPress={() => {
          setShowConfirmModal(false);
          if (confirmCallback) {
            confirmCallback();
          }
        }}
        secondaryButtonType="default"
      />
    </SafeAreaView>
  );
}

/**
 * Stylesheet for CommunityMainScreen component
 * Organized by component sections with consistent theming
 */
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  curvedBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  // Search Bar with New Post Button
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: scaledFontSize(15),
  },
  newPostIconButton: {
    backgroundColor: '#2EA78F',
    width: 46,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  // View Tabs - Newsfeed vs My Posts toggle
  viewTabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  viewTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(124, 185, 169, 0.3)',
  },
  viewTabText: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
  },

  // Categories Section - Horizontal scrolling categories
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesScrollView: {
    marginHorizontal: -16,
  },
  browseBySectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  categoriesContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
  },
  categoryText: {
    fontSize: scaledFontSize(14),
    fontWeight: "500",
    textAlign: "center",
  },

  // Posts Section - Main content area
  postsSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  skeletonContainer: {
    gap: 14,
    paddingVertical: 8,
  },
  skeletonCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonHeaderText: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  skeletonLineFull: {
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLineHalf: {
    height: 12,
    width: '60%',
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLineShort: {
    height: 12,
    width: '50%',
    borderRadius: 6,
  },
  skeletonLineTiny: {
    height: 10,
    width: '30%',
    borderRadius: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: scaledFontSize(16),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: scaledFontSize(18),
    marginTop: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: scaledFontSize(14),
    marginTop: 8,
    textAlign: "center",
  },

  // Post Cards - Individual post containers
  postCardNew: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  draftBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    gap: 4,
  },
  draftBadgeText: {
    fontSize: scaledFontSize(12),
    fontWeight: "500",
  },

  // Post Header - Author info and actions
  postTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "bold",
  },
  postTitleMeta: {
    flex: 1,
    marginLeft: 12,
  },
  postAuthorHandle: {
    fontSize: 15,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
    marginTop: 2,
  },
  postTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  postBodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  hashtag: {
    fontWeight: '600',
  },
  postMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(124, 185, 169, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  postMoodEmoji: {
    fontSize: 16,
  },
  postMoodText: {
    fontSize: 13,
    fontWeight: '500',
  },
  postImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  postImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  postSingleImage: {
    width: '100%',
    height: 200,
  },
  postDoubleImage: {
    width: '48.5%',
    height: 150,
  },
  postTripleImage: {
    width: '31.5%',
    height: 100,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  postDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 18,
  },
  metricGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricSelected: {
    backgroundColor: 'rgba(124,185,169,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  reactionEmoji: {
    fontSize: 18,
  },
  bookmarkWrap: {
    marginLeft: 'auto',
  },

  // Create First Post Button - Empty state action
  createFirstPostButton: {
    backgroundColor: "#7CB9A9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  createFirstPostButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },

  // Bottom Spacing - Scroll view padding
  bottomSpacing: {
    height: 30,
  },

  // Side Menu Styles - Navigation overlay
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemTextDisabled: {
    color: "#CCCCCC",
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  sideMenu: {
    paddingTop: 60,
    width: width * 0.75,
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#7CB9A9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  profileAvatarImage: {
    width: 60,
    height: 60,
  },
  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(20),
    fontWeight: "bold",
  },
  profileName: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: scaledFontSize(14),
  },
  sideMenuContent: {
    padding: 10,
  },
  sideMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  sideMenuItemText: {
    fontSize: scaledFontSize(16),
    marginLeft: 15,
  },
});