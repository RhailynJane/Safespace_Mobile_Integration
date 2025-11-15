/* eslint-disable react-hooks/exhaustive-deps */
// app/(app)/help-support.tsx
/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Modal,
  LayoutAnimation,
  Platform,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed SafeAreaView to avoid double top padding with AppHeader
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import {
  fetchAllHelpData,
  trackHelpSectionView,
  HelpSection,
  HelpItem,
  getFallbackHelpSectionsWithItems,
} from "../../../../utils/helpService";
import { useTheme } from "../../../../contexts/ThemeContext";
import StatusModal from "../../../../components/StatusModal";

const HelpSupportScreen: React.FC = () => {
  const { theme, scaledFontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("profile");
  const [helpSections, setHelpSections] = useState<HelpSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<HelpSection | null>(null);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);

  const EXPANDED_SECTIONS_KEY = 'helpSupport_expandedSections';
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

  // Load help data and expanded sections on mount
  useEffect(() => {
    loadHelpData();
    loadExpandedSections();
  }, []);

  // Configure smooth animations
  useEffect(() => {
    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [expandedSections]);

  const loadExpandedSections = async () => {
    try {
      const stored = await AsyncStorage.getItem(EXPANDED_SECTIONS_KEY);
      if (stored) {
        setExpandedSections(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load expanded sections:', error);
    }
  };

  const saveExpandedSections = async (sections: string[]) => {
    try {
      await AsyncStorage.setItem(EXPANDED_SECTIONS_KEY, JSON.stringify(sections));
    } catch (error) {
      console.error('Failed to save expanded sections:', error);
    }
  };

  const extendedSections: HelpSection[] = [
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      icon: '❓',
      content: [
        { title: 'How do I reset my password?', content: 'Use the "Forgot Password" option on the login screen or contact support for assistance.' },
        { title: 'Can I delete my data?', content: 'Yes, you can request data deletion through Settings > Privacy or by contacting support.' },
        { title: 'How often should I log my mood?', content: 'We recommend daily logging, but find a frequency that works for you. Set reminders in Settings.' },
        { title: 'Is my journal private?', content: 'Yes, journal entries are completely private unless you choose to share specific entries.' },
        { title: 'How do appointments work?', content: 'Book through the Appointments tab, receive confirmation, and join via the notification or appointments screen.' }
      ]
    },
    {
      id: 'mood-tracking',
      title: 'Mood Tracking',
      icon: '📈',
      content: [
        { title: 'Log a Mood', content: 'Use the mood selector and sliders to record how you feel.' },
        { title: 'Reminders', content: 'Enable reminders in Settings to get gentle prompts to reflect.' },
        { title: 'Mood Stats', content: 'View trends and distributions over time to spot patterns.' }
      ]
    },
    {
      id: 'journaling',
      title: 'Journaling',
      icon: '📝',
      content: [
        { title: 'Create Entries', content: 'Capture thoughts, experiences, and reflections. Formatting is lightweight by design.' },
        { title: 'Privacy', content: 'Journal entries are private to you unless explicitly shared.' }
      ]
    },
    {
      id: 'appointments',
      title: 'Appointments',
      icon: '📅',
      content: [
        { title: 'Booking', content: 'Request an appointment with a support worker and select a time.' },
        { title: 'Status Updates', content: 'You receive notifications for confirmations, reschedules, and completions.' },
        { title: 'Video Sessions', content: 'Join secure video consultations directly from the notification or appointments tab.' }
      ]
    },
    {
      id: 'community-forum',
      title: 'Community Forum',
      icon: '💬',
      content: [
        { title: 'Posting', content: 'Share supportive messages or questions. Follow community guidelines.' },
        { title: 'Reactions', content: 'React to posts; authors are notified when reactions occur (if enabled).' }
      ]
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: '✉️',
      content: [
        { title: 'Direct Conversations', content: 'Chat with support workers and peers where allowed.' },
        { title: 'Message Notifications', content: 'New incoming messages trigger in-app notifications if enabled.' }
      ]
    },
    {
      id: 'profile',
      title: 'Profile & Settings',
      icon: '👤',
      content: [
        { title: 'Personal Info', content: 'Update your name, avatar, and basic preferences.' },
        { title: 'Notification Preferences', content: 'Toggle categories: messages, appointments, reactions, assessments, reminders.' }
      ]
    },
    {
      id: 'crisis-support',
      title: 'Crisis Support',
      icon: '🚨',
      content: [
        { title: 'Immediate Help', content: 'Use dedicated crisis resources. In emergencies contact local services.' },
        { title: 'Support Worker Escalation', content: 'Serious concerns can be escalated—keep info accurate in profile.' }
      ]
    },
    {
      id: 'resources',
      title: 'Resources Library',
      icon: '📚',
      content: [
        { title: 'Curated Articles', content: 'Browse mental health, resilience, and growth content.' }
      ]
    },
    {
      id: 'self-assessment',
      title: 'Self Assessment',
      icon: '🧪',
      content: [
        { title: 'Submitting', content: 'Complete guided questionnaires to reflect on wellbeing.' },
        { title: 'Assessment Notifications', content: 'Receive a notification when an assessment is recorded (if enabled).' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '🔔',
      content: [
        { title: 'Unread Badge', content: 'Bell icon shows unread count dynamically.' },
        { title: 'Mark All Read', content: 'Use the actions in Notifications screen to clear or mark read.' }
      ]
    },
    {
      id: 'support-workers',
      title: 'Support Workers',
      icon: '🧑‍⚕️',
      content: [
        { title: 'Role', content: 'Workers can message, schedule appointments, and guide you through features.' },
        { title: 'Availability', content: 'Scheduling respects worker availability windows.' }
      ]
    },
    {
      id: 'contact-support',
      title: 'Contact Support',
      icon: '📧',
      content: [
        { title: 'Email Support', content: 'Reach out to safespace.dev.app@gmail.com for technical issues, questions, or feedback.' },
        { title: 'Response Time', content: 'We typically respond within 24-48 hours during business days.' },
        { title: 'What to Include', content: 'Please describe your issue, include screenshots if helpful, and mention your device type.' }
      ]
    }
  ];

  // Normalize: map CSV ids to local ids, drop unwanted, merge duplicates, and enrich items
  const UNWANTED_IDS = new Set<string>(['features', 'support-workers', 'authentication', 'onboarding']);

  const idAliases: Record<string, string> = {
    faqs: 'faq',
    contact: 'contact-support',
  };

  const extraItems: Record<string, HelpItem[]> = {
    'faq': [
      { title: 'Common Questions About Support', content: 'Session Frequency: Most people start weekly and adjust over time.\nComfort With Worker: Request a new support worker anytime from your profile.\nPreparation: Jot topics or feelings you want to explore; no prep is also okay.\nBetween Sessions: Message for non-urgent questions; use crisis resources for emergencies.' },
      { title: 'App Functionality Questions', content: 'Offline: The app requires internet for all features.\nBackups: Your data is securely encrypted and backed up.\nMultiple Devices: Log in on multiple devices; your data syncs automatically.\nNotifications: Check device and in‑app settings and ensure a stable connection.' },
      { title: 'Data Sharing and Privacy', content: 'Visibility: Your mood and journal are private by default.\nCommunity Posts: Choose public or private visibility.\nWorker Access: Workers see only what you share and your appointment history.\nRetention: Data persists while your account is active; deletion available on request.' },
      { title: 'Account Management', content: 'Change Email: Profile → Edit Profile.\nData Export: Settings → Privacy.\nMultiple Accounts: One account per person.\nDeletion: Personal data is permanently deleted within 30 days.' },
    ],
    'getting_started': [
      { title: 'How to Create Your Profile', content: 'Profile → Edit Profile. Add details (name, pronouns, location). Changes save automatically.' },
      { title: 'Setting Up Your First Appointment', content: 'Appointments → Book New. Choose worker and time, confirm details, and get reminders.' },
      { title: 'Understanding Your Dashboard', content: 'See upcoming appointments, assessments, resources, mood tracking, journaling, and crisis access.' },
      { title: 'Privacy and Confidentiality', content: 'Conversations are confidential with legal exceptions. Choose visibility for community posts.' },
    ],
    'contact-support': [
      { title: 'Email Support', content: 'When to email: Non‑urgent technical issues, account questions, feature requests, general inquiries.\nAddress: safespace.dev.app@gmail.com\nInclude: account email, detailed description, screenshots, device & app version, steps tried.' },
      { title: 'Response Time Expectations', content: 'Urgent technical: 2–4h initial during business hours.\nGeneral: 24–48h.\nFeature requests: acknowledgement in 48h; reviewed monthly.\nBusiness Hours: Mon–Fri 9:00–18:00; weekend messages processed Monday.' },
    ],
    'account_technical': [
      { title: 'Login and Account Access Issues', content: 'Forgot password: use Reset on login.\nLocked account: wait 30 min or contact support.\nEmail not recognized: check typos or correct account email.\nApp issues: ensure latest version, stable internet, try reinstall (data is cloud‑saved).' },
      { title: 'Password Reset and Security', content: 'Requirements: 8+ chars, uppercase, number, special char.\nProcess: tap Forgot Password, then follow email instructions.' },
    ],
    'safety_privacy': [
      { title: 'Community Safety Guidelines', content: 'Respect, support, inclusion, confidentiality. No harassment, discrimination, misinformation, or ads.' },
      { title: 'Confidentiality Limits', content: 'Legal exceptions: imminent harm, abuse reports, court orders, professional standards. Discuss details with your worker.' },
      { title: 'How Your Data is Protected', content: 'Encryption in transit and at rest, audits, RBAC, monitoring, backups. You can access, correct, delete, or export your data.' },
    ],
  };

  const mergeExtendedSections = (base: HelpSection[]): HelpSection[] => {
    const existingIds = new Set(base.map(s => s.id));
    const merged = [...base];
    extendedSections.forEach(sec => { if (!existingIds.has(sec.id)) merged.push(sec); });
    return merged;
  };

  const loadHelpData = async () => {
    try {
      setLoading(true);
      const data = await fetchAllHelpData();
      let sections: HelpSection[];
      if (Array.isArray(data) && data.length > 0) {
        sections = data;
      } else {
        sections = getFallbackHelpSectionsWithItems();
      }
      // Normalize ids and remove unwanted
      sections = sections.map(s => ({
        ...s,
        id: idAliases[s.id as keyof typeof idAliases] || s.id,
      })).filter(s => !UNWANTED_IDS.has(s.id));

      // Merge duplicates by id
      const byId: Record<string, HelpSection> = {};
      for (const s of mergeExtendedSections(sections)) {
        const id = s.id;
        if (!byId[id]) {
          byId[id] = { ...s, content: [...(s.content || [])] } as HelpSection;
        } else {
          // merge unique by title
          if (!byId[id].content) byId[id].content = [] as HelpItem[];
          const bucket = byId[id].content as HelpItem[];
          const titles = new Set(bucket.map(i => i.title));
          (s.content || []).forEach(i => { if (!titles.has(i.title)) bucket.push(i); });
        }
      }

      // Enrich with extra items from CSV mapping
      for (const [id, items] of Object.entries(extraItems)) {
        if (!byId[id]) continue;
        if (!byId[id].content) byId[id].content = [] as HelpItem[];
        const bucket = byId[id].content as HelpItem[];
        const titles = new Set(bucket.map(i => i.title));
        items.forEach(i => { if (!titles.has(i.title)) bucket.push(i); });
      }

      // Add CSV-only sections if present in mapping but missing
      for (const id of Object.keys(extraItems)) {
        if (!byId[id]) {
          byId[id] = {
            id,
            title: id === 'account_technical' ? 'Account & Technical Support' : id === 'safety_privacy' ? 'Safety & Privacy' : id === 'getting_started' ? 'Getting Started' : id === 'faq' ? 'Frequently Asked Questions' : id,
            icon: id === 'account_technical' ? '⚙️' : id === 'safety_privacy' ? '🔒' : id === 'getting_started' ? '🌟' : id === 'faq' ? '❓' : '📎',
            content: extraItems[id]
          } as HelpSection;
        }
      }

      // Build final list
      const finalSections = Object.values(byId);
      setHelpSections(finalSections);
    } catch (error) {
      console.error("Failed to load help data:", error);
      // Strong local fallback ensures screen is never empty
      const fallback = mergeExtendedSections(getFallbackHelpSectionsWithItems()).filter(s => !UNWANTED_IDS.has(s.id));
      setHelpSections(fallback);
      showModal('error', 'Load Failed', 'Showing offline help content. Some items may be limited.');
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
      // Configure animation before state change
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext({
          duration: 300,
          create: { type: 'easeInEaseOut', property: 'opacity' },
          update: { type: 'easeInEaseOut' },
          delete: { type: 'easeInEaseOut', property: 'opacity' }
        });
      }

      // Track section view when expanded (fire-and-forget to avoid UI delay)
      if (!expandedSections.includes(sectionId)) {
        trackHelpSectionView(sectionId).catch(() => {});
      }

      const newSections = expandedSections.includes(sectionId)
        ? expandedSections.filter((id) => id !== sectionId)
        : [...expandedSections, sectionId];

      setExpandedSections(newSections);
      saveExpandedSections(newSections);
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

  const highlightText = useCallback((text: string) => {
    if (!searchQuery.trim()) return <Text>{text}</Text>;
    const regex = new RegExp(`(${searchQuery})`, 'ig');
    const parts = text.split(regex);
    const qLower = searchQuery.toLowerCase();
    return (
      <Text>
        {parts.map((part, idx) => {
          if (part.toLowerCase() === qLower) {
            return (
              <Text key={idx} style={{ backgroundColor: theme.colors.primary, color: '#fff', paddingHorizontal: 4, borderRadius: 4 }}>
                {part}
              </Text>
            );
          }
          return <Text key={idx}>{part}</Text>;
        })}
      </Text>
    );
  }, [searchQuery, theme.colors.primary]);

  // Remove duplicate emoji at the start of section titles
  const stripLeadingIcon = (title: string, icon?: string) => {
    const known = ['🌟','📱','💬','❓','⚙️','🔒','📚','✉️','🚨','📅','📝','📈','👤'];
    if (icon && title.startsWith(icon + ' ')) return title.slice(icon.length + 1);
    for (const ic of known) {
      if (title.startsWith(ic + ' ')) return title.slice(ic.length + 1);
    }
    return title;
  };

  const renderHelpItem = (item: HelpItem, index: number) => (
    <View
      key={index}
      style={[
        styles.helpItemCard,
        {
          borderColor: theme.colors.borderLight,
          backgroundColor: theme.colors.surface
        }
      ]}
    >
      <View style={[styles.helpItemAccent, { backgroundColor: theme.colors.primary }]} />
      <View style={styles.helpItemContentWrapper}>
        <View style={styles.helpItemHeaderRow}>
          <Text style={[styles.helpItemTitle, { color: theme.colors.text }]}>
            {highlightText(item.title)}
          </Text>
        </View>
        <Text style={[styles.helpItemContent, { color: theme.colors.textSecondary }]}>
          {item.content.split("\n").map((line, i) => (
            <Text key={i}>
              {highlightText(line)}
              {"\n"}
            </Text>
          ))}
        </Text>
      </View>
    </View>
  );

  const openSection = (section: HelpSection) => {
    setSelectedSection(section);
    setSectionModalVisible(true);
  };

  const closeSection = () => {
    setSectionModalVisible(false);
    setSelectedSection(null);
  };

  const renderSectionTile = (section: HelpSection) => {
    const title = stripLeadingIcon(section.title, section.icon);
    // Quick filter by search
    const q = searchQuery.trim().toLowerCase();
    const matches = !q || title.toLowerCase().includes(q) || (section.content?.some(i => i.title.toLowerCase().includes(q)) ?? false);
    if (!matches) return null;
    // Special handling for Contact Support tile
    const onPress = section.id === 'contact-support' ? handleEmailSupport : () => openSection(section);
    return (
      <TouchableOpacity key={section.id} style={[styles.tile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.iconCircle, { backgroundColor: theme.isDark ? '#2a2f2a' : '#eef6f0' }]}> 
          <Text style={styles.iconEmoji}>{section.icon}</Text>
        </View>
        <Text numberOfLines={2} style={[styles.tileTitle, { color: theme.colors.text }]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderSection = (section: HelpSection) => {
    const isExpanded = expandedSections.includes(section.id);
    const displayTitle = stripLeadingIcon(section.title, section.icon);
    const filteredItems = (section.content ?? []).filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
    });
    const isFilteredOut = activeFilter !== 'all' && activeFilter !== section.id;
    if (isFilteredOut) return null;

    return (
      <View
        key={section.id}
        style={[
          styles.sectionContainer,
          {
            backgroundColor: theme.colors.surface,
            shadowColor: theme.isDark ? '#000' : '#000'
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.sectionHeader, { minHeight: 60 }]}
          onPress={() => toggleSection(section.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.sectionAccent, { backgroundColor: theme.colors.primary }]} />
          <View style={styles.sectionHeaderContent}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionIcon]}>{section.icon}</Text>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{displayTitle}</Text>
            </View>
              <View style={[styles.sectionMetaRow]}> 
              <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}> 
                <Text style={styles.badgeText}>{section.content?.length ?? 0}</Text>
              </View>
              <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {filteredItems.length === 0 && (
              <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>No items match your search.</Text>
            )}
            {filteredItems.map((item, index) => renderHelpItem(item, index))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <CurvedBackground>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <AppHeader title="Help & Support" showBack={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading help content...
            </Text>
          </View>
        </View>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Help & Support" showBack={true} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
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

          {/* Summary removed for a cleaner look */}

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search help..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.colors.text, borderColor: theme.isDark ? theme.colors.borderLight : theme.colors.border }]}
            />
          </View>

          {/* Grid of tiles */}
          <View style={styles.grid}>
            {helpSections.map(renderSectionTile)}
          </View>

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

        {/* Section detail modal */}
        <Modal visible={sectionModalVisible} transparent animationType="fade" onRequestClose={closeSection}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}> 
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {selectedSection ? stripLeadingIcon(selectedSection.title, selectedSection.icon) : ''}
                </Text>
                <TouchableOpacity onPress={closeSection} hitSlop={{top:10,left:10,bottom:10,right:10}}>
                  <Text style={{ fontSize: 18, color: theme.colors.textSecondary }}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 420 }}>
                {selectedSection?.content.map((it, idx) => renderHelpItem(it, idx))}
              </ScrollView>
              {selectedSection?.id !== 'contact-support' && (
                <TouchableOpacity onPress={handleEmailSupport} style={[styles.askMoreBtn, { backgroundColor: theme.colors.primary }]}> 
                  <Text style={styles.askMoreText}>Ask More</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

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
      </View>
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
    borderRadius: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  sectionAccent: {
    width: 6,
    alignSelf: 'stretch',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    marginRight: 12,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  sectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    fontSize: scaledFontSize(18),
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: scaledFontSize(15), // Reduced from 17
    fontWeight: "500",
    flex: 1,
  },
  expandIcon: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    width: 24,
    textAlign: "center",
  },
  sectionContent: {
    padding: 16,
  },
  helpItemCard: {
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  helpItemAccent: {
    width: 6,
  },
  helpItemContentWrapper: {
    flex: 1,
    padding: 14,
  },
  helpItemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  helpItemTitle: {
    fontSize: scaledFontSize(15), // Reduced from 16
    fontWeight: "500", // Reduced from 600 to be less bold
    flex: 1,
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
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: scaledFontSize(12),
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: scaledFontSize(14),
  },
  chipsRow: {
    flexGrow: 0,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginTop: 8,
  },
  tile: {
    width: '48%',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconEmoji: {
    fontSize: scaledFontSize(22),
  },
  tileTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: '500',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#00000010',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: '600',
  },
  askMoreBtn: {
    marginTop: 10,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  askMoreText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: scaledFontSize(14),
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  chipText: {
    fontSize: scaledFontSize(12),
    fontWeight: '500', // Reduced from 600
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: scaledFontSize(12),
    fontWeight: '700',
  },
  categoryHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 20,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default HelpSupportScreen;