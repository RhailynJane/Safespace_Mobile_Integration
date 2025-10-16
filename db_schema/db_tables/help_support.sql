-- Help sections table
CREATE TABLE help_sections (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Help items table
CREATE TABLE help_items (
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

-- Insert initial data
INSERT INTO help_sections (id, title, icon, sort_order) VALUES
('getting_started', '🌟 Getting Started', '🌟', 1),
('features', '📱 Features Help', '📱', 2),
('account_technical', '⚙️ Account & Technical Support', '⚙️', 3),
('safety_privacy', '🔒 Safety & Privacy', '🔒', 4),
('faqs', '❓ Frequently Asked Questions', '❓', 5),
('contact', '💬 Contact Support', '💬', 6);

INSERT INTO help_items (id, section_id, title, content, type, sort_order) VALUES
-- Getting Started items
('gs1', 'getting_started', 'How to create your profile', 'Go to Profile > Edit Profile to add your personal information and preferences. Complete information helps us provide better support.', 'guide', 1),
('gs2', 'getting_started', 'Setting up your first appointment', 'Navigate to Appointments > Book New Appointment. Choose your preferred support worker, date, and time. You''ll receive a confirmation with session details.', 'guide', 2),
('gs3', 'getting_started', 'Understanding your dashboard', 'Your dashboard shows upcoming appointments, assessments, resources, quick access to resources, mood tracking, journaling and crisis support.', 'guide', 3),
('gs4', 'getting_started', 'Privacy and confidentiality information', 'Your conversations with support workers are confidential. Community posts can be set to public or private as per your preference.', 'guide', 4),

-- Features Help items
('f1', 'features', 'Appointment Booking', 'Schedule: Tap "Book Appointment" and select your preferred time.\nReschedule: Go to "My Appointments" and tap "Reschedule".\nCancel: Cancel up to 24 hours before your appointment.', 'guide', 1),
('f2', 'features', 'Community Forum', 'Community Guidelines: Be respectful, supportive, and kind.\nPost Privacy: Choose between public or private visibility for your posts.\nSafe Sharing: Avoid sharing personal identifying information.', 'guide', 2),
('f3', 'features', 'Secure Messaging', 'Message your support worker securely between sessions. Response times are typically within 24-48 hours during business days.', 'guide', 3),
('f4', 'features', 'Mood Tracking & Journaling', 'Track your mood daily and maintain journal entries. You can choose to share your mood tracking and journaling insights with your support worker.', 'guide', 4),
('f5', 'features', 'Resources', 'Browse curated mental health resources, articles, and tools. Save helpful content to your favorites by tapping the heart icon. Access saved resources in your profile.', 'guide', 5),

-- FAQ items
('faq1', 'faqs', 'Common questions about support', 'Q: How often should I have sessions?\nA: Most people benefit from weekly sessions initially.\n\nQ: What if I don''t connect with my support worker?\nA: You can request a new support worker at any time through your profile settings.', 'faq', 1),
('faq2', 'faqs', 'App functionality questions', 'Q: Can I use the app offline?\nA: No, the app requires an internet connection for all features.\n\nQ: Is my data backed up?\nA: Yes, all data is securely backed up and synchronized across devices.', 'faq', 2);