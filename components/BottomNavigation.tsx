import type React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type NavItem = "home" | "appointments" | "messages" | "profile";

interface BottomNavigationProps {
  activeTab?: NavItem;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = "home",
}) => {
  const handleNavPress = (tab: NavItem) => {
    switch (tab) {
      case "home":
        router.push("/(app)");
        break;
      case "appointments":
        console.log("Appointments pressed");
        break;
      case "messages":
        console.log("Messages pressed");
        break;
      case "profile":
        console.log("Profile pressed");
        break;
    }
  };

  const renderNavItem = (tab: NavItem, iconName: string, label: string) => {
    const isActive = activeTab === tab;

    return (
      <TouchableOpacity
        key={tab}
        style={styles.navItem}
        onPress={() => handleNavPress(tab)}
      >
        <View
          style={[styles.iconContainer, isActive && styles.activeIconContainer]}
        >
          <Ionicons
            name={iconName as any}
            size={24}
            color={isActive ? "#7FDBDA" : "#666"}
          />
        </View>
        <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {renderNavItem("home", "home", "Home")}
        {renderNavItem("appointments", "calendar", "Book Appointments")}
        {renderNavItem("messages", "chatbubble", "Messages")}
        {renderNavItem("profile", "person", "Profile")}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  navBar: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 4,
  },
  activeIconContainer: {
    // Could add background or other active styling here
  },
  navLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  activeNavLabel: {
    color: "#7FDBDA",
    fontWeight: "600",
  },
});

export default BottomNavigation;
