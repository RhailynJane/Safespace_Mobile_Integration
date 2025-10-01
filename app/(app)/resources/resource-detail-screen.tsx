/**
 * Resource Detail Screen - Display full resource content
 */
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";

export default function ResourceDetailScreen() {
  const params = useLocalSearchParams();
  const [bookmarked, setBookmarked] = useState(false);

  // Extract resource data from params
  const resource = {
    id: params.id as string,
    title: params.title as string,
    content: params.content as string,
    author: params.author as string,
    type: params.type as string,
    category: params.category as string,
  };

  // Handle share functionality
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${resource.title}\n\n"${resource.content}"\n\n— ${resource.author}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Handle bookmark toggle
  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    Alert.alert(
      bookmarked ? "Removed from Bookmarks" : "Bookmarked",
      bookmarked
        ? "Resource removed from your saved items"
        : "Resource saved to your bookmarks"
    );
  };

  // Get category color
  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      stress: "#FF8A65",
      anxiety: "#81C784",
      depression: "#64B5F6",
      sleep: "#4DD0E1",
      motivation: "#FFB74D",
      mindfulness: "#BA68C8",
    };
    return colors[resource.category] || "#4CAF50";
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Resource" showBack={true} />

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Resource Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor() },
              ]}
            >
              <Text style={styles.categoryText}>
                {resource.category.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.title}>{resource.title}</Text>

            {resource.author && (
              <Text style={styles.author}>By {resource.author}</Text>
            )}

            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="document-text" size={16} color="#666" />
                <Text style={styles.metaText}>{resource.type}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBookmark}
            >
              <Ionicons
                name={bookmarked ? "bookmark" : "bookmark-outline"}
                size={24}
                color={bookmarked ? "#4CAF50" : "#666"}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  bookmarked && styles.actionButtonTextActive,
                ]}
              >
                {bookmarked ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#666" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Resource Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Content</Text>
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{resource.content}</Text>
            </View>
          </View>

          {/* Reflection Section */}
          <View style={styles.reflectionSection}>
            <Text style={styles.reflectionTitle}>💭 Take a Moment</Text>
            <Text style={styles.reflectionText}>
              Reflect on how this resonates with you. Consider writing down your
              thoughts or discussing with someone you trust.
            </Text>
          </View>

          {/* Related Actions */}
          <View style={styles.relatedActions}>
            <Text style={styles.relatedTitle}>What&apos;s Next?</Text>
            
            <TouchableOpacity
              style={styles.relatedCard}
              onPress={() => router.push("/(app)/(tabs)/home")}
            >
              <View style={styles.relatedIconContainer}>
                <Text style={styles.relatedIcon}>🏠</Text>
              </View>
              <View style={styles.relatedContent}>
                <Text style={styles.relatedCardTitle}>Return to Home</Text>
                <Text style={styles.relatedCardText}>
                  Continue your wellness journey
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.relatedCard}
              onPress={() => router.back()}
            >
              <View style={styles.relatedIconContainer}>
                <Text style={styles.relatedIcon}>📚</Text>
              </View>
              <View style={styles.relatedContent}>
                <Text style={styles.relatedCardTitle}>Explore More</Text>
                <Text style={styles.relatedCardText}>
                  Browse other resources
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CurvedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    lineHeight: 34,
  },
  author: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 15,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  actionButtonTextActive: {
    color: "#4CAF50",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  contentCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#333",
    letterSpacing: 0.3,
  },
  reflectionSection: {
    marginHorizontal: 20,
    marginTop: 25,
    padding: 20,
    backgroundColor: "#FFF9E6",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  reflectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F57C00",
    marginBottom: 10,
  },
  reflectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#666",
  },
  relatedActions: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  relatedIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  relatedIcon: {
    fontSize: 24,
  },
  relatedContent: {
    flex: 1,
  },
  relatedCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  relatedCardText: {
    fontSize: 13,
    color: "#666",
  },
});