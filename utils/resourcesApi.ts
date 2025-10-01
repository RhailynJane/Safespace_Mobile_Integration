/**
 * Resources API Service - 100% Offline Version
 * No external API calls - all content stored locally
 */

export interface Resource {
  id: string;
  title: string;
  type: 'Affirmation' | 'Quote' | 'Article' | 'Exercise' | 'Guide';
  duration: string;
  category: string;
  content: string;
  author?: string;
  image: string;
  backgroundColor: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  tags: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'stress',
    name: 'Stress',
    icon: '💧',
    color: '#FF8A65',
    tags: ['peace', 'calm', 'relaxation', 'mindfulness']
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    icon: '🧠',
    color: '#81C784',
    tags: ['courage', 'strength', 'confidence']
  },
  {
    id: 'depression',
    name: 'Depression',
    icon: '👥',
    color: '#64B5F6',
    tags: ['happiness', 'hope', 'joy', 'optimism']
  },
  {
    id: 'sleep',
    name: 'Sleep',
    icon: '🛏️',
    color: '#4DD0E1',
    tags: ['peace', 'rest', 'calm']
  },
  {
    id: 'motivation',
    name: 'Motivation',
    icon: '⚡',
    color: '#FFB74D',
    tags: ['success', 'motivation', 'inspiration']
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    icon: '🧘',
    color: '#BA68C8',
    tags: ['mindfulness', 'meditation', 'present']
  }
];

// Complete offline resource database
const ALL_RESOURCES: Resource[] = [
  // Stress Management Resources
  {
    id: 'stress-1',
    title: 'Box Breathing Technique',
    type: 'Exercise',
    duration: '5 mins',
    category: 'stress',
    content: 'Box breathing is a powerful stress-relief technique used by Navy SEALs. Breathe in for 4 counts, hold for 4 counts, breathe out for 4 counts, hold for 4 counts. Repeat for 5 minutes. This activates your parasympathetic nervous system, reducing stress hormones and promoting calm.',
    image: '🧘‍♀️',
    backgroundColor: '#E8F5E8',
    tags: ['breathing', 'relaxation', 'stress-relief']
  },
  {
    id: 'stress-2',
    title: 'Progressive Muscle Relaxation',
    type: 'Exercise',
    duration: '12 mins',
    category: 'stress',
    content: 'Starting with your toes, tense each muscle group for 5 seconds, then release. Move up through your body: feet, calves, thighs, abdomen, chest, hands, arms, shoulders, neck, and face. Notice the difference between tension and relaxation. This releases physical stress and promotes body awareness.',
    image: '💪',
    backgroundColor: '#E8F5E8',
    tags: ['relaxation', 'body-scan', 'tension-relief']
  },
  {
    id: 'stress-3',
    title: 'Understanding Stress Response',
    type: 'Article',
    duration: '8 mins',
    category: 'stress',
    content: 'Stress is your body\'s natural response to challenges. When you face a stressor, your body releases cortisol and adrenaline. While helpful in short bursts, chronic stress can harm your health. Learning to recognize your stress triggers and having healthy coping strategies is key to managing stress effectively.',
    author: 'Mental Health Foundation',
    image: '📚',
    backgroundColor: '#E8F5E8',
    tags: ['education', 'stress', 'biology']
  },

  // Anxiety Resources
  {
    id: 'anxiety-1',
    title: '5-4-3-2-1 Grounding Technique',
    type: 'Exercise',
    duration: '3 mins',
    category: 'anxiety',
    content: 'When anxiety strikes, ground yourself in the present moment. Identify: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste. This sensory exercise interrupts anxious thoughts and brings you back to the present.',
    image: '🧠',
    backgroundColor: '#E3F2FD',
    tags: ['grounding', 'anxiety-relief', 'mindfulness']
  },
  {
    id: 'anxiety-2',
    title: 'Understanding Anxiety',
    type: 'Article',
    duration: '10 mins',
    category: 'anxiety',
    content: 'Anxiety is excessive worry about future events. It\'s one of the most common mental health conditions. Symptoms include racing thoughts, rapid heartbeat, and restlessness. Remember: anxiety is treatable. Techniques like CBT, mindfulness, and proper breathing can significantly reduce symptoms. You\'re not alone in this.',
    author: 'Anxiety and Depression Association',
    image: '💡',
    backgroundColor: '#E3F2FD',
    tags: ['education', 'anxiety', 'awareness']
  },
  {
    id: 'anxiety-3',
    title: 'Worry Time Technique',
    type: 'Guide',
    duration: '6 mins',
    category: 'anxiety',
    content: 'Schedule 15 minutes daily as "worry time." When anxious thoughts arise outside this time, write them down and save them for your worry period. During worry time, address each concern. This technique helps contain anxiety and prevents it from consuming your entire day.',
    image: '⏰',
    backgroundColor: '#E3F2FD',
    tags: ['anxiety', 'coping', 'scheduling']
  },

  // Depression Resources
  {
    id: 'depression-1',
    title: 'Three Good Things Practice',
    type: 'Exercise',
    duration: '5 mins',
    category: 'depression',
    content: 'Each evening, write down three good things that happened today, no matter how small: a warm cup of coffee, a friend\'s smile, finishing a task. Research shows this simple practice can significantly improve mood and reduce depressive symptoms over 6 weeks. Start tonight.',
    image: '📝',
    backgroundColor: '#FFF3E0',
    tags: ['gratitude', 'positivity', 'journaling']
  },
  {
    id: 'depression-2',
    title: 'Behavioral Activation',
    type: 'Article',
    duration: '10 mins',
    category: 'depression',
    content: 'Depression makes you want to withdraw, but isolation worsens symptoms. Behavioral activation is a proven treatment: schedule small, meaningful activities daily, even when you don\'t feel like it. Start with 10-minute activities: a short walk, calling a friend, or listening to music. Action creates motivation, not the other way around.',
    author: 'Dr. Sarah Mitchell',
    image: '🎯',
    backgroundColor: '#FFF3E0',
    tags: ['depression', 'activation', 'treatment']
  },
  {
    id: 'depression-3',
    title: 'Daily Mood Tracking',
    type: 'Guide',
    duration: '7 mins',
    category: 'depression',
    content: 'Track your mood daily using a 1-10 scale. Note what you did that day, who you saw, and what you ate. Over time, you\'ll identify patterns: activities that boost your mood and triggers that lower it. This data helps you make informed decisions about your daily routine and self-care.',
    image: '📊',
    backgroundColor: '#FFF3E0',
    tags: ['mood-tracking', 'awareness', 'data']
  },

  // Sleep Resources
  {
    id: 'sleep-1',
    title: 'Sleep Hygiene Fundamentals',
    type: 'Guide',
    duration: '10 mins',
    category: 'sleep',
    content: 'Good sleep hygiene includes: consistent sleep schedule (same bedtime/wake time daily), cool dark bedroom (65-68°F), no screens 1 hour before bed, no caffeine after 2 PM, regular exercise (but not before bed), and a relaxing bedtime routine. Quality sleep is foundational to mental health.',
    image: '🛏️',
    backgroundColor: '#F3E5F5',
    tags: ['sleep', 'routine', 'wellness']
  },
  {
    id: 'sleep-2',
    title: '4-7-8 Sleep Breathing',
    type: 'Exercise',
    duration: '4 mins',
    category: 'sleep',
    content: 'Developed by Dr. Andrew Weil, this technique helps you fall asleep faster. Breathe in through your nose for 4 counts, hold for 7 counts, exhale through your mouth for 8 counts. The long exhale activates your relaxation response. Repeat 4 cycles. Practice nightly for best results.',
    image: '😴',
    backgroundColor: '#F3E5F5',
    tags: ['breathing', 'sleep', 'relaxation']
  },
  {
    id: 'sleep-3',
    title: 'Understanding Sleep and Mental Health',
    type: 'Article',
    duration: '9 mins',
    category: 'sleep',
    content: 'Sleep and mental health are bidirectional: poor sleep worsens mental health, and mental health issues disrupt sleep. During sleep, your brain processes emotions and consolidates memories. Adults need 7-9 hours nightly. Chronic sleep deprivation increases risk of depression and anxiety by 40%.',
    author: 'National Sleep Foundation',
    image: '🌙',
    backgroundColor: '#F3E5F5',
    tags: ['sleep', 'mental-health', 'research']
  },

  // Motivation Resources
  {
    id: 'motivation-1',
    title: 'Morning Affirmations',
    type: 'Affirmation',
    duration: '3 mins',
    category: 'motivation',
    content: 'Start each morning with these affirmations: "I am capable of handling today\'s challenges. I deserve happiness and peace. I am growing stronger every day. I choose to focus on what I can control. I am worthy of good things." Say them aloud while looking in a mirror for maximum impact.',
    image: '☀️',
    backgroundColor: '#FFF9C4',
    tags: ['affirmations', 'morning', 'positivity']
  },
  {
    id: 'motivation-2',
    title: 'Micro-Goals Strategy',
    type: 'Guide',
    duration: '8 mins',
    category: 'motivation',
    content: 'Break large goals into tiny, achievable steps. Instead of "exercise more," try "put on workout clothes" or "walk for 5 minutes." Completing micro-goals releases dopamine, building momentum. Chain these small wins together. Progress, not perfection, is the goal.',
    image: '🎯',
    backgroundColor: '#FFF9C4',
    tags: ['goals', 'motivation', 'progress']
  },
  {
    id: 'motivation-3',
    title: 'The Power of Yet',
    type: 'Article',
    duration: '6 mins',
    category: 'motivation',
    content: 'Add "yet" to negative self-talk. "I can\'t do this... yet." "I don\'t understand... yet." This simple word shift changes your mindset from fixed to growth-oriented. It acknowledges current limitations while emphasizing future potential. Your brain is capable of remarkable growth and change.',
    author: 'Carol Dweck',
    image: '🌱',
    backgroundColor: '#FFF9C4',
    tags: ['mindset', 'growth', 'psychology']
  },

  // Mindfulness Resources
  {
    id: 'mindfulness-1',
    title: 'Body Scan Meditation',
    type: 'Exercise',
    duration: '15 mins',
    category: 'mindfulness',
    content: 'Lie down comfortably. Starting with your toes, bring gentle awareness to each body part. Notice sensations without judgment: warmth, tingling, tension, relaxation. Slowly move up through feet, legs, torso, arms, and head. If your mind wanders, gently return to the body. This cultivates present-moment awareness.',
    image: '🧘',
    backgroundColor: '#E0F2F1',
    tags: ['meditation', 'body-scan', 'awareness']
  },
  {
    id: 'mindfulness-2',
    title: 'Mindful Walking',
    type: 'Exercise',
    duration: '10 mins',
    category: 'mindfulness',
    content: 'Walk slowly, focusing on each step. Notice how your heel touches the ground, weight shifts forward, toes push off. Feel the air on your skin, hear sounds around you, observe what you see. When thoughts arise, acknowledge them and return to the sensation of walking. This is meditation in motion.',
    image: '🚶',
    backgroundColor: '#E0F2F1',
    tags: ['walking', 'meditation', 'mindfulness']
  },
  {
    id: 'mindfulness-3',
    title: 'Mindful Eating Practice',
    type: 'Guide',
    duration: '12 mins',
    category: 'mindfulness',
    content: 'Choose one meal to eat mindfully. Remove distractions. Look at your food, notice colors and textures. Smell it. Take a small bite, chew slowly, notice flavors and sensations. Put your utensil down between bites. This practice improves your relationship with food and teaches you to be present.',
    image: '🍎',
    backgroundColor: '#E0F2F1',
    tags: ['eating', 'mindfulness', 'awareness']
  },

  // Inspirational Quotes
  {
    id: 'quote-1',
    title: 'On Inner Strength',
    type: 'Quote',
    duration: '1 min',
    category: 'anxiety',
    content: 'You are braver than you believe, stronger than you seem, and smarter than you think.',
    author: 'A.A. Milne',
    image: '💪',
    backgroundColor: '#E3F2FD',
    tags: ['strength', 'courage', 'self-belief']
  },
  {
    id: 'quote-2',
    title: 'On Change',
    type: 'Quote',
    duration: '1 min',
    category: 'motivation',
    content: 'The only way to make sense out of change is to plunge into it, move with it, and join the dance.',
    author: 'Alan Watts',
    image: '🌊',
    backgroundColor: '#FFF9C4',
    tags: ['change', 'adaptation', 'growth']
  },
  {
    id: 'quote-3',
    title: 'On Present Moment',
    type: 'Quote',
    duration: '1 min',
    category: 'mindfulness',
    content: 'The present moment is the only time over which we have dominion.',
    author: 'Thích Nhất Hạnh',
    image: '🧘',
    backgroundColor: '#E0F2F1',
    tags: ['present', 'mindfulness', 'awareness']
  },
  {
    id: 'quote-4',
    title: 'On Perseverance',
    type: 'Quote',
    duration: '1 min',
    category: 'depression',
    content: 'Even the darkest night will end and the sun will rise.',
    author: 'Victor Hugo',
    image: '🌅',
    backgroundColor: '#FFF3E0',
    tags: ['hope', 'perseverance', 'optimism']
  },
  {
    id: 'quote-5',
    title: 'On Self-Compassion',
    type: 'Quote',
    duration: '1 min',
    category: 'stress',
    content: 'Talk to yourself like you would to someone you love.',
    author: 'Brené Brown',
    image: '💝',
    backgroundColor: '#E8F5E8',
    tags: ['self-compassion', 'kindness', 'self-talk']
  },
  {
    id: 'quote-6',
    title: 'On Progress',
    type: 'Quote',
    duration: '1 min',
    category: 'motivation',
    content: 'Progress is not achieved by luck or accident, but by working on yourself daily.',
    author: 'Epictetus',
    image: '📈',
    backgroundColor: '#FFF9C4',
    tags: ['progress', 'consistency', 'growth']
  }
];

// Simulate async delay for realistic feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch all resources - No API calls, instant response
 */
export async function fetchAllResources(): Promise<Resource[]> {
  await delay(300); // Small delay for realistic loading feel
  return [...ALL_RESOURCES];
}

/**
 * Fetch resources by category
 */
export async function fetchResourcesByCategory(categoryId: string): Promise<Resource[]> {
  await delay(200);
  return ALL_RESOURCES.filter(resource => resource.category === categoryId);
}

/**
 * Search resources locally
 */
export async function searchResources(query: string): Promise<Resource[]> {
  await delay(150);
  const lowerQuery = query.toLowerCase();
  
  return ALL_RESOURCES.filter(resource =>
    resource.title.toLowerCase().includes(lowerQuery) ||
    resource.content.toLowerCase().includes(lowerQuery) ||
    resource.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get quote of the day - date-based selection
 */
export async function getQuoteOfTheDay(): Promise<Resource | null> {
  await delay(100);
  
  // Use day of year for consistent daily quote
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const quotes = ALL_RESOURCES.filter(r => r.type === 'Quote');
  return quotes.length > 0 ? quotes[dayOfYear % quotes.length] ?? null : null;
}