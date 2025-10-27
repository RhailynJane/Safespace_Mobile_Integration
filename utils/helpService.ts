// utils/helpService.ts
export interface HelpItem {
  id?: string;
  title: string;
  content: string;
  type?: 'guide' | 'faq' | 'contact';
  sort_order?: number;
  related_features?: string[];
  estimated_read_time?: number;
  last_updated?: string;
}

export interface HelpSection {
  id: string;
  title: string;
  icon: string;
  content: HelpItem[];
  expanded?: boolean;
  sort_order?: number;
  description?: string;
  category?: 'getting_started' | 'features' | 'support' | 'privacy' | 'troubleshooting';
  priority?: 'high' | 'medium' | 'low';
}

export interface HelpSearchResult {
  items: HelpItem[];
  sections: HelpSection[];
  query: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://localhost:3000';

// API Functions remain the same
export const fetchHelpSections = async (): Promise<HelpSection[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/help-sections`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch help sections: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching help sections:', error);
    return getFallbackHelpSections();
  }
};

export const fetchHelpItems = async (sectionId: string): Promise<HelpItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/help-sections/${sectionId}/items`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch help items: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching help items for section ${sectionId}:`, error);
    return getFallbackHelpItems(sectionId);
  }
};

export const fetchAllHelpData = async (): Promise<HelpSection[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/help-sections?include=items`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch help data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all help data:', error);
    return getFallbackHelpSectionsWithItems();
  }
};

export const searchHelpContent = async (query: string): Promise<HelpItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/help/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search help content: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching help content:', error);
    return [];
  }
};

export const trackHelpSectionView = async (sectionId: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/api/help-sections/${sectionId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error tracking help section view:', error);
  }
};

// Updated Fallback Data with Removed Elements
const getFallbackHelpSections = (): HelpSection[] => [
  {
    id: 'getting_started',
    title: '🌟 Getting Started',
    icon: '🌟',
    description: 'Learn how to set up your account and navigate the app',
    category: 'getting_started',
    priority: 'high',
    sort_order: 1,
    content: [],
  },
  {
    id: 'features',
    title: '📱 Features Help',
    icon: '📱',
    description: 'Detailed guides for all app features and functionalities',
    category: 'features',
    priority: 'high',
    sort_order: 2,
    content: [],
  },
  {
    id: 'account_technical',
    title: '⚙️ Account & Technical Support',
    icon: '⚙️',
    description: 'Troubleshoot account and technical issues',
    category: 'troubleshooting',
    priority: 'medium',
    sort_order: 3,
    content: [],
  },
  {
    id: 'safety_privacy',
    title: '🔒 Safety & Privacy',
    icon: '🔒',
    description: 'Understand how we protect your data and ensure your safety',
    category: 'privacy',
    priority: 'high',
    sort_order: 4,
    content: [],
  },
  {
    id: 'faqs',
    title: '❓ Frequently Asked Questions',
    icon: '❓',
    description: 'Quick answers to common questions',
    category: 'support',
    priority: 'medium',
    sort_order: 5,
    content: [],
  },
  {
    id: 'contact',
    title: '💬 Contact Support',
    icon: '💬',
    description: 'Get in touch with our support team',
    category: 'support',
    priority: 'low',
    sort_order: 6,
    content: [],
  },
];

const getFallbackHelpItems = (sectionId: string): HelpItem[] => {
  const fallbackData: { [key: string]: HelpItem[] } = {
    getting_started: [
      {
        id: 'gs_profile_setup',
        title: 'How to Create Your Profile',
        content: `## Complete Profile Setup Guide

### Step-by-Step Process:
1. **Navigate to Profile**: Tap the profile icon in the bottom navigation
2. **Edit Profile**: Select "Edit Profile" from your profile screen
3. **Personal Information**: Add your basic details (name, pronouns, location)
4. **Save**: Changes are automatically saved

### Why It Matters:
- Complete profiles help support workers understand your background
- Personalized content recommendations
- Better matching with appropriate support resources
- Enhanced community experience

### Tips:
- Use a recent, clear profile picture
- Be honest about your preferences and needs
- Update your information as your situation changes`,
        type: 'guide',
        sort_order: 1,
        related_features: ['profile', 'settings'],
        estimated_read_time: 2,
        last_updated: '2024-01-15',
      },
      {
        id: 'gs_first_appointment',
        title: 'Setting Up Your First Appointment',
        content: `## Booking Your First Session

### Booking Process:
1. **Access Appointments**: Tap "Appointments" in bottom navigation
2. **Book New**: Select "Book New Appointment"
3. **Choose Support Worker**: Browse available professionals
4. **Select Time**: Choose from available time slots
5. **Confirm Details**: Review session type and duration
6. **Book**: Confirm your appointment

### Session Preparation:
- Write down topics you want to discuss
- Ensure you have a private, comfortable space
- Test your audio/video if it's a virtual session
- Have a stable internet connection

### Cancellation Policy:
- Cancel up to 24 hours in advance
- Reschedule through the "My Appointments" section`,
        type: 'guide',
        sort_order: 2,
        related_features: ['appointments', 'calendar'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
      {
        id: 'gs_dashboard_overview',
        title: 'Understanding Your Dashboard',
        content: `## Dashboard Features Overview

### Main Sections:
**Upcoming Appointments**
- Next session details
- Join meeting button (when available)
- Reschedule options

**Assessments**
- Self-assessment results
- Recommended next assessments

**Resources Library**
- Curated mental health articles
- Crisis resources

**Mood Tracking**
- Daily mood log
- Journal integration

**Quick Access**
- Emergency contacts
- Crisis resources
- Favorite features

### Navigation Tips:
- Swipe left/right to see different sections
- Tap any card to expand details
- Use search for quick access to specific features`,
        type: 'guide',
        sort_order: 3,
        related_features: ['dashboard', 'mood_tracking', 'resources'],
        estimated_read_time: 4,
        last_updated: '2024-01-15',
      },
      {
        id: 'gs_privacy_info',
        title: 'Privacy and Confidentiality Information',
        content: `## Your Privacy and Data Security

### What We Protect:
- **Session Content**: All conversations with support workers are encrypted
- **Personal Data**: Your information is stored securely
- **Community Posts**: Choose visibility (public/private) for each post
- **Assessment Data**: Results are visible only to you and your support worker

### Your Control:
- **Data Access**: Download your data anytime from settings
- **Account Deletion**: Permanent deletion available upon request
- **Sharing Controls**: Choose what to share with support workers

### Important Notes:
- Support workers maintain confidentiality with legal exceptions
- Anonymous usage data helps improve the app`,
        type: 'guide',
        sort_order: 4,
        related_features: ['privacy', 'settings', 'community'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
    ],

    features: [
      {
        id: 'feat_appointment_booking',
        title: 'Appointment Booking System',
        content: `## Complete Appointment Management

### Scheduling:
- **Book Appointments**: Browse available time slots with your support worker
- **Session Types**: Choose between video, audio, or chat sessions
- **Reminders**: Receive notifications before sessions

### Management:
- **Reschedule**: Change appointment times in advance
- **Cancel**: Cancel appointments (24h notice required)
- **Session History**: View past sessions

### Technical Requirements:
- Stable internet connection for video sessions
- Latest app version for optimal performance
- Allow notifications for appointment reminders`,
        type: 'guide',
        sort_order: 1,
        related_features: ['appointments', 'notifications', 'calendar'],
        estimated_read_time: 4,
        last_updated: '2024-01-15',
      },
      {
        id: 'feat_community_forum',
        title: 'Community Forum Features',
        content: `## Engaging with the Community

### Post Types:
- **Discussion Posts**: Share experiences and ask questions
- **Resource Shares**: Post helpful articles or tools
- **Support Requests**: Ask for community support
- **Success Stories**: Share positive progress

### Privacy Settings:
- **Public Posts**: Visible to all community members
- **Private Posts**: Only visible to your connections

### Community Guidelines:
- Be respectful and supportive in all interactions
- No personal attacks or discriminatory language
- Respect different perspectives and experiences
- Maintain confidentiality - don't share others' stories`,
        type: 'guide',
        sort_order: 2,
        related_features: ['community', 'posts', 'privacy'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
      {
        id: 'feat_secure_messaging',
        title: 'Secure Messaging with Support Workers',
        content: `## Between-Session Communication

### Message Types:
- **Quick Questions**: Brief clarifications between sessions
- **Resource Sharing**: Your support worker may share helpful materials
- **Session Follow-ups**: Additional thoughts after sessions

### Response Times:
- **General Inquiries**: Within 24-48 hours
- **Weekend Messages**: Responses on next business day

### Best Practices:
- Be clear and concise in your messages
- Respect your support worker's boundaries and response times
- Keep important discussions for scheduled sessions`,
        type: 'guide',
        sort_order: 3,
        related_features: ['messaging', 'support_workers'],
        estimated_read_time: 2,
        last_updated: '2024-01-15',
      },
      {
        id: 'feat_mood_journal',
        title: 'Mood Tracking & Journaling',
        content: `## Tracking Your Mental Wellness

### Mood Tracking:
- **Daily Check-ins**: Log your mood multiple times per day
- **Mood Scale**: Use our 1-10 scale or emoji-based system
- **Pattern Recognition**: View weekly/monthly mood trends

### Journaling Features:
- **Free Writing**: Unlimited journal entries
- **Prompts**: Use guided prompts when you don't know what to write
- **Search**: Find past entries by date or keywords

### Sharing Options:
- **Private**: Keep entries completely private
- **Share with Support Worker**: Select specific entries to discuss`,
        type: 'guide',
        sort_order: 4,
        related_features: ['mood_tracking', 'journaling'],
        estimated_read_time: 4,
        last_updated: '2024-01-15',
      },
      {
        id: 'feat_resources',
        title: 'Resources Library',
        content: `## Accessing Helpful Resources

### Resource Types:
- **Articles**: Mental health education and coping strategies
- **Crisis Resources**: Immediate help and emergency contacts
- **Community Resources**: Local mental health services

### Organization:
- **Categories**: Anxiety, depression, relationships, self-care, etc.
- **Favorites**: Save resources for quick access

### Personalization:
- Recommendations based on your interests and needs
- Recently viewed resources
- Progress-tracking for completed resources`,
        type: 'guide',
        sort_order: 5,
        related_features: ['resources', 'library', 'favorites'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
    ],

    account_technical: [
      {
        id: 'tech_login_issues',
        title: 'Login and Account Access Issues',
        content: `## Troubleshooting Account Access

### Common Login Problems:
- **Forgot Password**: Use "Reset Password" on login screen
- **Account Locked**: After failed attempts, wait 30 minutes or contact support
- **Email Not Recognized**: Check for typos or use correct email associated with account

### Solutions:
1. **Password Reset**:
   - Tap "Forgot Password" on login screen
   - Check your email for reset link (including spam folder)
   - Create a new strong password
   - Log in with new credentials

2. **Account Recovery**:
   - Contact support if you no longer have access to your email
   - Provide account verification information
   - Update your email and security settings

3. **App-Specific Issues**:
   - Clear app cache and data
   - Update to latest app version
   - Restart your device
   - Reinstall the app (your data is cloud-saved)`,
        type: 'guide',
        sort_order: 1,
        related_features: ['login', 'security', 'account'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
      {
        id: 'tech_password_reset',
        title: 'Password Reset and Security',
        content: `## Managing Your Account Security

### Password Requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

### Reset Process:
1. **Initiate Reset**: Tap "Forgot Password" on login screen
2. **Email Verification**: Check your inbox for reset instructions
3. **Create New Password**: Follow security requirements
4. **Confirmation**: You'll receive confirmation of successful change

### Security Best Practices:
- Use a unique password for this account
- Regularly update your password
- Don't share your login credentials
- Log out from shared devices`,
        type: 'guide',
        sort_order: 2,
        related_features: ['security', 'password', 'account'],
        estimated_read_time: 2,
        last_updated: '2024-01-15',
      },
      {
        id: 'tech_profile_settings',
        title: 'Profile and Settings Management',
        content: `## Customizing Your Experience

### Profile Settings:
- **Personal Information**: Name, pronouns, contact details
- **Privacy Settings**: Control what information is visible
- **Notification Preferences**: Choose what alerts you receive

### App Preferences:
- **Theme**: Light/dark mode selection
- **Text Size**: Adjust for better readability
- **Data Usage**: Control image quality and download settings

### Account Management:
- **Data Export**: Download your personal data
- **Account Deletion**: Permanently remove your account
- **Connected Devices**: Manage active sessions`,
        type: 'guide',
        sort_order: 3,
        related_features: ['profile', 'settings', 'preferences'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
      {
        id: 'tech_troubleshooting',
        title: 'General Technical Troubleshooting',
        content: `## Solving Common Technical Issues

### App Performance:
- **Slow Performance**: Close background apps, clear cache, restart device
- **Crashes**: Update to latest version, reinstall app

### Connection Issues:
- **No Internet**: Check WiFi/mobile data, restart router
- **Sync Problems**: Pull down to refresh, check internet connection, log out/in

### Audio/Video Problems:
- **Poor Quality**: Check internet speed, close other apps, use headphones
- **No Sound**: Check device volume, app permissions, mute settings
- **Camera Issues**: Grant camera permissions, clean lens, restart device

### Update and Installation:
- **Update Failed**: Check storage space, stable internet
- **Installation Issues**: Ensure device compatibility, sufficient storage`,
        type: 'guide',
        sort_order: 4,
        related_features: ['technical', 'performance', 'connectivity'],
        estimated_read_time: 4,
        last_updated: '2024-01-15',
      },
    ],

    safety_privacy: [
      {
        id: 'safe_data_protection',
        title: 'How Your Data is Protected',
        content: `## Comprehensive Data Security

### Encryption Standards:
- **End-to-End Encryption**: All messages and sessions are encrypted
- **Data at Rest**: Personal information encrypted in our databases
- **Secure Transmission**: SSL/TLS encryption for all data transfers

### Security Measures:
- **Regular Audits**: Third-party security assessments
- **Access Controls**: Strict role-based access for team members
- **Monitoring**: 24/7 security monitoring and threat detection
- **Backups**: Regular encrypted backups in secure locations

### Your Rights:
- **Data Access**: Request a copy of all your personal data
- **Correction**: Update or correct inaccurate information
- **Deletion**: Request permanent deletion of your account and data
- **Portability**: Export your data in readable format`,
        type: 'guide',
        sort_order: 1,
        related_features: ['privacy', 'security', 'data_protection'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
      {
        id: 'safe_community_guidelines',
        title: 'Community Safety Guidelines',
        content: `## Creating a Safe Community Space

### Expected Behavior:
- **Respect**: Treat all members with dignity and respect
- **Support**: Offer encouragement and constructive feedback
- **Inclusion**: Welcome diverse perspectives and experiences
- **Confidentiality**: Don't share others' stories without permission

### Prohibited Content:
- **Harassment**: No bullying, threats, or personal attacks
- **Discrimination**: No hate speech based on identity factors
- **Misinformation**: No promotion of harmful or false information
- **Commercial Content**: No advertising or promotional posts`,
        type: 'guide',
        sort_order: 2,
        related_features: ['community', 'safety'],
        estimated_read_time: 2,
        last_updated: '2024-01-15',
      },
      {
        id: 'safe_confidentiality',
        title: 'Understanding Confidentiality Limits',
        content: `## Confidentiality and Legal Requirements

### What is Confidential:
- **Session Content**: Discussions with your support worker
- **Personal Information**: Your identity and contact details
- **Health Information**: Assessment results and progress notes
- **Private Messages**: Communications with support workers

### Legal Exceptions:
- **Imminent Harm**: Risk of serious harm to self or others
- **Abuse Reports**: Suspected child or vulnerable adult abuse
- **Court Orders**: Information required by legal subpoena
- **Professional Standards**: Ethical requirements for support workers

### Your Awareness:
- **Informed Consent**: You acknowledge these limits when using the service
- **Discussion**: Your support worker will discuss confidentiality in first session
- **Questions**: Always ask if unsure about confidentiality of specific information
- **Emergency Situations**: Crisis support may involve additional safety protocols`,
        type: 'guide',
        sort_order: 3,
        related_features: ['confidentiality', 'legal', 'safety'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
    ],

    faqs: [
      {
        id: 'faq_support_questions',
        title: 'Common Questions About Support',
        content: `## Frequently Asked Support Questions

### Session Frequency:
**Q: How often should I schedule sessions?**
A: Most people start with weekly sessions, then adjust based on progress and needs. Your support worker can help determine the best frequency.

### Support Worker Matching:
**Q: What if I don't feel comfortable with my support worker?**
A: You can request a new support worker anytime through your profile settings. It's important to have a good therapeutic relationship.

### Session Preparation:
**Q: How should I prepare for sessions?**
A: Think about what you want to discuss, note any mood changes, and have questions ready. But it's also okay to come without preparation.

### Between Sessions:
**Q: What should I do if I need help between sessions?**
A: Use the messaging feature for non-urgent questions. For crises, use the emergency resources in the app.`,
        type: 'faq',
        sort_order: 1,
        related_features: ['sessions', 'support_workers'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
      {
        id: 'faq_app_functionality',
        title: 'App Functionality Questions',
        content: `## Technical and Feature FAQs

### Offline Usage:
**Q: Can I use the app without internet?**
A: No, all features require an active internet connection for security and real-time updates.

### Data Backup:
**Q: Is my data backed up and secure?**
A: Yes, all your data is encrypted and regularly backed up on secure servers.

### Multiple Devices:
**Q: Can I use the app on multiple devices?**
A: Yes, you can access your account from multiple devices. All data syncs automatically.

### Notifications:
**Q: Why am I not receiving notifications?**
A: Check your device notification settings and in-app notification preferences. Ensure you have a stable internet connection.

### Session Quality:
**Q: What if I have technical issues during a session?**
A: Use the in-call troubleshooting options or message your support worker. You can reschedule if technical issues persist.`,
        type: 'faq',
        sort_order: 2,
        related_features: ['technical', 'notifications', 'sessions'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
      {
        id: 'faq_data_sharing',
        title: 'Data Sharing and Privacy FAQs',
        content: `## Privacy-Related Questions

### Data Visibility:
**Q: Who can see my mood tracking and journal entries?**
A: Only you by default. You can choose to share specific entries with your support worker.

### Community Privacy:
**Q: Are my community posts anonymous?**
A: You can choose to post with your profile visible or keep them private to your connections.

### Support Worker Access:
**Q: What can my support worker see about my app usage?**
A: They can only see information you explicitly share and your appointment history.

### Data Retention:
**Q: How long is my data stored?**
A: Your data is stored while your account is active. You can request deletion at any time.`,
        type: 'faq',
        sort_order: 3,
        related_features: ['privacy', 'data', 'sharing'],
        estimated_read_time: 3,
        last_updated: '2024-01-15',
      },
      {
        id: 'faq_account_management',
        title: 'Account Management FAQs',
        content: `## Account Questions

### Account Creation:
**Q: Can I change my email address?**
A: Yes, go to Profile → Edit Profile to update your email.

### Data Export:
**Q: Can I download my data?**
A: Yes, use the Data Export feature in Settings → Privacy.

### Multiple Accounts:
**Q: Can I have multiple accounts?**
A: No, each person should have their own account for proper support matching.

### Account Deletion:
**Q: What happens when I delete my account?**
A: All your personal data is permanently deleted within 30 days.`,
        type: 'faq',
        sort_order: 4,
        related_features: ['account', 'data'],
        estimated_read_time: 2,
        last_updated: '2024-01-15',
      },
    ],

    contact: [
      {
        id: 'contact_email',
        title: 'Email Support',
        content: `## Contacting Support via Email

### When to Email:
- **Non-urgent technical issues**
- **Account questions**
- **Feature requests and feedback**
- **General inquiries about the service**

### Email Address:
**safespace.dev.app@gmail.com**

### What to Include:
- **Your username or account email**
- **Detailed description of your issue**
- **Screenshots if applicable**
- **Device and app version information**
- **Steps you've already tried**

### Response Time:
- **General Inquiries**: 24-48 hours
- **Technical Issues**: Within 24 hours
- **Weekends**: Responses on next business day`,
        type: 'contact',
        sort_order: 1,
        related_features: ['support', 'contact', 'email'],
        estimated_read_time: 2,
        last_updated: '2024-01-15',
      },
      {
        id: 'contact_response_times',
        title: 'Response Time Expectations',
        content: `## Support Response Timeline

### Priority Levels:

**Urgent Technical Issues** (App not working, login problems)
- Initial Response: 2-4 hours during business hours
- Resolution: Within 24 hours

**General Support** (Feature questions, account issues)
- Initial Response: 24-48 hours
- Resolution: 3-5 business days

**Feature Requests & Feedback**
- Acknowledgement: 48 hours
- Consideration: Included in monthly review

### Business Hours:
- Monday-Friday: 9:00 AM - 6:00 PM (Your Local Time)
- Weekend messages processed on Monday
- Holidays may affect response times`,
        type: 'contact',
        sort_order: 2,
        related_features: ['support', 'response_times'],
        estimated_read_time: 2,
        last_updated: '2024-01-15',
      },
    ],
  };

  return fallbackData[sectionId] || [];
};

const getFallbackHelpSectionsWithItems = (): HelpSection[] => {
  const sections = getFallbackHelpSections();
  return sections.map(section => ({
    ...section,
    content: getFallbackHelpItems(section.id),
  }));
};