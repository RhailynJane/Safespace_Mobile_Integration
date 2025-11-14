import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { AppHeader } from "../../../components/AppHeader";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const AnnouncementsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { userId } = useAuth();

  const notifications = useQuery(api.notifications.getNotifications, userId ? { userId, limit: 200 } : "skip");

  const announcements = useMemo(() => {
    const list = notifications?.notifications || [];
    // Treat system notifications as announcements for now
    return list.filter((n: any) => n.type === "system");
  }, [notifications]);

  if (!userId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <AppHeader title="Announcements" showBack />
        <View style={styles.center}>
          <Text style={{ color: theme.colors.textSecondary }}>Please sign in to view announcements.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <AppHeader title="Announcements" showBack />
      {!notifications ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.text} />
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No announcements yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Announcements from your organization will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}> 
              <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>{item.title || "Announcement"}</Text>
              <Text style={[styles.message, { color: theme.colors.text }]}>{item.message}</Text>
              <Text style={[styles.time, { color: theme.colors.textSecondary }]}>{item.time}</Text>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { /* live query auto-updates */ }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(0,0,0,0.06)" },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  time: { fontSize: 12 },
});

export default AnnouncementsScreen;
