import { View, Text, StyleSheet, SafeAreaView } from "react-native";

/**
 * MessagesScreen Component
 *
 * A placeholder screen that displays when no messages are present.
 * Shows a centered title and subtitle informing users that their
 * conversations will appear in this location.
 */
export default function MessagesScreen() {
  return (
    // SafeAreaView ensures content doesn't overlap with system UI (status bar, notch, etc.)
    <SafeAreaView style={styles.container}>
      {/* Main content container - centers content vertically and horizontally */}
      <View style={styles.content}>
        {/* Primary heading */}
        <Text style={styles.title}>Messages</Text>
        {/* Secondary text explaining the screen's purpose */}
        <Text style={styles.subtitle}>Your conversations will appear here</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container - fills entire screen with light gray background
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  // Content wrapper - centers child elements and adds horizontal padding
  content: {
    flex: 1,
    justifyContent: "center", // Center vertically
    alignItems: "center", // Center horizontally
    paddingHorizontal: 20, // Add side margins for better text readability
  },
  // Main title styling - large, bold, dark text
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10, // Space between title and subtitle
  },
  // Subtitle styling - smaller, lighter text with center alignment
  subtitle: {
    fontSize: 16,
    color: "#666", // Lighter gray for less emphasis
    textAlign: "center", // Ensure text is centered if it wraps
  },
});
