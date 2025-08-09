import { View, Text, StyleSheet, SafeAreaView } from "react-native";

/**
 * AppointmentsScreen Component
 *
 * A placeholder screen for the appointments feature in the SafeSpace app.
 * Currently displays a simple centered message indicating where upcoming
 * appointments will be shown. This serves as a foundation for future
 * appointment management functionality.
 *
 * Features:
 * - Clean, centered layout with placeholder content
 * - Consistent styling with app theme (light gray background)
 * - Clear messaging about future functionality
 * - Safe area handling for different device screens
 *
 * Future Implementation:
 * - List of upcoming appointments with therapists
 * - Appointment scheduling interface
 * - Calendar integration
 * - Appointment details and management options
 * - Past appointment history
 */
export default function AppointmentsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* 
        MAIN CONTENT CONTAINER
        Centers the placeholder content both horizontally and vertically
        Takes up the full screen space within the safe area
      */}
      <View style={styles.content}>
        {/* 
          SCREEN TITLE
          Large, bold text clearly identifying the appointments section
          Uses dark gray for good contrast against light background
        */}
        <Text style={styles.title}>Appointments</Text>

        {/* 
          PLACEHOLDER MESSAGE
          Informative subtitle explaining what will appear in this screen
          Uses medium gray for secondary text hierarchy
          Centered text alignment for balanced appearance
        */}
        <Text style={styles.subtitle}>
          Your upcoming appointments will appear here
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // MAIN CONTAINER
  // Full-screen container with safe area handling
  container: {
    flex: 1, // Take full available height
    backgroundColor: "#F5F5F5", // Light gray background matching app theme
  },

  // CONTENT WRAPPER
  // Centers content both horizontally and vertically on screen
  content: {
    flex: 1, // Take full container height
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
    paddingHorizontal: 20, // Side padding for text readability
  },

  // TITLE TEXT STYLING
  // Primary heading for the screen
  title: {
    fontSize: 24, // Large text for screen identification
    fontWeight: "bold", // Bold weight for prominence
    color: "#333", // Dark gray for good contrast and readability
    marginBottom: 10, // Small space between title and subtitle
  },

  // SUBTITLE TEXT STYLING
  // Secondary descriptive text explaining the screen purpose
  subtitle: {
    fontSize: 16, // Medium text size for readability
    color: "#666", // Medium gray for secondary text hierarchy
    textAlign: "center", // Center alignment for balanced appearance
    // No additional margins needed due to centered parent container
  },
});
