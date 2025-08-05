import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface TherapyTypeCardProps {
  type: "adult" | "minor" | "guardian";
  title: string;
  subtitle: string;
  emoji: string;
  isSelected: boolean;
  onPress: () => void;
}

export default function TherapyTypeCard({
  type,
  title,
  subtitle,
  emoji,
  isSelected,
  onPress,
}: TherapyTypeCardProps) {
  const getCardColor = () => {
    switch (type) {
      case "adult":
        return "#FFE5E5"; // Light pink
      case "minor":
        return "#E5F3FF"; // Light blue
      case "guardian":
        return "#FFE5F3"; // Light purple
      default:
        return "#F5F5F5";
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: getCardColor() },
        isSelected && styles.selectedCard,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      </View>
      {isSelected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#7FDBDA",
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.8,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emoji: {
    fontSize: 30,
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7FDBDA",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
