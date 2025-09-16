/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */

import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Tab {
  id: string;
  name: string;
  icon: string;
}

interface BottomNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export default function BottomNavigation({
  tabs,
  activeTab,
  onTabPress,
}: BottomNavigationProps) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.navItem}
          onPress={() => onTabPress(tab.id)} // Handles tab selection
          accessibilityRole="button"
          accessibilityLabel={`Navigate to ${tab.name}`}
        >
          <View style={[
            styles.navIconContainer,
            activeTab === tab.id && styles.activeIconContainer // Highlights active tab
          ]}>
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={activeTab === tab.id ? "#2EA78F" : "#9E9E9E"} // Active/inactive colors
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    position: "absolute", // Fixed at bottom
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 40,   // Rounded top corners
    borderTopRightRadius: 40, 
    shadowColor: "#000",       // Android shadow
    shadowOffset: {
      width: 0,
      height: -1,              // Shadow above the nav
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,              // Android elevation
  },
  navItem: {
    alignItems: "center",
    padding: 8,
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,          // Circular container
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#B6D5CF61', // Light green background for active tab
  },
});