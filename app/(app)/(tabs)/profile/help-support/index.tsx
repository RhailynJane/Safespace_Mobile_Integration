import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import CurvedBackground from "../../../../../components/CurvedBackground";
import { AppHeader } from "../../../../../components/AppHeader";

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  content: HelpItem[];
  expanded?: boolean;
}

interface HelpItem {
  title: string;
  content: string;
  type?: "crisis" | "guide" | "faq" | "contact";
}

const HelpSupportScreen: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "crisis",
  ]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleCrisisCall = (number: string) => {
    Alert.alert("Crisis Support", `Call ${number}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call",
        onPress: () => Linking.openURL(`tel:${number}`),
      },
    ]);
  };

  const helpSections: HelpSection[] = [
    {
      id: "crisis",
      title: "🚨 Crisis Support",
      icon: "🚨",
      content: [
        {
          title: "National Suicide Prevention Lifeline",
          content: "Call 988 for immediate crisis support, available 24/7",
          type: "crisis",
        },
        {
          title: "Crisis Text Line",
          content:
            "Text HOME to 741741 for confidential crisis support via text",
          type: "crisis",
        },
        {
          title: "Emergency Services",
          content: "Call 911 if you are in immediate physical danger",
          type: "crisis",
        },
        {
          title: "Local Mental Health Emergency Resources",
          content:
            "Contact your local emergency room or mental health crisis center for immediate in-person support",
        },
      ],
    },
    {
      id: "getting_started",
      title: "🌟 Getting Started",
      icon: "🌟",
      content: [
        {
          title: "How to create your profile",
          content:
            "Go to Profile > Edit Profile to add your personal information, preferences, and mental health goals. Complete information helps us provide better support.",
        },
        {
          title: "Setting up your first appointment",
          content:
            "Navigate to Appointments > Book New Appointment. Choose your preferred therapist, date, and time. You'll receive a confirmation email with session details.",
        },
        {
          title: "Understanding your dashboard",
          content:
            "Your home screen shows upcoming appointments, recent assessments, community activity, and quick access to resources. Customize your dashboard in Settings.",
        },
        {
          title: "Privacy and confidentiality information",
          content:
            "Your conversations with licensed therapists are confidential and HIPAA-protected. Community posts are visible to other users but can be anonymous.",
        },
      ],
    },
    {
      id: "features",
      title: "📱 Features Help",
      icon: "📱",
      content: [
        {
          title: "Appointment Booking",
          content:
            'Schedule: Tap "Book Appointment" and select your preferred time.\nReschedule: Go to "My Appointments" and tap "Reschedule".\nCancel: Cancel up to 24 hours before your appointment without fees.',
        },
        {
          title: "Community Forum",
          content:
            "Community Guidelines: Be respectful, supportive, and kind.\nPost Safely: Avoid sharing personal identifying information.\nAnonymous Posts: You can post anonymously by toggling the setting before posting.",
        },
        {
          title: "Secure Messaging",
          content:
            "Message your therapist securely between sessions. Messages are encrypted and HIPAA-compliant. Response times are typically within 24-48 hours during business days.",
        },
        {
          title: "Self Assessment",
          content:
            "Take assessments to track your mental health progress. Results help your therapist understand your current state. Retake assessments weekly or as recommended by your provider.",
        },
        {
          title: "Resources",
          content:
            "Browse curated mental health resources, articles, and tools. Save helpful content to your favorites by tapping the heart icon. Access saved resources in your profile.",
        },
      ],
    },
    {
      id: "account_technical",
      title: "⚙️ Account & Technical Support",
      icon: "⚙️",
      content: [
        {
          title: "Login issues",
          content:
            'Forgot password? Tap "Forgot Password" on login screen.\nAccount locked? Contact support if you\'ve tried multiple unsuccessful login attempts.\nTwo-factor authentication issues? Check your authentication app or contact support.',
        },
        {
          title: "Password reset",
          content:
            'Go to Settings > Security > Change Password or use "Forgot Password" on the login screen. You\'ll receive a reset link via email.',
        },
        {
          title: "Profile settings",
          content:
            "Update personal information, notification preferences, and privacy settings in Profile > Settings. Changes are saved automatically.",
        },
        {
          title: "Technical troubleshooting",
          content:
            "App crashes: Force close and restart the app.\nSlow performance: Check your internet connection and close other apps.\nSync issues: Pull down to refresh or log out and back in.",
        },
        {
          title: "App performance issues",
          content:
            "Ensure you have the latest app version from the app store. Clear app cache in device settings if experiencing persistent issues.",
        },
      ],
    },
    {
      id: "safety_privacy",
      title: "🔒 Safety & Privacy",
      icon: "🔒",
      content: [
        {
          title: "How your data is protected",
          content:
            "We use bank-level encryption, HIPAA-compliant security measures, and secure cloud storage. Your data is never sold or shared without consent.",
        },
        {
          title: "Community safety guidelines",
          content:
            "No harassment, discrimination, or harmful content.\nNo sharing of personal contact information.\nReport concerning posts immediately.\nModerators review all reported content within 24 hours.",
        },
        {
          title: "Reporting inappropriate content",
          content:
            'Tap the three dots on any post or message and select "Report". Choose the reason for reporting and provide additional details if needed.',
        },
        {
          title: "Understanding confidentiality limits",
          content:
            "Therapist confidentiality has legal limits: imminent harm to self or others, child/elder abuse, or court orders may require disclosure.",
        },
      ],
    },
    {
      id: "faqs",
      title: "❓ Frequently Asked Questions",
      icon: "❓",
      content: [
        {
          title: "Common questions about therapy",
          content:
            "Q: How often should I have sessions?\nA: Most people benefit from weekly sessions initially.\n\nQ: What if I don't connect with my therapist?\nA: You can request a new therapist at any time through your profile settings.",
        },
        {
          title: "Insurance and billing questions",
          content:
            "Q: Do you accept my insurance?\nA: Check our accepted insurance list in Settings > Billing.\n\nQ: What are the costs?\nA: Session fees vary by provider. View pricing in the booking section.",
        },
        {
          title: "Technical FAQs",
          content:
            "Q: Can I use the app offline?\nA: Some features work offline, but messaging and appointments require internet.\n\nQ: Is my data backed up?\nA: Yes, all data is securely backed up and synchronized across devices.",
        },
      ],
    },
    {
      id: "contact",
      title: "💬 Contact Support",
      icon: "💬",
      content: [
        {
          title: "Support ticket system",
          content:
            "Submit detailed support requests through our ticket system. Include screenshots and specific error messages for faster resolution.",
        },
        {
          title: "Email support",
          content:
            "Email us at support@mentalhealth-app.com for non-urgent inquiries. We respond within 24-48 hours during business days.",
        },
        {
          title: "Response time expectations",
          content:
            "Crisis support: Immediate\nUrgent technical issues: 2-4 hours\nGeneral support: 24-48 hours\nBilling questions: 1-2 business days",
        },
      ],
    },
  ];

  const renderCrisisButtons = () => (
    <View style={styles.crisisButtonsContainer}>
      <TouchableOpacity
        style={styles.crisisButton}
        onPress={() => handleCrisisCall("988")}
      >
        <Text style={styles.crisisButtonText}>
          📞 Call 988 - Crisis Lifeline
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.crisisButton}
        onPress={() => handleCrisisCall("911")}
      >
        <Text style={styles.crisisButtonText}>🚨 Call 911 - Emergency</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.textCrisisButton}
        onPress={() => Linking.openURL("sms:741741?body=HOME")}
      >
        <Text style={styles.textCrisisButtonText}>💬 Text HOME to 741741</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHelpItem = (item: HelpItem, index: number) => (
    <View key={index} style={styles.helpItem}>
      <Text style={styles.helpItemTitle}>{item.title}</Text>
      <Text style={styles.helpItemContent}>{item.content}</Text>
    </View>
  );

  const renderSection = (section: HelpSection) => {
    const isExpanded = expandedSections.includes(section.id);

    return (
      <View key={section.id} style={styles.sectionContainer}>
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            section.id === "crisis" && styles.crisisSectionHeader,
          ]}
          onPress={() => toggleSection(section.id)}
        >
          <Text
            style={[
              styles.sectionTitle,
              section.id === "crisis" && styles.crisisSectionTitle,
            ]}
          >
            {section.title}
          </Text>
          <Text
            style={[
              styles.expandIcon,
              section.id === "crisis" && styles.crisisExpandIcon,
            ]}
          >
            {isExpanded ? "−" : "+"}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {section.id === "crisis" && renderCrisisButtons()}
            {section.content.map((item, index) => renderHelpItem(item, index))}
          </View>
        )}
      </View>
    );
  };

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Help & Support" showBack={true} />
        <ScrollView style={styles.scrollView}>
          <Text style={styles.screenSubtitle}>
            Find answers to common questions and get the help you need
          </Text>

          {helpSections.map(renderSection)}

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Still need help? Our support team is here for you.
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() =>
                Linking.openURL("mailto:support@mentalhealth-app.com")
              }
            >
              <Text style={styles.contactButtonText}>📧 Email Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CurvedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
    color: "#2E7D32",
  },
  screenSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  crisisSectionHeader: {
    backgroundColor: "#fff3cd",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  crisisSectionTitle: {
    color: "#856404",
    fontWeight: "700",
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    width: 24,
    textAlign: "center",
  },
  crisisExpandIcon: {
    color: "#856404",
  },
  sectionContent: {
    padding: 16,
  },
  crisisButtonsContainer: {
    marginBottom: 16,
  },
  crisisButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 30,
    marginBottom: 8,
    alignItems: "center",
  },
  crisisButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  textCrisisButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  textCrisisButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  helpItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  helpItemContent: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
  footerSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  contactButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 30,
  },
  contactButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
});

export default HelpSupportScreen;
