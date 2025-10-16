-- Help sections table
CREATE TABLE IF NOT EXISTS help_sections (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'medium',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Help items table
CREATE TABLE IF NOT EXISTS help_items (
    id VARCHAR(50) PRIMARY KEY,
    section_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'guide',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES help_sections(id) ON DELETE CASCADE
);

-- Add missing columns to help_sections table
ALTER TABLE help_sections 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';

-- Add missing columns to help_items table if needed
ALTER TABLE help_items 
ADD COLUMN IF NOT EXISTS related_features TEXT[],
ADD COLUMN IF NOT EXISTS estimated_read_time INTEGER,
ADD COLUMN IF NOT EXISTS last_updated VARCHAR(20);

-- Update help_sections with complete data
INSERT INTO help_sections (id, title, icon, description, category, priority, sort_order) VALUES
('getting_started', '🌟 Getting Started', '🌟', 'Learn how to set up your account and navigate the app', 'getting_started', 'high', 1),
('features', '📱 Features Help', '📱', 'Detailed guides for all app features and functionalities', 'features', 'high', 2),
('account_technical', '⚙️ Account & Technical Support', '⚙️', 'Troubleshoot account and technical issues', 'troubleshooting', 'medium', 3),
('safety_privacy', '🔒 Safety & Privacy', '🔒', 'Understand how we protect your data and ensure your safety', 'privacy', 'high', 4),
('faqs', '❓ Frequently Asked Questions', '❓', 'Quick answers to common questions', 'support', 'medium', 5),
('contact', '💬 Contact Support', '💬', 'Get in touch with our support team', 'support', 'low', 6)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;

-- Insert complete help items data with clean formatting
INSERT INTO help_items (id, section_id, title, content, type, sort_order, related_features, estimated_read_time, last_updated) VALUES
-- Getting Started items
('gs_profile_setup', 'getting_started', 'How to Create Your Profile', 'COMPLETE PROFILE SETUP GUIDE

Step-by-Step Process:
1. Navigate to Profile: Tap the profile icon in the bottom navigation
2. Edit Profile: Select "Edit Profile" from your profile screen
3. Personal Information: Add your basic details (name, pronouns, location)
4. Save: Changes are automatically saved

Why It Matters:
- Complete profiles help support workers understand your background
- Personalized content recommendations
- Better matching with appropriate support resources
- Enhanced community experience

Tips:
- Use a recent, clear profile picture
- Be honest about your preferences and needs
- Update your information as your situation changes', 'guide', 1, '{"profile", "settings"}', 2, '2024-01-15'),

('gs_first_appointment', 'getting_started', 'Setting Up Your First Appointment', 'BOOKING YOUR FIRST SESSION

Booking Process:
1. Access Appointments: Tap "Appointments" in bottom navigation
2. Book New: Select "Book New Appointment"
3. Choose Support Worker: Browse available professionals
4. Select Time: Choose from available time slots
5. Confirm Details: Review session type and duration
6. Book: Confirm your appointment

Session Preparation:
- Write down topics you want to discuss
- Ensure you have a private, comfortable space
- Test your audio/video if it''s a virtual session
- Have a stable internet connection

Cancellation Policy:
- Cancel up to 24 hours in advance
- Reschedule through the "My Appointments" section', 'guide', 2, '{"appointments", "calendar"}', 3, '2024-01-15'),

('gs_dashboard_overview', 'getting_started', 'Understanding Your Dashboard', 'DASHBOARD FEATURES OVERVIEW

Main Sections:
Upcoming Appointments
- Next session details
- Join meeting button (when available)
- Reschedule options

Assessments
- Self-assessment results
- Recommended next assessments

Resources Library
- Curated mental health articles
- Crisis resources

Mood Tracking
- Daily mood log
- Journal integration

Quick Access
- Emergency contacts
- Crisis resources
- Favorite features

Navigation Tips:
- Swipe left/right to see different sections
- Tap any card to expand details
- Use search for quick access to specific features', 'guide', 3, '{"dashboard", "mood_tracking", "resources"}', 4, '2024-01-15'),

('gs_privacy_info', 'getting_started', 'Privacy and Confidentiality Information', 'YOUR PRIVACY AND DATA SECURITY

What We Protect:
- Session Content: All conversations with support workers are encrypted
- Personal Data: Your information is stored securely
- Community Posts: Choose visibility (public/private) for each post
- Assessment Data: Results are visible only to you and your support worker

Your Control:
- Data Access: Download your data anytime from settings
- Account Deletion: Permanent deletion available upon request
- Sharing Controls: Choose what to share with support workers

Important Notes:
- Support workers maintain confidentiality with legal exceptions
- Anonymous usage data helps improve the app', 'guide', 4, '{"privacy", "settings", "community"}', 3, '2024-01-15'),

-- Features items
('feat_appointment_booking', 'features', 'Appointment Booking System', 'COMPLETE APPOINTMENT MANAGEMENT

Scheduling:
- Book Appointments: Browse available time slots with your support worker
- Session Types: Choose between video, audio, or chat sessions
- Reminders: Receive notifications before sessions

Management:
- Reschedule: Change appointment times in advance
- Cancel: Cancel appointments (24h notice required)
- Session History: View past sessions

Technical Requirements:
- Stable internet connection for video sessions
- Latest app version for optimal performance
- Allow notifications for appointment reminders', 'guide', 1, '{"appointments", "notifications", "calendar"}', 4, '2024-01-15'),

('feat_community_forum', 'features', 'Community Forum Features', 'ENGAGING WITH THE COMMUNITY

Post Types:
- Discussion Posts: Share experiences and ask questions
- Resource Shares: Post helpful articles or tools
- Support Requests: Ask for community support
- Success Stories: Share positive progress

Privacy Settings:
- Public Posts: Visible to all community members
- Private Posts: Only visible to your connections

Community Guidelines:
- Be respectful and supportive in all interactions
- No personal attacks or discriminatory language
- Respect different perspectives and experiences
- Maintain confidentiality - don''t share others'' stories', 'guide', 2, '{"community", "posts", "privacy"}', 3, '2024-01-15'),

('feat_secure_messaging', 'features', 'Secure Messaging with Support Workers', 'BETWEEN-SESSION COMMUNICATION

Message Types:
- Quick Questions: Brief clarifications between sessions
- Resource Sharing: Your support worker may share helpful materials
- Session Follow-ups: Additional thoughts after sessions

Response Times:
- General Inquiries: Within 24-48 hours
- Weekend Messages: Responses on next business day

Best Practices:
- Be clear and concise in your messages
- Respect your support worker''s boundaries and response times
- Keep important discussions for scheduled sessions', 'guide', 3, '{"messaging", "support_workers"}', 2, '2024-01-15'),

('feat_mood_journal', 'features', 'Mood Tracking & Journaling', 'TRACKING YOUR MENTAL WELLNESS

Mood Tracking:
- Daily Check-ins: Log your mood multiple times per day
- Mood Scale: Use our 1-10 scale or emoji-based system
- Pattern Recognition: View weekly/monthly mood trends

Journaling Features:
- Free Writing: Unlimited journal entries
- Prompts: Use guided prompts when you don''t know what to write
- Search: Find past entries by date or keywords

Sharing Options:
- Private: Keep entries completely private
- Share with Support Worker: Select specific entries to discuss', 'guide', 4, '{"mood_tracking", "journaling"}', 4, '2024-01-15'),

('feat_resources', 'features', 'Resources Library', 'ACCESSING HELPFUL RESOURCES

Resource Types:
- Articles: Mental health education and coping strategies
- Crisis Resources: Immediate help and emergency contacts
- Community Resources: Local mental health services

Organization:
- Categories: Anxiety, depression, relationships, self-care, etc.
- Favorites: Save resources for quick access

Personalization:
- Recommendations based on your interests and needs
- Recently viewed resources
- Progress-tracking for completed resources', 'guide', 5, '{"resources", "library", "favorites"}', 3, '2024-01-15'),

-- Account & Technical items
('tech_login_issues', 'account_technical', 'Login and Account Access Issues', 'TROUBLESHOOTING ACCOUNT ACCESS

Common Login Problems:
- Forgot Password: Use "Reset Password" on login screen
- Account Locked: After failed attempts, wait 30 minutes or contact support
- Email Not Recognized: Check for typos or use correct email associated with account

Solutions:
1. Password Reset:
   - Tap "Forgot Password" on login screen
   - Check your email for reset link (including spam folder)
   - Create a new strong password
   - Log in with new credentials

2. Account Recovery:
   - Contact support if you no longer have access to your email
   - Provide account verification information
   - Update your email and security settings

3. App-Specific Issues:
   - Clear app cache and data
   - Update to latest app version
   - Restart your device
   - Reinstall the app (your data is cloud-saved)', 'guide', 1, '{"login", "security", "account"}', 3, '2024-01-15'),

('tech_password_reset', 'account_technical', 'Password Reset and Security', 'MANAGING YOUR ACCOUNT SECURITY

Password Requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

Reset Process:
1. Initiate Reset: Tap "Forgot Password" on login screen
2. Email Verification: Check your inbox for reset instructions
3. Create New Password: Follow security requirements
4. Confirmation: You''ll receive confirmation of successful change

Security Best Practices:
- Use a unique password for this account
- Regularly update your password
- Don''t share your login credentials
- Log out from shared devices', 'guide', 2, '{"security", "password", "account"}', 2, '2024-01-15'),

('tech_profile_settings', 'account_technical', 'Profile and Settings Management', 'CUSTOMIZING YOUR EXPERIENCE

Profile Settings:
- Personal Information: Name, pronouns, contact details
- Privacy Settings: Control what information is visible
- Notification Preferences: Choose what alerts you receive

App Preferences:
- Theme: Light/dark mode selection
- Text Size: Adjust for better readability
- Data Usage: Control image quality and download settings

Account Management:
- Data Export: Download your personal data
- Account Deletion: Permanently remove your account
- Connected Devices: Manage active sessions', 'guide', 3, '{"profile", "settings", "preferences"}', 3, '2024-01-15'),

('tech_troubleshooting', 'account_technical', 'General Technical Troubleshooting', 'SOLVING COMMON TECHNICAL ISSUES

App Performance:
- Slow Performance: Close background apps, clear cache, restart device
- Crashes: Update to latest version, reinstall app

Connection Issues:
- No Internet: Check WiFi/mobile data, restart router
- Sync Problems: Pull down to refresh, check internet connection, log out/in

Audio/Video Problems:
- Poor Quality: Check internet speed, close other apps, use headphones
- No Sound: Check device volume, app permissions, mute settings
- Camera Issues: Grant camera permissions, clean lens, restart device

Update and Installation:
- Update Failed: Check storage space, stable internet
- Installation Issues: Ensure device compatibility, sufficient storage', 'guide', 4, '{"technical", "performance", "connectivity"}', 4, '2024-01-15'),

-- Safety & Privacy items
('safe_data_protection', 'safety_privacy', 'How Your Data is Protected', 'COMPREHENSIVE DATA SECURITY

Encryption Standards:
- End-to-End Encryption: All messages and sessions are encrypted
- Data at Rest: Personal information encrypted in our databases
- Secure Transmission: SSL/TLS encryption for all data transfers

Security Measures:
- Regular Audits: Third-party security assessments
- Access Controls: Strict role-based access for team members
- Monitoring: 24/7 security monitoring and threat detection
- Backups: Regular encrypted backups in secure locations

Your Rights:
- Data Access: Request a copy of all your personal data
- Correction: Update or correct inaccurate information
- Deletion: Request permanent deletion of your account and data
- Portability: Export your data in readable format', 'guide', 1, '{"privacy", "security", "data_protection"}', 3, '2024-01-15'),

('safe_community_guidelines', 'safety_privacy', 'Community Safety Guidelines', 'CREATING A SAFE COMMUNITY SPACE

Expected Behavior:
- Respect: Treat all members with dignity and respect
- Support: Offer encouragement and constructive feedback
- Inclusion: Welcome diverse perspectives and experiences
- Confidentiality: Don''t share others'' stories without permission

Prohibited Content:
- Harassment: No bullying, threats, or personal attacks
- Discrimination: No hate speech based on identity factors
- Misinformation: No promotion of harmful or false information
- Commercial Content: No advertising or promotional posts', 'guide', 2, '{"community", "safety"}', 2, '2024-01-15'),

('safe_confidentiality', 'safety_privacy', 'Understanding Confidentiality Limits', 'CONFIDENTIALITY AND LEGAL REQUIREMENTS

What is Confidential:
- Session Content: Discussions with your support worker
- Personal Information: Your identity and contact details
- Health Information: Assessment results and progress notes
- Private Messages: Communications with support workers

Legal Exceptions:
- Imminent Harm: Risk of serious harm to self or others
- Abuse Reports: Suspected child or vulnerable adult abuse
- Court Orders: Information required by legal subpoena
- Professional Standards: Ethical requirements for support workers

Your Awareness:
- Informed Consent: You acknowledge these limits when using the service
- Discussion: Your support worker will discuss confidentiality in first session
- Questions: Always ask if unsure about confidentiality of specific information
- Emergency Situations: Crisis support may involve additional safety protocols', 'guide', 3, '{"confidentiality", "legal", "safety"}', 3, '2024-01-15'),

-- FAQ items
('faq_support_questions', 'faqs', 'Common Questions About Support', 'FREQUENTLY ASKED SUPPORT QUESTIONS

Session Frequency:
Q: How often should I schedule sessions?
A: Most people start with weekly sessions, then adjust based on progress and needs. Your support worker can help determine the best frequency.

Support Worker Matching:
Q: What if I don''t feel comfortable with my support worker?
A: You can request a new support worker anytime through your profile settings. It''s important to have a good therapeutic relationship.

Session Preparation:
Q: How should I prepare for sessions?
A: Think about what you want to discuss, note any mood changes, and have questions ready. But it''s also okay to come without preparation.

Between Sessions:
Q: What should I do if I need help between sessions?
A: Use the messaging feature for non-urgent questions. For crises, use the emergency resources in the app.', 'faq', 1, '{"sessions", "support_workers"}', 3, '2024-01-15'),

('faq_app_functionality', 'faqs', 'App Functionality Questions', 'TECHNICAL AND FEATURE FAQS

Offline Usage:
Q: Can I use the app without internet?
A: No, all features require an active internet connection for security and real-time updates.

Data Backup:
Q: Is my data backed up and secure?
A: Yes, all your data is encrypted and regularly backed up on secure servers.

Multiple Devices:
Q: Can I use the app on multiple devices?
A: Yes, you can access your account from multiple devices. All data syncs automatically.

Notifications:
Q: Why am I not receiving notifications?
A: Check your device notification settings and in-app notification preferences. Ensure you have a stable internet connection.

Session Quality:
Q: What if I have technical issues during a session?
A: Use the in-call troubleshooting options or message your support worker. You can reschedule if technical issues persist.', 'faq', 2, '{"technical", "notifications", "sessions"}', 3, '2024-01-15'),

('faq_data_sharing', 'faqs', 'Data Sharing and Privacy FAQs', 'PRIVACY-RELATED QUESTIONS

Data Visibility:
Q: Who can see my mood tracking and journal entries?
A: Only you by default. You can choose to share specific entries with your support worker.

Community Privacy:
Q: Are my community posts anonymous?
A: You can choose to post with your profile visible or keep them private to your connections.

Support Worker Access:
Q: What can my support worker see about my app usage?
A: They can only see information you explicitly share and your appointment history.

Data Retention:
Q: How long is my data stored?
A: Your data is stored while your account is active. You can request deletion at any time.', 'faq', 3, '{"privacy", "data", "sharing"}', 3, '2024-01-15'),

('faq_account_management', 'faqs', 'Account Management FAQs', 'ACCOUNT QUESTIONS

Account Creation:
Q: Can I change my email address?
A: Yes, go to Profile → Edit Profile to update your email.

Data Export:
Q: Can I download my data?
A: Yes, use the Data Export feature in Settings → Privacy.

Multiple Accounts:
Q: Can I have multiple accounts?
A: No, each person should have their own account for proper support matching.

Account Deletion:
Q: What happens when I delete my account?
A: All your personal data is permanently deleted within 30 days.', 'faq', 4, '{"account", "data"}', 2, '2024-01-15'),

-- Contact items
('contact_email', 'contact', 'Email Support', 'CONTACTING SUPPORT VIA EMAIL

When to Email:
- Non-urgent technical issues
- Account questions
- Feature requests and feedback
- General inquiries about the service

Email Address:
safespace.dev.app@gmail.com

What to Include:
- Your username or account email
- Detailed description of your issue
- Screenshots if applicable
- Device and app version information
- Steps you''ve already tried

Response Time:
- General Inquiries: 24-48 hours
- Technical Issues: Within 24 hours
- Weekends: Responses on next business day', 'contact', 1, '{"support", "contact", "email"}', 2, '2024-01-15'),

('contact_response_times', 'contact', 'Response Time Expectations', 'SUPPORT RESPONSE TIMELINE

Priority Levels:

Urgent Technical Issues (App not working, login problems)
- Initial Response: 2-4 hours during business hours
- Resolution: Within 24 hours

General Support (Feature questions, account issues)
- Initial Response: 24-48 hours
- Resolution: 3-5 business days

Feature Requests & Feedback
- Acknowledgement: 48 hours
- Consideration: Included in monthly review

Business Hours:
- Monday-Friday: 9:00 AM - 6:00 PM (Your Local Time)
- Weekend messages processed on Monday
- Holidays may affect response times', 'contact', 2, '{"support", "response_times"}', 2, '2024-01-15')

ON CONFLICT (id) DO UPDATE SET
    section_id = EXCLUDED.section_id,
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    type = EXCLUDED.type,
    sort_order = EXCLUDED.sort_order,
    related_features = EXCLUDED.related_features,
    estimated_read_time = EXCLUDED.estimated_read_time,
    last_updated = EXCLUDED.last_updated,
    updated_at = CURRENT_TIMESTAMP;