import { useState } from "react";
import { Linking } from "react-native";
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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";

const { width } = Dimensions.get("window");

/**
 * CrisisScreen Component
 *
 * Emergency support screen providing immediate crisis resources including:
 * - Emergency contact numbers (911, crisis hotlines) with direct calling
 * - Immediate coping strategies
 * - Grounding techniques (5-4-3-2-1 method)
 * - Quick access to professional help
 * Features an elegant curved background and urgent, clear interface design.
 */
export default function CrisisScreen() {
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("crisis");

  // Bottom navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

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

  /**
   * Handles emergency call actions - opens phone dialer with number
   * @param number - The emergency number to call
   */
  const handleEmergencyCall = async (number: string) => {
    try {
      const phoneNumber = `tel:${number}`;
      const supported = await Linking.canOpenURL(phoneNumber);
      
      if (supported) {
        await Linking.openURL(phoneNumber);
      } else {
        console.log("Phone calling not supported");
      }
    } catch (error) {
      console.error("Error making phone call:", error);
    }
  };

  /**
   * Handles distress center website navigation
   */
  const handleDistressCenter = async () => {
    try {
      const url = "https://distresscentre.com";
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Cannot open URL");
      }
    } catch (error) {
      console.error("Error opening website:", error);
    }
  };

  // Show loading indicator during operations
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <AppHeader title="Crisis Support" showBack={true} />

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Emergency Help Card - High visibility for immediate assistance */}
          <View style={styles.emergencyCard}>
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
            <TouchableOpacity
              style={[styles.emergencyButton, styles.emergency911]}
              onPress={() => handleEmergencyCall("911")}
            >
              <View style={styles.buttonIconContainer}>
                <Ionicons name="call" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.emergencyButtonMainText}>Call 911</Text>
                <Text style={styles.emergencyButtonSubText}>Emergency Services</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.buttonArrow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emergencyButton, styles.crisisHotline]}
              onPress={() => handleEmergencyCall("988")}
            >
              <View style={styles.buttonIconContainer}>
                <Ionicons name="heart" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.emergencyButtonMainText}>Crisis Hotline</Text>
                <Text style={styles.emergencyButtonSubText}>Call 988</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.buttonArrow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emergencyButton, styles.distressCenter]}
              onPress={() => handleEmergencyCall("403-266-4357")}
            >
              <View style={styles.buttonIconContainer}>
                <Ionicons name="people" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.emergencyButtonMainText}>Distress Center</Text>
                <Text style={styles.emergencyButtonSubText}>403-266-4357</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.buttonArrow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emergencyButton, styles.websiteButton]}
              onPress={handleDistressCenter}
            >
              <View style={styles.buttonIconContainer}>
                <Ionicons name="globe" size={24} color="#2196F3" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.emergencyButtonMainText, styles.websiteText]}>
                  Visit Website
                </Text>
                <Text style={[styles.emergencyButtonSubText, styles.websiteSubText]}>
                  distresscentre.com
                </Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#2196F3" style={styles.buttonArrow} />
            </TouchableOpacity>
          </View>

          {/* Immediate Coping Strategies Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Immediate Coping Strategies</Text>
            </View>
            <View style={styles.strategiesGrid}>
              <View style={styles.strategyCard}>
                <View style={[styles.strategyIcon, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="water" size={20} color="#E53935" />
                </View>
                <Text style={styles.strategyText}>Take slow, deep breaths</Text>
              </View>

              <View style={styles.strategyCard}>
                <View style={[styles.strategyIcon, { backgroundColor: '#E8F5E8' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.strategyText}>Go to a safe public place</Text>
              </View>

              <View style={styles.strategyCard}>
                <View style={[styles.strategyIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="time" size={20} color="#2196F3" />
                </View>
                <Text style={styles.strategyText}>Focus on the next hour only</Text>
              </View>

              <View style={styles.strategyCard}>
                <View style={[styles.strategyIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="people" size={20} color="#FF9800" />
                </View>
                <Text style={styles.strategyText}>Reach out to someone you trust</Text>
              </View>

              <View style={styles.strategyCard}>
                <View style={[styles.strategyIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="remove-circle" size={20} color="#9C27B0" />
                </View>
                <Text style={styles.strategyText}>Remove means of self-harm</Text>
              </View>

              <View style={styles.strategyCard}>
                <View style={[styles.strategyIcon, { backgroundColor: '#E0F2F1' }]}>
                  <Ionicons name="leaf" size={20} color="#009688" />
                </View>
                <Text style={styles.strategyText}>Use grounding techniques</Text>
              </View>
            </View>
          </View>

          {/* Grounding Technique Section */}
          <View style={styles.groundingSection}>
            <View style={styles.groundingHeader}>
              <Ionicons name="compass" size={24} color="#2E7D32" />
              <Text style={styles.groundingTitle}>5-4-3-2-1 Grounding Technique</Text>
            </View>
            <Text style={styles.groundingDescription}>
              When feeling overwhelmed, use your senses to ground yourself in the present moment.
            </Text>
            <View style={styles.groundingSteps}>
              <View style={styles.groundingStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>5</Text>
                </View>
                <Text style={styles.stepText}>things you can see around you</Text>
              </View>
              <View style={styles.groundingStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>things you can touch and feel</Text>
              </View>
              <View style={styles.groundingStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>things you can hear right now</Text>
              </View>
              <View style={styles.groundingStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>things you can smell nearby</Text>
              </View>
              <View style={styles.groundingStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>thing you can taste or would like to taste</Text>
              </View>
            </View>
          </View>

          {/* Additional Support Section */}
          <View style={styles.supportSection}>
            <View style={styles.supportHeader}>
              <Ionicons name="information-circle" size={24} color="#5D4037" />
              <Text style={styles.supportTitle}>Remember</Text>
            </View>
            <Text style={styles.supportText}>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emergencyCard: {
    backgroundColor: "#E53935",
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
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  emergencyText: {
    fontSize: 16,
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
    fontSize: 14,
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
  emergency911: {
    backgroundColor: "#E53935",
  },
  crisisHotline: {
    backgroundColor: "#4CAF50",
  },
  distressCenter: {
    backgroundColor: "#2196F3",
  },
  websiteButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  emergencyButtonMainText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  emergencyButtonSubText: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.9,
  },
  websiteText: {
    color: "#2196F3",
  },
  websiteSubText: {
    color: "#2196F3",
    opacity: 0.8,
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
    fontSize: 20,
    fontWeight: "600",
    color: "#4CAF50",
    marginLeft: 12,
  },
  strategiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  strategyCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
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
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 18,
  },
  groundingSection: {
    backgroundColor: "#E8F5E9",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
    marginLeft: 12,
  },
  groundingDescription: {
    fontSize: 15,
    color: "#5D4037",
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
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  stepText: {
    fontSize: 16,
    color: "#5D4037",
    flex: 1,
    fontWeight: "500",
  },
  supportSection: {
    backgroundColor: "#FFF3E0",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#5D4037",
    marginLeft: 12,
  },
  supportText: {
    fontSize: 16,
    color: "#5D4037",
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.9,
  },
});