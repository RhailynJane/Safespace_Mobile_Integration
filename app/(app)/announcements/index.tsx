import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Dimensions } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { AppHeader } from "../../../components/AppHeader";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import CurvedBackground from "../../../components/CurvedBackground";
import BottomNavigation from "../../../components/BottomNavigation";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

// Supported organization ids
const ORG_IDS = [
  "cmha-calgary",
  "cmha-edmonton",
  "sait",
  "unaffiliated",
] as const;
type OrgId = typeof ORG_IDS[number];

function isOrgId(value: unknown): value is OrgId {
  return typeof value === "string" && (ORG_IDS as readonly string[]).includes(value);
}

const AnnouncementsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { userId } = useAuth();
  const { user } = useUser();

  // Prefer Convex users table org; fall back to Clerk publicMetadata
  const myOrgFromConvex = useQuery(api.users.getMyOrg, {});
  // Read org from Clerk public metadata if present
  const orgFromClerk: unknown = (user?.publicMetadata as any)?.orgId;
  // UI orgId: prefer Clerk metadata (most up-to-date), then Convex value, finally fallback
  const orgId: OrgId = useMemo(() => {
    // Prioritize Clerk metadata as it's the source of truth
    if (isOrgId(orgFromClerk)) return orgFromClerk;
    // Use Convex value if Clerk doesn't have it
    if (isOrgId(myOrgFromConvex)) return myOrgFromConvex;
    // Only use fallback if both are undefined (after loading)
    return "cmha-calgary";
  }, [myOrgFromConvex, orgFromClerk]);

  // Organization meta - colors and subtitles for small org banners
  const orgMeta = useMemo<Record<OrgId, { label: string; color: string; subtitle: string }>>(
    () => ({
      "cmha-calgary": { label: "CMHA Calgary", color: "#4CAF50", subtitle: "Canadian Mental Health Association - Calgary" },
      "cmha-edmonton": { label: "CMHA Edmonton", color: "#7CB9A9", subtitle: "Canadian Mental Health Association - Edmonton" },
      "sait": { label: "SAIT", color: "#0055A4", subtitle: "Southern Alberta Institute of Technology" },
      "unaffiliated": { label: "Unaffiliated", color: theme.colors.primary, subtitle: "No organization selected" },
    }),
    [theme.colors.primary]
  );

  const data = useQuery(api.announcements.listByOrg, orgId ? { orgId, activeOnly: true, limit: 100 } : "skip");
  const seed = useMutation(api.announcements.seedSampleAnnouncements);
  const clearAndReseed = useMutation(api.announcements.clearAndReseed);
  const syncOrg = useMutation(api.users.syncCurrentUserOrg);
  const markRead = useMutation(api.announcements.markAsRead);
  const [seeded, setSeeded] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("home");

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const announcements = useMemo(() => data?.announcements || [], [data]);

  // Sync org to Convex when Clerk has a value (source of truth)
  useEffect(() => {
    if (!userId) return;
    // Only sync if Clerk has a valid org and Convex query has loaded
    if (isOrgId(orgFromClerk) && myOrgFromConvex !== undefined && orgFromClerk !== myOrgFromConvex) {
      syncOrg({ orgId: orgFromClerk }).catch(() => {});
    }
  }, [userId, orgFromClerk, myOrgFromConvex, syncOrg]);

  useEffect(() => {
    if (userId && orgId && !seeded && data && announcements.length === 0) {
      setSeeded(true);
      seed({ orgId }).catch(() => setSeeded(false));
    }
    // Auto-reseed if only 2 announcements (old seed data)
    if (userId && orgId && !seeded && data && announcements.length === 2) {
      setSeeded(true);
      clearAndReseed({ orgId }).catch(() => setSeeded(false));
    }
  }, [userId, orgId, data, announcements.length, seed, clearAndReseed, seeded]);

  const toggleExpand = useCallback((id: string, isRead: boolean) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!isRead) {
      markRead({ announcementId: id as any }).catch(() => {});
    }
  }, [markRead]);

  const unreadCount = useMemo(() => {
    if (!userId) return 0;
    return announcements.filter((a: any) => !a.readBy?.includes(userId)).length;
  }, [announcements, userId]);

  const renderItem = ({ item }: { item: any }) => {
    const isExpanded = !!expanded[item.id];
    const isRead = item.readBy?.includes(userId) || false;

    return (
      <Pressable onPress={() => toggleExpand(item.id, isRead)}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderLeftColor: isRead ? theme.colors.borderLight : "#4CAF50", borderLeftWidth: 4 }]}> 
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: isRead ? theme.colors.borderLight : "#E8F5E9" }]}>
                <Ionicons name="megaphone" size={20} color={isRead ? theme.colors.textSecondary : "#4CAF50"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.time, { color: theme.colors.textSecondary }]}>{item.time}</Text>
              </View>
            </View>
            {!isRead && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>NEW</Text>
              </View>
            )}
          </View>
          <Text style={[styles.message, { color: theme.colors.text }]} numberOfLines={isExpanded ? undefined : 3}>
            {item.body}
          </Text>
          <Pressable onPress={() => toggleExpand(item.id, isRead)}>
            <Text style={[styles.expand, { color: "#4CAF50" }]}>
              {isExpanded ? "Show less ▲" : "Read more ▼"}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  if (!userId) {
    return (
      <CurvedBackground>
        <View style={[styles.container, { backgroundColor: 'transparent' }]}> 
          <AppHeader title="Announcements" showBack />
          <View style={styles.center}>
            <Ionicons name="lock-closed-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text, marginTop: 16 }]}>Sign in Required</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Please sign in to view announcements.</Text>
          </View>
        </View>
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}> 
        <AppHeader title="Announcements" showBack />
        
        {/* Stats Header */}
        {/* Optional org banner: shows org label and short subtitle for clarity */}
        {orgMeta[orgId] && (
          <View style={[styles.orgBanner, { backgroundColor: orgMeta[orgId].color }]}> 
            <Ionicons name="ribbon" size={18} color="#fff" />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.orgBannerTitle, { color: '#fff' }]}>{orgMeta[orgId].label}</Text>
              <Text style={[styles.orgBannerSubtitle, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={1}>{orgMeta[orgId].subtitle}</Text>
            </View>
          </View>
        )}
        <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statBox}>
            <Ionicons name="business-outline" size={20} color="#4CAF50" />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Organization</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">{orgId.replace("-", " ").toUpperCase()}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
          <View style={styles.statBox}>
            <Ionicons name="mail-unread-outline" size={20} color="#FF6B6B" />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Unread</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{unreadCount}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
          <View style={styles.statBox}>
            <Ionicons name="notifications-outline" size={20} color="#7CB9A9" />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{announcements.length}</Text>
          </View>
        </View>

        {data === undefined ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading announcements...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No announcements yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Announcements from {orgId} will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </CurvedBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  statsContainer: { 
    flexDirection: "row", 
    margin: 16, 
    marginTop: 8,
    borderRadius: 16, 
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orgBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orgBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  orgBannerSubtitle: {
    fontSize: 12,
  },
  statBox: { flex: 1, alignItems: "center", gap: 4 },
  statLabel: { fontSize: 11, marginTop: 4 },
  statValue: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  divider: { width: 1, marginHorizontal: 12 },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  card: { 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", flex: 1, paddingRight: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  title: { fontSize: 16, fontWeight: "700", lineHeight: 22, marginBottom: 4 },
  unreadBadge: { backgroundColor: "#FF6B6B", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  unreadText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  message: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  expand: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  time: { fontSize: 12 },
});

export default AnnouncementsScreen;

