/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */

import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View testID="bottom-navigation" style={[
      styles.bottomNav, 
      { 
        backgroundColor: theme.colors.surface,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 8 // Use safe area if exists, otherwise 8px
      }
    ]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.navItem}
          onPress={() => onTabPress(tab.id)} // Handles tab selection
          testID={`nav-tab-${tab.id}`}
          accessibilityState={{ selected: activeTab === tab.id }}
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
              color={activeTab === tab.id ? "#2EA78F" : theme.colors.icon} // Active/inactive colors
              testID={`nav-icon-${tab.id}`}
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
    paddingTop: 8,             // Reduced top padding
    paddingVertical: 4,        // Minimal vertical padding
    // paddingBottom removed - now dynamic based on safe area
    // backgroundColor removed - now uses theme.colors.surface
    position: "absolute",      // Fixed at bottom
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 40,   // Rounded top corners
    borderTopRightRadius: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,              // Android shadow
  },
  navItem: {
    alignItems: "center",
    padding: 8,                // Reduced padding from 14
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