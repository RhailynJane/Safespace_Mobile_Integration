import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// Props interface for the TherapyTypeCard component
interface TherapyTypeCardProps {
  type: "adult" | "minor" | "guardian"; // Type determines the card's background color
  title: string; // Main title displayed on the card
  subtitle: string; // Descriptive text below the title
  emoji: string; // Emoji icon displayed in the circular container
  isSelected: boolean; // Whether this card is currently selected
  onPress: () => void; // Callback function when card is pressed
}

/**
 * TherapyTypeCard - A selectable card component for choosing therapy types
 * Features different colors based on type, selection state, and visual feedback
 */
export default function TherapyTypeCard({
  type,
  title,
  subtitle,
  emoji,
  isSelected,
  onPress,
}: TherapyTypeCardProps) {
  /**
   * Returns the background color based on the therapy type
   * Each type has its own distinct light color theme
   */
  const getCardColor = () => {
    switch (type) {
      case "adult":
        return "#FFE5E5"; // Light pink for adult therapy
      case "minor":
        return "#E5F3FF"; // Light blue for minor therapy
      case "guardian":
        return "#FFE5F3"; // Light purple for guardian therapy
      default:
        return "#F5F5F5"; // Default light gray fallback
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: getCardColor() }, // Dynamic background color
        isSelected && styles.selectedCard, // Add border when selected
      ]}
      onPress={onPress}
      activeOpacity={0.8} // Slight opacity change on press for feedback
    >
      {/* Main card content container */}
      <View style={styles.cardContent}>
        {/* Text content section */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Emoji container with circular background */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      </View>

      {/* Checkmark indicator - only shown when selected */}
      {isSelected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Main card container styling
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
    position: "relative", // Needed for absolute positioned checkmark
  },

  // Additional styling when card is selected
  selectedCard: {
    borderWidth: 2,
    borderColor: "#7FDBDA", // Teal border color for selection
  },

  // Press state styling (currently unused but available)
  cardPressed: {
    transform: [{ scale: 0.98 }], // Slightly shrink on press
    opacity: 0.8,
  },

  // Container for the main card content (text + emoji)
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Container for title and subtitle text
  textContainer: {
    flex: 1, // Take up remaining space after emoji container
  },

  // Main title text styling
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },

  // Subtitle text styling
  subtitle: {
    fontSize: 14,
    color: "#666", // Lighter gray for secondary text
  },

  // Circular container for the emoji
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30, // Makes it perfectly circular
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000", // Subtle shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Emoji text styling
  emoji: {
    fontSize: 30,
  },

  // Checkmark container positioned in top-right corner
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12, // Circular checkmark background
    backgroundColor: "#7FDBDA", // Teal background matching border
    alignItems: "center",
    justifyContent: "center",
  },

  // Checkmark text styling
  checkmarkText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
