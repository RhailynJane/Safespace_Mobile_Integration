/**
 * Icon Attribution:
 * Breathe icon created by pojok d - Flaticon
 * https://www.flaticon.com/free-icons/breathe
 */

/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useMemo, useEffect } from "react";
import { Linking, Platform, Modal, Image } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";

// Custom images
const breatheImage = require('../../../assets/images/breathe.png');
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { useTheme } from "../../../contexts/ThemeContext";
import StatusModal from "../../../components/StatusModal";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface CrisisResource {
  id: string;
  slug: string;
  title?: string;
  subtitle?: string;
  type: 'phone' | 'website';
  value: string;
  icon?: string;
  color?: string;
  region?: string;
  country?: string;
  priority?: string;
  sort_order?: number;
  active?: boolean;
}

const { width } = Dimensions.get("window");

/**
 * CrisisScreen Component
 *
 * Emergency support screen providing immediate crisis resources including:
 * - Emergency contact numbers (911, crisis hotlines) with direct calling
 * - Immediate coping strategies
 * - Grounding techniques
 * - Quick access to professional help
 * Features an elegant curved background and urgent, clear interface design.
 */
export default function CrisisScreen() {
  const { theme, scaledFontSize } = useTheme();
  // State management
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [activeTab, setActiveTab] = useState("crisis");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });
  const [mapsModalVisible, setMapsModalVisible] = useState(false);
  const [crisisSupportModalVisible, setCrisisSupportModalVisible] = useState(false);

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Bottom navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  /**
   * Opens maps app to search for safe public places nearby
   */
  const openMaps = async (mapType: 'google' | 'apple') => {
    setMapsModalVisible(false);
    const searchQuery = 'safe public places near me';

    try {
      let url: string;

      if (mapType === 'apple') {
        // Apple Maps URL scheme
        url = `maps://?q=${encodeURIComponent(searchQuery)}`;
      } else {
        // Google Maps URL - works on both iOS and Android
        if (Platform.OS === 'ios') {
          url = `comgooglemaps://?q=${encodeURIComponent(searchQuery)}`;
        } else {
          url = `geo:0,0?q=${encodeURIComponent(searchQuery)}`;
        }
      }

      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web version
        if (mapType === 'google') {
          await Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`);
        } else {
          await Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(searchQuery)}`);
        }
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      showModal('error', 'Maps Error', 'Unable to open maps application. Please try again.');
    }
  };

  // Live crisis resources from Convex
  // Convex live resources
  const liveResources = useQuery(api.crisis.listResources, { country: 'CA', activeOnly: true });

  // Guaranteed fallback emergency resources (Canada + generic + US 988)
  const fallbackResources: CrisisResource[] = [
    {
      id: '911', slug: 'emergency-services', title: 'Emergency Services (911)', subtitle: 'Life-threatening emergencies',
      type: 'phone', value: '911', icon: 'call', color: '#D32F2F', region: 'national', country: 'CA', priority: 'critical', sort_order: 0, active: true
    },
    {
      id: '112', slug: 'international-emergency', title: 'International Emergency (112)', subtitle: 'Alternate universal number',
      type: 'phone', value: '112', icon: 'call', color: '#C62828', region: 'global', country: 'INT', priority: 'high', sort_order: 1, active: true
    },
    {
      id: '988', slug: 'suicide-crisis-hotline', title: 'Suicide & Crisis Hotline (988)', subtitle: 'Mental health emergencies',
      type: 'phone', value: '988', icon: 'call', color: '#1976D2', region: 'national', country: 'US', priority: 'critical', sort_order: 2, active: true
    },
    {
      id: 'distress-centre', slug: 'distress-centre', title: 'Distress Centre', subtitle: 'Online crisis support',
      type: 'website', value: 'https://distresscentre.com/24-hour-crisis-support/', icon: 'globe', color: '#1565C0', region: 'national', country: 'CA', priority: 'high', sort_order: 3, active: true
    },
    {
      id: 'kids-help', slug: 'kids-help-phone', title: 'Kids Help Phone (1-800-668-6868)', subtitle: 'Youth support 24/7',
      type: 'phone', value: '1-800-668-6868', icon: 'call', color: '#388E3C', region: 'national', country: 'CA', priority: 'high', sort_order: 4, active: true
    },
  ];

  // Merge: live resources if present else fallback
  useEffect(() => {
    if (Array.isArray(liveResources) && liveResources.length > 0) {
      setResources(liveResources as CrisisResource[]);
    } else {
      setResources(fallbackResources);
    }
    setInitialLoading(false);
  }, [liveResources]);

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

  const trackAction = useMutation(api.crisis.trackAction);

  /**
   * Handles emergency call actions - opens phone dialer with number
   * @param number - The emergency number to call
   */
  const handleEmergencyCall = async (number: string, serviceName: string, resource?: CrisisResource) => {
    try {
      setLoading(true);
      const phoneNumber = `tel:${number}`;
      const supported = await Linking.canOpenURL(phoneNumber);
      
      if (supported) {
        await Linking.openURL(phoneNumber);
        showModal('success', 'Call Initiated', `Opening ${serviceName}. If the call doesn't start automatically, please dial ${number} manually.`);
        // Track action only if resource has a valid Convex ID (starts with Convex table prefix)
        if (resource?.id && typeof resource.id === 'string' && resource.id.includes('|')) {
          try { await trackAction({ resourceId: resource.id as any, action: 'call' }); } catch (e) { /* ignore */ }
        }
      } else {
        showModal('error', 'Call Not Supported', `Your device doesn't support phone calls. Please dial ${number} manually.`);
      }
    } catch (error) {
      console.error("Error making phone call:", error);
      showModal('error', 'Call Failed', `Unable to make the call. Please dial ${number} manually.`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles distress center website navigation
   */
  const handleDistressCenter = async (url: string, resource?: CrisisResource) => {
    try {
      setLoading(true);
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        showModal('success', 'Website Opened', 'Opening Distress Centre website in your browser...');
        // Track only if resource has valid Convex ID
        if (resource?.id && typeof resource.id === 'string' && resource.id.includes('|')) {
          try { await trackAction({ resourceId: resource.id as any, action: 'visit' }); } catch (e) { /* ignore */ }
        }
      } else {
        showModal('error', 'Browser Not Available', 'Cannot open website. Please check your browser app.');
      }
    } catch (error) {
      console.error("Error opening website:", error);
      showModal('error', 'Navigation Failed', 'Unable to open the website. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator during operations
  if (loading || initialLoading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          {initialLoading ? 'Loading resources...' : 'Connecting...'}
        </Text>
        
        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideModal}
          buttonText="OK"
        />
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        {/* Header */}
        <AppHeader title="Crisis Support" showBack={true} />

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Emergency Help Card - High visibility for immediate assistance */}
          <View style={[styles.emergencyCard, { backgroundColor: theme.isDark ? '#B71C1C' : '#E53935' }]}>
            <View style={styles.emergencyHeader}>
              <Ionicons name="warning" size={28} color="#FFFFFF" />
              <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
            </View>
            <Text style={styles.emergencyText}>
              If you or someone you know is in crisis, please call emergency services or contact a 24/7 crisis line immediately.
            </Text>
            <View style={styles.emergencyContact}>
              <Ionicons name="time" size={16} color="#FFFFFF" />
              <Text style={styles.emergencyContactText}>Available 24/7</Text>
            </View>
          </View>

          {/* Emergency Action Buttons */}
          <View style={styles.emergencyButtons}>
            {/* Phone hotlines (limit visually to top 4 to avoid overwhelming UI) */}
            {resources.filter(r => r.type === 'phone' && r.active !== false).slice(0,4).map((r, idx) => (
              <TouchableOpacity
                key={r.slug}
                style={[styles.emergencyButton, { backgroundColor: r.color || (idx === 0 ? (theme.isDark ? '#C62828' : '#E53935') : idx === 1 ? (theme.isDark ? '#388E3C' : '#4CAF50') : (theme.isDark ? '#1976D2' : '#2196F3')) }]}
                onPress={() => handleEmergencyCall(r.value, r.title || 'Emergency', r)}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons name={(r.icon as any) || 'call'} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.emergencyButtonMainText}>{r.title}</Text>
                  {!!r.subtitle && <Text style={styles.emergencyButtonSubText}>{r.subtitle}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.buttonArrow} />
              </TouchableOpacity>
            ))}

            {/* Crisis website (first available) */}
            {resources.find(r => r.type === 'website' && r.active !== false) && (() => {
              const w = resources.find(r => r.type === 'website' && r.active !== false)!;
              return (
                <TouchableOpacity
                  key={w.slug}
                  style={[styles.emergencyButton, styles.websiteButton, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.primary 
                  }]}
                  onPress={() => handleDistressCenter(w.value, w)}
                >
                  <View style={[styles.buttonIconContainer, { backgroundColor: theme.isDark ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)' }]}> 
                    <Ionicons name={(w.icon as any) || 'globe'} size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.buttonTextContainer}>
                    <Text style={[styles.emergencyButtonMainText, { color: theme.colors.primary }]}> 
                      {w.title || 'Visit Website'}
                    </Text>
                    {!!w.subtitle && (
                      <Text style={[styles.emergencyButtonSubText, { color: theme.colors.primary, opacity: 0.8 }]}> 
                        {w.subtitle}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="open-outline" size={20} color={theme.colors.primary} style={styles.buttonArrow} />
                </TouchableOpacity>
              );
            })()}
          </View>

          {/* Immediate Coping Strategies Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Immediate Coping Strategies</Text>
            </View>
            <View style={styles.strategiesGrid}>
              <TouchableOpacity
                style={[styles.strategyCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => router.push('/(app)/crisis-support/breathing-screen')}
              >
                <View style={[styles.strategyIcon, { backgroundColor: theme.isDark ? '#FFCDD2' : '#FFEBEE', justifyContent: 'center', alignItems: 'center' }]}>
                  <Image
                    source={breatheImage}
                    style={{ width: 26, height: 26, tintColor: '#E53935BF' }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.strategyText, { color: theme.colors.text }]}>Take slow, deep breaths</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.strategyCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => setMapsModalVisible(true)}
              >
                <View style={[styles.strategyIcon, { backgroundColor: theme.isDark ? '#C8E6C9' : '#E8F5E8' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#4CAF50BF" />
                </View>
                <Text style={[styles.strategyText, { color: theme.colors.text }]}>Go to a safe public place</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.strategyCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => router.push('/(app)/crisis-support/focus-timer-screen')}
              >
                <View style={[styles.strategyIcon, { backgroundColor: theme.isDark ? '#BBDEFB' : '#E3F2FD' }]}>
                  <Ionicons name="time" size={20} color="#2196F3BF" />
                </View>
                <Text style={[styles.strategyText, { color: theme.colors.text }]}>Focus on the next hour only</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.strategyCard, { backgroundColor: theme.colors.surface }]}
                onPress={async () => {
                  // Open phone dialer
                  // Using telprompt: on iOS shows dialer without immediately calling
                  // Using tel: on Android opens dialer
                  const url = Platform.OS === 'ios' ? 'telprompt:' : 'tel:';
                  try {
                    const supported = await Linking.canOpenURL(url);
                    if (supported) {
                      await Linking.openURL(url);
                    } else {
                      // Fallback: try standard tel:
                      await Linking.openURL('tel:');
                    }
                  } catch (error) {
                    console.log('Could not open phone dialer:', error);
                  }
                }}
              >
                <View style={[styles.strategyIcon, { backgroundColor: theme.isDark ? '#FFE0B2' : '#FFF3E0' }]}>
                  <Ionicons name="people" size={20} color="#FF9800BF" />
                </View>
                <Text style={[styles.strategyText, { color: theme.colors.text }]}>Reach out to someone you trust</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.strategyCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => setCrisisSupportModalVisible(true)}
              >
                <View style={[styles.strategyIcon, { backgroundColor: theme.isDark ? '#E1BEE7' : '#F3E5F5' }]}>
                  <Ionicons name="remove-circle" size={20} color="#9C27B0BF" />
                </View>
                <Text style={[styles.strategyText, { color: theme.colors.text }]}>Remove means of self-harm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.strategyCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => router.push('/(app)/crisis-support/grounding-screen')}
              >
                <View style={[styles.strategyIcon, { backgroundColor: theme.isDark ? '#B2DFDB' : '#E0F2F1' }]}>
                  <Ionicons name="leaf" size={20} color="#009688BF" />
                </View>
                <Text style={[styles.strategyText, { color: theme.colors.text }]}>Use grounding techniques</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Support Section */}
          <View style={[styles.supportSection, { 
            backgroundColor: theme.isDark ? '#5D4037' : '#FFF3E0' 
          }]}>
            <View style={styles.supportHeader}>
              <Ionicons name="information-circle" size={24} color={theme.isDark ? '#FFCCBC' : '#5D4037'} />
              <Text style={[styles.supportTitle, { color: theme.isDark ? '#FFCCBC' : '#5D4037' }]}>
                Remember
              </Text>
            </View>
            <Text style={[styles.supportText, { color: theme.isDark ? '#FFCCBC' : '#5D4037' }]}>
              You are not alone. Reaching out for help is a sign of strength. These feelings are temporary, and with support, things can get better.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
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

        {/* Maps Selection Modal */}
        <Modal
          visible={mapsModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMapsModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.mapsModalOverlay}
            activeOpacity={1}
            onPress={() => setMapsModalVisible(false)}
          >
            <View style={[styles.mapsModalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.mapsModalHeader}>
                <Ionicons name="location" size={32} color={theme.colors.primary} />
                <Text style={[styles.mapsModalTitle, { color: theme.colors.text }]}>
                  Find Safe Places Nearby
                </Text>
              </View>
              <Text style={[styles.mapsModalSubtitle, { color: theme.colors.textSecondary }]}>
                Choose your preferred maps app
              </Text>

              {/* Show Apple Maps button only on iOS */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.mapsButton, { backgroundColor: '#000000' }]}
                  onPress={() => openMaps('apple')}
                >
                  <Ionicons name="map" size={24} color="#FFFFFF" />
                  <Text style={styles.mapsButtonText}>Open Apple Maps</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.mapsButton, { backgroundColor: '#4285F4' }]}
                onPress={() => openMaps('google')}
              >
                <Ionicons name="logo-google" size={24} color="#FFFFFF" />
                <Text style={styles.mapsButtonText}>Open Google Maps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapsCancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setMapsModalVisible(false)}
              >
                <Text style={[styles.mapsCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Crisis Support Modal */}
        <Modal
          visible={crisisSupportModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCrisisSupportModalVisible(false)}
        >
          <View style={styles.mapsModalOverlay}>
            <View style={[styles.mapsModalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.mapsModalHeader}>
                <Ionicons name="heart" size={48} color="#E53935" />
                <Text style={[styles.mapsModalTitle, { color: theme.colors.text }]}>
                  Would you like to call crisis support?
                </Text>
              </View>
              <Text style={[styles.mapsModalSubtitle, { color: theme.colors.textSecondary }]}>
                Talking to someone can help. Support is available 24/7.
              </Text>

              <TouchableOpacity
                style={[styles.mapsButton, { backgroundColor: '#E53935' }]}
                onPress={() => {
                  setCrisisSupportModalVisible(false);
                  handleEmergencyCall('988', 'Crisis Hotline');
                }}
              >
                <Ionicons name="call" size={24} color="#FFFFFF" />
                <Text style={styles.mapsButtonText}>Call Crisis Hotline (988)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapsButton, { backgroundColor: '#1565C0' }]}
                onPress={() => {
                  setCrisisSupportModalVisible(false);
                  handleEmergencyCall('403-266-4357', 'Distress Centre');
                }}
              >
                <Ionicons name="call" size={24} color="#FFFFFF" />
                <Text style={styles.mapsButtonText}>Call Distress Centre (403-266-4357)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapsButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => {
                  setCrisisSupportModalVisible(false);
                  handleEmergencyCall('911', 'Emergency Services');
                }}
              >
                <Ionicons name="call" size={24} color="#FFFFFF" />
                <Text style={styles.mapsButtonText}>Call 911</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapsCancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setCrisisSupportModalVisible(false)}
              >
                <Text style={[styles.mapsCancelText, { color: theme.colors.textSecondary }]}>Not right now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    marginTop: 12,
    fontSize: scaledFontSize(16), // Base size 16px
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emergencyCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: scaledFontSize(22), // Base size 22px
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  emergencyText: {
    fontSize: scaledFontSize(16), // Base size 16px
    color: "#FFFFFF",
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.9,
  },
  emergencyContact: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyContactText: {
    fontSize: scaledFontSize(14), // Base size 14px
    color: "#FFFFFF",
    marginLeft: 6,
    opacity: 0.8,
  },
  emergencyButtons: {
    marginBottom: 32,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  websiteButton: {
    borderWidth: 2,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  emergencyButtonMainText: {
    fontSize: scaledFontSize(18), // Base size 18px
    fontWeight: "600",
    marginBottom: 4,
    color: "#FFFFFF",
  },
  emergencyButtonSubText: {
    fontSize: scaledFontSize(14), // Base size 14px
    opacity: 0.9,
    color: "#FFFFFF",
  },
  buttonArrow: {
    opacity: 0.8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
    marginLeft: 12,
  },
  strategiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  strategyCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  strategyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  strategyText: {
    fontSize: scaledFontSize(14), // Base size 14px
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 18,
  },
  groundingSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  groundingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  groundingTitle: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
    marginLeft: 12,
  },
  groundingDescription: {
    fontSize: scaledFontSize(15), // Base size 15px
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.8,
  },
  groundingSteps: {
    marginLeft: 8,
  },
  groundingStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: scaledFontSize(16), // Base size 16px
  },
  stepText: {
    fontSize: scaledFontSize(16), // Base size 16px
    flex: 1,
    fontWeight: "500",
  },
  supportSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  supportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "600",
    marginLeft: 12,
  },
  supportText: {
    fontSize: scaledFontSize(16), // Base size 16px
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.9,
  },
  // Maps Modal Styles
  mapsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapsModalContent: {
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
  },
  mapsModalHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mapsModalTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  mapsModalSubtitle: {
    fontSize: scaledFontSize(14),
    marginBottom: 24,
    textAlign: 'center',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  mapsButtonText: {
    color: '#FFFFFF',
    fontSize: scaledFontSize(16),
    fontWeight: '600',
    marginLeft: 12,
  },
  mapsCancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  mapsCancelText: {
    fontSize: scaledFontSize(16),
    fontWeight: '500',
  },
});