-- Community Forum Tables

-- Categories table
CREATE TABLE IF NOT EXISTS community_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category_id INTEGER REFERENCES community_categories(id),
  author_id VARCHAR(255) REFERENCES users(clerk_user_id) ON DELETE CASCADE,
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
  user_id VARCHAR(255) REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id, emoji)
);

-- Post bookmarks table
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(clerk_user_id) ON DELETE CASCADE,
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

-- Insert sample posts for development
INSERT INTO community_posts (title, content, category_id, author_id, reaction_count) VALUES
  ('Struggling with Sleep Due to Stress?', 'Lately, stress has really been affecting my sleep...', 2, 'demo_user', 45),
  ('Dealing with Anxiety Lately?', 'I''ve been feeling more anxious than usual...', 3, 'demo_user', 65),
  ('Little Wins & Mental Health Tips', 'Hey everyone! Just wanted to share a few small things...', 4, 'demo_user', 150)
ON CONFLICT DO NOTHING;