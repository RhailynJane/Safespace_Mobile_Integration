// app/(app)/help-support.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  RefreshControl,
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

const HelpSupportScreen: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [helpSections, setHelpSections] = useState<HelpSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

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
    } finally {
      setLoading(false);
    }
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
    // Track section view when expanded
    if (!expandedSections.includes(sectionId)) {
      await trackHelpSectionView(sectionId);
    }

    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
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
              onPress={() =>
                Linking.openURL("mailto:safespace.dev.app@gmail.com")
              }
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
      </SafeAreaView>
    </CurvedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  screenSubtitle: {
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  expandIcon: {
    fontSize: 20,
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
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  helpItemContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    textAlign: "center",
  },
});

export default HelpSupportScreen;
