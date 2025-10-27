// app/(app)/help-support.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import {
  fetchAllHelpData,
  trackHelpSectionView,
  HelpSection,
  HelpItem,
} from "../../../../utils/helpService";
import { useTheme } from "../../../../contexts/ThemeContext";
import StatusModal from "../../../../components/StatusModal";

const HelpSupportScreen: React.FC = () => {
  const { theme, scaledFontSize } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [helpSections, setHelpSections] = useState<HelpSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Load help data on component mount
  useEffect(() => {
    loadHelpData();
  }, []);

  const loadHelpData = async () => {
    try {
      setLoading(true);
      const data = await fetchAllHelpData();
      setHelpSections(data);
    } catch (error) {
      console.error("Failed to load help data:", error);
      showModal('error', 'Load Failed', 'Unable to load help content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHelpData();
    setRefreshing(false);
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const toggleSection = async (sectionId: string) => {
    try {
      // Track section view when expanded
      if (!expandedSections.includes(sectionId)) {
        await trackHelpSectionView(sectionId);
      }

      setExpandedSections((prev) =>
        prev.includes(sectionId)
          ? prev.filter((id) => id !== sectionId)
          : [...prev, sectionId]
      );
    } catch (error) {
      console.error("Failed to track section view:", error);
      showModal('error', 'Tracking Error', 'Unable to track your selection.');
    }
  };

  const handleEmailSupport = () => {
    try {
      Linking.openURL("mailto:safespace.dev.app@gmail.com");
      showModal('success', 'Email Opened', 'Your email app should open shortly. If not, please email safespace.dev.app@gmail.com');
    } catch (error) {
      console.error("Failed to open email:", error);
      showModal('error', 'Email Error', 'Unable to open email app. Please try again or email us directly at safespace.dev.app@gmail.com');
    }
  };

  const renderHelpItem = (item: HelpItem, index: number) => (
    <View 
      key={index} 
      style={[
        styles.helpItem,
        { borderBottomColor: theme.colors.borderLight }
      ]}
    >
      <Text style={[styles.helpItemTitle, { color: theme.colors.text }]}>
        {item.title}
      </Text>
      <Text style={[styles.helpItemContent, { color: theme.colors.textSecondary }]}>
        {item.content.split("\n").map((line, i) => (
          <Text key={i}>
            {line}
            {"\n"}
          </Text>
        ))}
      </Text>
    </View>
  );

  const renderSection = (section: HelpSection) => {
    const isExpanded = expandedSections.includes(section.id);

    return (
      <View 
        key={section.id} 
        style={[
          styles.sectionContainer,
          { 
            backgroundColor: theme.colors.surface,
            shadowColor: theme.isDark ? "#000" : "#000",
          }
        ]}
      >
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {section.title}
          </Text>
          <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>
            {isExpanded ? "−" : "+"}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {section.content.map((item, index) => renderHelpItem(item, index))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Help & Support" showBack={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading help content...
            </Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Help & Support" showBack={true} />
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <Text style={[styles.screenSubtitle, { color: theme.colors.textSecondary }]}>
            Find answers to common questions and get the help you need
          </Text>

          {helpSections.map(renderSection)}

          <View style={styles.footerSection}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Still need help? Our support team is here for you.
            </Text>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleEmailSupport}
            >
              <Text style={styles.contactButtonText}>📧 Email Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

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
};

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: scaledFontSize(22), // Base size 22px
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  screenSubtitle: {
    fontSize: scaledFontSize(16), // Base size 16px
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  sectionContainer: {
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  sectionTitle: {
    fontSize: scaledFontSize(18), // Base size 18px
    fontWeight: "600",
    flex: 1,
  },
  expandIcon: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
    width: 24,
    textAlign: "center",
  },
  sectionContent: {
    padding: 16,
  },
  helpItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  helpItemTitle: {
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "600",
    marginBottom: 8,
  },
  helpItemContent: {
    fontSize: scaledFontSize(14), // Base size 14px
    lineHeight: 20,
  },
  footerSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: scaledFontSize(16), // Base size 16px
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  contactButton: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 50,
    minWidth: 200,
  },
  contactButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: scaledFontSize(16), // Base size 16px
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: scaledFontSize(16), // Base size 16px
    textAlign: "center",
  },
});

export default HelpSupportScreen;