-- Community Forum Tables

-- Categories table
CREATE TABLE IF NOT EXISTS community_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community posts table - Updated to handle missing users gracefully
CREATE TABLE IF NOT EXISTS community_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category_id INTEGER REFERENCES community_categories(id),
  author_id VARCHAR(255), -- Remove foreign key constraint for now
  author_name VARCHAR(255), -- Store author name directly
  is_private BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT FALSE,
  reaction_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post reactions table
CREATE TABLE IF NOT EXISTS post_reactions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- Store clerk_user_id directly
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id, emoji)
);

-- Post bookmarks table
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- Store clerk_user_id directly
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- Insert default categories
INSERT INTO community_categories (name, description) VALUES 
  ('Trending', 'Currently popular posts'),
  ('Stress', 'Discussions about stress management'),
  ('Support', 'Emotional support and encouragement'),
  ('Stories', 'Personal experiences and stories'),
  ('Self Care', 'Self-care tips and techniques'),
  ('Mindfulness', 'Mindfulness and meditation'),
  ('Creative', 'Creative expression and art'),
  ('Therapy', 'Therapy discussions and advice'),
  ('Affirmation', 'Positive affirmations'),
  ('Awareness', 'Mental health awareness')
ON CONFLICT (name) DO NOTHING;

-- Insert sample posts for development (using demo data)
INSERT INTO community_posts (title, content, category_id, author_id, author_name, reaction_count) VALUES
  ('Struggling with Sleep Due to Stress?', 'Lately, stress has really been affecting my sleep – either I can''t fall asleep or I wake up feeling exhausted.

Just wondering... how do you all cope with this?
Any tips or routines that help you sleep better during stressful times?

Would love to hear what works for you. 😊', 
  2, 'user_1', 'Sarah M.', 45),

  ('Dealing with Anxiety Lately?', 'I''ve been feeling more anxious than usual – overthinking, tight chest, hard to focus. It sneaks in even when things seem okay. 😊

Just checking in... how do you manage your anxiety day-to-day?
Breathing exercises, journaling, talking to someone?

Open to any ideas or even just sharing how you feel.
You''re not alone. 😊', 
  3, 'user_2', 'Michael T.', 65),

  ('Little Wins & Mental Health Tips', 'Hey everyone! Just wanted to share a few small things that helped my mental health lately:
- Taking a short walk without my phone 🟧
- Saying no without feeling guilty
- Writing down 3 things I''m grateful for before bed

Feel free to drop your own tips or wins-big or small.', 
  4, 'user_3', 'John L.', 150)
ON CONFLICT DO NOTHING;