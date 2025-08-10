import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

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
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => onTabPress(tab.id)}
        >
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={activeTab === tab.id ? "#4CAF50" : "#757575"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText,
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
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  tab: {
    alignItems: "center",
    padding: 8,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
  },
  tabText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  activeTabText: {
    color: "#4CAF50",
    fontWeight: "500",
  },
});
