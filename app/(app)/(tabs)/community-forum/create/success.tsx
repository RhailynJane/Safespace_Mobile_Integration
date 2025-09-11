import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import BottomNavigation from "../../../../../components/BottomNavigation";
import { useAuth } from "../../../../../context/AuthContext";
import { AppHeader } from "../../../../../components/AppHeader";

export default function PostSuccessScreen() {
  const [activeTab, setActiveTab] = useState("community-forum");
  const handleViewPost = () => {
    router.replace("/(app)/(tabs)/community-forum/main");
  };

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader 
        title=""
        showBack={true} 
        showMenu={false} 
        showNotifications={false}
        rightActions={
          <View style={styles.communityPostButton}>
            <Text style={styles.communityPostButtonText}>Community Post</Text>
          </View>
        }
      />  

      <View style={styles.content}>
        {/* Success Card */}
        <View style={styles.successCard}>
          <View style={styles.successImageBorder}>
            <Image
              source={require('../../../../../assets/images/success.png')}
              style={styles.successImage}
            />
          </View>
          
          <Text style={styles.title}>Post Successful!</Text>
          
          <Text style={styles.message}>
            You have successfully posted a post.
            {"\n"}Let's see it now!
          </Text>

          <TouchableOpacity
            style={styles.cardButton}
            onPress={handleViewPost}
          >
            <Text style={styles.cardButtonText}>See my post</Text>
          </TouchableOpacity>
          
        </View>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  communityPostButton: {
    backgroundColor: "#EDE7EC",
    paddingHorizontal: 40,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#000",
  },
  communityPostButtonText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    justifyContent: "flex-start",
    marginTop: 30,
    alignItems: "center",
    padding: 20,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#000",
    borderWidth: 0.5,
    borderRadius: 20,
    height:418,
    padding: 30,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  successIcon: {
    marginBottom: 20,
  },
  successImage: {
    width:250,
    height: 250,
    borderWidth: 1,
    borderRadius: 30,
    borderColor: '#B87B7B',
    marginTop: -18,
  },
  successImageBorder:{
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    borderRadius: 5,
    borderColor: '#B87B7B',
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#212121",
    marginBottom: 16,
    marginTop: 20,
    textAlign: "left",
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "left",
    lineHeight: 12,
    marginBottom: 10,
    marginTop: -5,
  },
  cardButton: {
    backgroundColor: "#7CB9A9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    marginRight: 30,
    marginLeft: 30,
    shadowColor: "#999",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  cardButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "column",
    padding: 20,
    backgroundColor: "#F2F2F7",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    gap: 12,
    marginBottom: 40,
  },
  secondaryButton: {
    backgroundColor: "#7CB9A9",
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    marginRight: 30,
    marginLeft: 30,
    shadowColor: "#999",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  secondaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});