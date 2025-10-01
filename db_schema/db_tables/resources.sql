-- =============================================
-- RESOURCES TABLE
-- =============================================
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    duration VARCHAR(50),
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255),
    image_emoji VARCHAR(10),
    background_color VARCHAR(20),
    tags TEXT[], -- PostgreSQL array
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_resource_type CHECK (type IN ('Affirmation', 'Quote', 'Article', 'Exercise', 'Guide'))
);

CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_type ON resources(type);

-- =============================================
-- BOOKMARKS TABLE
-- =============================================
CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_resource_bookmark UNIQUE (user_id, resource_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_resource_id ON bookmarks(resource_id);
CREATE INDEX idx_bookmarks_saved_at ON bookmarks(saved_at DESC);

-- =============================================
-- SAMPLE DATA - Run this to populate resources
-- =============================================
INSERT INTO resources (title, type, duration, category, content, author, image_emoji, background_color, tags) VALUES
-- Anxiety Articles
('Understanding Anxiety: A Complete Guide', 'Article', '15 mins', 'anxiety', 
'Anxiety is one of the most common mental health conditions, affecting millions worldwide. This comprehensive guide covers:

WHAT IS ANXIETY?
Anxiety is your body''s natural response to stress. It''s a feeling of fear or apprehension about what''s to come.

TYPES OF ANXIETY DISORDERS:
- Generalized Anxiety Disorder (GAD)
- Social Anxiety Disorder
- Panic Disorder
- Specific Phobias

SYMPTOMS:
Physical: Rapid heartbeat, sweating, trembling, shortness of breath
Psychological: Excessive worrying, restlessness, difficulty concentrating

TREATMENT OPTIONS:
1. Cognitive Behavioral Therapy (CBT)
2. Exposure Therapy
3. Medication (SSRIs)
4. Mindfulness and Meditation
5. Lifestyle Changes

COPING STRATEGIES:
- Practice deep breathing
- Challenge anxious thoughts
- Maintain regular sleep
- Exercise regularly
- Connect with support

Remember: Anxiety is treatable. With proper support, most people can lead fulfilling lives.',
'Dr. Sarah Chen', '🧠', '#E3F2FD', ARRAY['anxiety', 'education', 'mental-health']),

-- Depression Articles
('Depression: Recognition and Treatment', 'Article', '18 mins', 'depression',
'Depression is more than feeling sad. It''s a serious condition affecting how you feel, think, and handle daily activities.

SYMPTOMS:
Emotional: Persistent sadness, hopelessness, loss of interest
Physical: Fatigue, sleep changes, appetite changes, aches

TYPES:
- Major Depressive Disorder
- Persistent Depressive Disorder
- Seasonal Affective Disorder
- Postpartum Depression

EVIDENCE-BASED TREATMENTS:
1. Therapy (CBT, IPT, Behavioral Activation)
2. Medication (SSRIs, SNRIs)
3. Lifestyle (Exercise, nutrition, sleep)
4. Social connection

SELF-HELP:
- Schedule daily activities
- Practice gratitude
- Track your mood
- Stay connected
- Get sunlight

WHEN TO SEEK HELP:
If symptoms persist for 2+ weeks and interfere with daily life, seek professional support.

Recovery is possible. Treatment works.',
'Dr. Michael Rodriguez', '💙', '#FFF3E0', ARRAY['depression', 'treatment', 'hope']),

-- Stress Management
('Stress Management Techniques', 'Article', '12 mins', 'stress',
'Stress is inevitable, but chronic stress harms your health. Learn effective management techniques.

UNDERSTANDING STRESS:
Your body releases cortisol and adrenaline in response to threats. Chronic activation causes health issues.

QUICK RELIEF TECHNIQUES:
1. Deep breathing (4-7-8 technique)
2. Progressive muscle relaxation
3. Grounding exercises
4. Physical activity

LONG-TERM STRATEGIES:
- Time management
- Boundary setting
- Regular exercise
- Quality sleep
- Social support
- Mindfulness practice

LIFESTYLE FACTORS:
- Nutrition: Reduce caffeine, eat regular meals
- Sleep: 7-9 hours nightly
- Exercise: 30 minutes daily
- Hobbies: Schedule enjoyable activities

WHEN STRESS BECOMES OVERWHELMING:
Physical symptoms, constant worry, inability to relax, or impaired functioning require professional help.

Take action today for a healthier tomorrow.',
'Mental Health Foundation', '💧', '#E8F5E8', ARRAY['stress', 'management', 'wellness']),

-- Sleep Article
('Sleep Hygiene: Your Guide to Better Rest', 'Article', '14 mins', 'sleep',
'Quality sleep is foundational to mental health. This guide helps you improve your sleep.

WHY SLEEP MATTERS:
During sleep, your brain processes emotions, consolidates memories, and repairs itself. Poor sleep increases depression/anxiety risk by 40%.

SLEEP HYGIENE BASICS:
1. Consistent schedule (same bedtime/wake time)
2. Cool, dark bedroom (65-68°F)
3. No screens 1 hour before bed
4. No caffeine after 2 PM
5. Regular exercise (not before bed)
6. Relaxing bedtime routine

COMMON SLEEP DISRUPTORS:
- Irregular schedule
- Caffeine/alcohol
- Screen time
- Stress/worry
- Poor sleep environment

TECHNIQUES FOR FALLING ASLEEP:
- 4-7-8 breathing
- Progressive relaxation
- Visualization
- White noise
- Reading

WHEN TO SEEK HELP:
Chronic insomnia (3+ nights/week for 3+ months), sleep apnea symptoms, or sleep affecting daily function.

Prioritize sleep for better mental health.',
'National Sleep Foundation', '🛏️', '#F3E5F5', ARRAY['sleep', 'health', 'recovery']),

-- Exercises
('Box Breathing for Anxiety', 'Exercise', '5 mins', 'anxiety',
'Box breathing is used by Navy SEALs to manage stress.

HOW TO PRACTICE:
1. Breathe in through nose - 4 counts
2. Hold breath - 4 counts
3. Breathe out through mouth - 4 counts
4. Hold empty - 4 counts
5. Repeat 4-5 times

WHY IT WORKS:
Activates parasympathetic nervous system, reducing stress hormones and promoting calm.

WHEN TO USE:
- Before stressful situations
- During panic/anxiety
- Before bed
- Anytime you need calm

TIPS:
- Start with shorter counts if needed
- Practice daily for best results
- Use in combination with grounding
- Breathe from diaphragm

Make this a daily habit for 2 weeks and notice the difference.',
NULL, '🧘‍♀️', '#E3F2FD', ARRAY['breathing', 'anxiety', 'exercise']),

('5-4-3-2-1 Grounding Technique', 'Exercise', '3 mins', 'anxiety',
'This sensory grounding exercise brings you back to the present moment.

THE TECHNIQUE:
5 - Name 5 things you can SEE
4 - Name 4 things you can TOUCH
3 - Name 3 things you can HEAR
2 - Name 2 things you can SMELL
1 - Name 1 thing you can TASTE

WHY IT WORKS:
Engages all senses, interrupting anxious thoughts and grounding you in reality.

WHEN TO USE:
- Panic attacks
- Overwhelming anxiety
- Dissociation
- Racing thoughts

PRACTICE:
Do this slowly. Really notice each sensation. Describe details.

Keep this tool ready for moments of high anxiety.',
NULL, '🌟', '#E3F2FD', ARRAY['grounding', 'anxiety', 'mindfulness']);

