/**
 * Post Success Screen - Clean and Professional
 * Uses StatusModal for consistent success feedback
 */
import { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";
import { useTheme } from "../../../../../contexts/ThemeContext";
import StatusModal from "../../../../../components/StatusModal";
import { useBottomNavTabs } from "../../../../../utils/hooks/useBottomNavTabs";

export default function PostSuccessScreen() {
  const params = useLocalSearchParams();
  const postId = params.postId as string | undefined;
  const { theme, scaledFontSize } = useTheme();
  const [activeTab, setActiveTab] = useState("community-forum");
  const [showSuccessModal, setShowSuccessModal] = useState(true);

  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const handleViewPost = () => {
    setShowSuccessModal(false);
    if (postId) {
      router.replace({
        pathname: "/(app)/(tabs)/community-forum/post-detail",
        params: { id: postId },
      });
    } else {
      router.replace("/(app)/(tabs)/community-forum");
    }
  };

  const handleClose = () => {
    setShowSuccessModal(false);
    router.replace("/(app)/(tabs)/community-forum");
  };

  // Bottom navigation tabs configuration
  const tabs = useBottomNavTabs();

  /**
   * Handles bottom tab navigation
   * @param tabId - ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Success" showBack={false} />

        <View style={styles.content}>
          {/* Empty content - modal handles the success message */}
        </View>

        {/* Bottom Navigation */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        {/* Success Modal */}
        <StatusModal
          visible={showSuccessModal}
          type="success"
          title="Post Published!"
          message="Your voice has been shared with the community. Your story matters and can help others feel less alone."
          onClose={handleViewPost}
          buttonText="View My Post"
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Dynamic styles with text size scaling
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});