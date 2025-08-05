"use client";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const nameParts = user?.displayName?.split(" ") ?? [];
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <SafeSpaceLogo size={50} />
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{fullName || "User"}!</Text>
          <Text style={styles.subtitleText}>How are you feeling today?</Text>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: "#E8F5E8" }]}>
                <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.actionTitle}>Book Session</Text>
              <Text style={styles.actionSubtitle}>Schedule therapy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="chatbubble-outline" size={24} color="#2196F3" />
              </View>
              <Text style={styles.actionTitle}>Chat</Text>
              <Text style={styles.actionSubtitle}>Message therapist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="journal-outline" size={24} color="#FF9800" />
              </View>
              <Text style={styles.actionTitle}>Journal</Text>
              <Text style={styles.actionSubtitle}>Write thoughts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="heart-outline" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.actionTitle}>Mood</Text>
              <Text style={styles.actionSubtitle}>Track feelings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 10,
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
  },
  logoutButton: {
    padding: 8,
  },
  welcomeSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  welcomeText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 5,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    width: "47%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
