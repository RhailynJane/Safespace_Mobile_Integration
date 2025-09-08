import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface Tab {
  id: string;
  name: string;
  icon: string;
}

interface Theme {
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    textDisabled: string;
    border: string;
    borderLight: string;
    icon: string;
    iconDisabled: string;
    primary: string;
    accent: string;
    error: string;
  };
}

interface BottomNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  theme?: Theme;
}

export default function BottomNavigation({
  tabs,
  activeTab,
  onTabPress,
  theme,
}: BottomNavigationProps) {
  // Default theme values (original hardcoded colors) when theme is not provided
  const defaultTheme = {
    colors: {
      surface: "#FFFFFF",
      border: "#E0E0E0", 
      primary: "#4CAF50",
      textSecondary: "#757575",
    }
  };

  const currentTheme = theme || defaultTheme;

  const dynamicStyles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.border,
      backgroundColor: currentTheme.colors.surface,
    },
    activeTab: {
      borderTopWidth: 2,
      borderTopColor: currentTheme.colors.primary,
    },
    tabText: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
      marginTop: 4,
    },
    activeTabText: {
      color: currentTheme.colors.primary,
      fontWeight: "500",
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && dynamicStyles.activeTab]}
          onPress={() => onTabPress(tab.id)}
        >
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={activeTab === tab.id ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
          />
          <Text
            style={[
              dynamicStyles.tabText,
              activeTab === tab.id && dynamicStyles.activeTabText,
            ]}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignItems: "center",
    padding: 8,
  },
});