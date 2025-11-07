/**
 * Seed Resources Script (TypeScript)
 * 
 * Populates Convex resources table from ALL_RESOURCES static data
 * 
 * Usage:
 * npx tsx scripts/seed-resources.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Complete resources data from utils/resourcesApi.ts
const ALL_RESOURCES = [
  // Stress Management Resources
  {
    title: 'Box Breathing Technique',
    type: 'Exercise',
    duration: '5 mins',
    category: 'stress',
    content: 'Box breathing is a powerful stress-relief technique used by Navy SEALs. Breathe in for 4 counts, hold for 4 counts, breathe out for 4 counts, hold for 4 counts. Repeat for 5 minutes. This activates your parasympathetic nervous system, reducing stress hormones and promoting calm.',
    imageEmoji: '🧘‍♀️',
    backgroundColor: '#E8F5E8',
    tags: ['breathing', 'relaxation', 'stress-relief']
  },
  {
    title: 'Progressive Muscle Relaxation',
    type: 'Exercise',
    duration: '12 mins',
    category: 'stress',
    content: 'Starting with your toes, tense each muscle group for 5 seconds, then release. Move up through your body: feet, calves, thighs, abdomen, chest, hands, arms, shoulders, neck, and face. Notice the difference between tension and relaxation. This releases physical stress and promotes body awareness.',
    imageEmoji: '💪',
    backgroundColor: '#E8F5E8',
    tags: ['relaxation', 'body-scan', 'tension-relief']
  },
  {
    title: 'Understanding Stress Response',
    type: 'Article',
    duration: '8 mins',
    category: 'stress',
    content: 'Stress is your body\'s natural response to challenges. When you face a stressor, your body releases cortisol and adrenaline. While helpful in short bursts, chronic stress can harm your health. Learning to recognize your stress triggers and having healthy coping strategies is key to managing stress effectively.',
    author: 'Mental Health Foundation',
    imageEmoji: '📚',
    backgroundColor: '#E8F5E8',
    tags: ['education', 'stress', 'biology']
  },

  // Anxiety Resources
  {
    title: '5-4-3-2-1 Grounding Technique',
    type: 'Exercise',
    duration: '3 mins',
    category: 'anxiety',
    content: 'When anxiety strikes, ground yourself in the present moment. Identify: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste. This sensory exercise interrupts anxious thoughts and brings you back to the present.',
    imageEmoji: '🧠',
    backgroundColor: '#E3F2FD',
    tags: ['grounding', 'anxiety-relief', 'mindfulness']
  },
  {
    title: 'Understanding Anxiety',
    type: 'Article',
    duration: '10 mins',
    category: 'anxiety',
    content: 'Anxiety is excessive worry about future events. It\'s one of the most common mental health conditions. Symptoms include racing thoughts, rapid heartbeat, and restlessness. Remember: anxiety is treatable. Techniques like CBT, mindfulness, and proper breathing can significantly reduce symptoms. You\'re not alone in this.',
    author: 'Anxiety and Depression Association',
    imageEmoji: '💡',
    backgroundColor: '#E3F2FD',
    tags: ['education', 'anxiety', 'awareness']
  },
  {
    title: 'Worry Time Technique',
    type: 'Guide',
    duration: '6 mins',
    category: 'anxiety',
    content: 'Schedule 15 minutes daily as "worry time." When anxious thoughts arise outside this time, write them down and save them for your worry period. During worry time, address each concern. This technique helps contain anxiety and prevents it from consuming your entire day.',
    imageEmoji: '⏰',
    backgroundColor: '#E3F2FD',
    tags: ['anxiety', 'coping', 'scheduling']
  },

  // Depression Resources
  {
    title: 'Three Good Things Practice',
    type: 'Exercise',
    duration: '5 mins',
    category: 'depression',
    content: 'Each evening, write down three good things that happened today, no matter how small: a warm cup of coffee, a friend\'s smile, finishing a task. Research shows this simple practice can significantly improve mood and reduce depressive symptoms over 6 weeks. Start tonight.',
    imageEmoji: '📝',
    backgroundColor: '#FFF3E0',
    tags: ['gratitude', 'positivity', 'journaling']
  },
  {
    title: 'Behavioral Activation',
    type: 'Article',
    duration: '10 mins',
    category: 'depression',
    content: 'Depression makes you want to withdraw, but isolation worsens symptoms. Behavioral activation is a proven treatment: schedule small, meaningful activities daily, even when you don\'t feel like it. Start with 10-minute activities: a short walk, calling a friend, or listening to music. Action creates motivation, not the other way around.',
    author: 'Dr. Sarah Mitchell',
    imageEmoji: '🎯',
    backgroundColor: '#FFF3E0',
    tags: ['depression', 'activation', 'treatment']
  },
  {
    title: 'Daily Mood Tracking',
    type: 'Guide',
    duration: '7 mins',
    category: 'depression',
    content: 'Track your mood daily using a 1-10 scale. Note what you did that day, who you saw, and what you ate. Over time, you\'ll identify patterns: activities that boost your mood and triggers that lower it. This data helps you make informed decisions about your daily routine and self-care.',
    imageEmoji: '📊',
    backgroundColor: '#FFF3E0',
    tags: ['mood-tracking', 'awareness', 'data']
  },

  // Sleep Resources
  {
    title: 'Sleep Hygiene Fundamentals',
    type: 'Guide',
    duration: '10 mins',
    category: 'sleep',
    content: 'Good sleep hygiene includes: consistent sleep schedule (same bedtime/wake time daily), cool dark bedroom (65-68°F), no screens 1 hour before bed, no caffeine after 2 PM, regular exercise (but not before bed), and a relaxing bedtime routine. Quality sleep is foundational to mental health.',
    imageEmoji: '🛏️',
    backgroundColor: '#F3E5F5',
    tags: ['sleep', 'routine', 'wellness']
  },
  {
    title: '4-7-8 Sleep Breathing',
    type: 'Exercise',
    duration: '4 mins',
    category: 'sleep',
    content: 'Developed by Dr. Andrew Weil, this technique helps you fall asleep faster. Breathe in through your nose for 4 counts, hold for 7 counts, exhale through your mouth for 8 counts. The long exhale activates your relaxation response. Repeat 4 cycles. Practice nightly for best results.',
    imageEmoji: '😴',
    backgroundColor: '#F3E5F5',
    tags: ['breathing', 'sleep', 'relaxation']
  },
  {
    title: 'Understanding Sleep and Mental Health',
    type: 'Article',
    duration: '9 mins',
    category: 'sleep',
    content: 'Sleep and mental health are bidirectional: poor sleep worsens mental health, and mental health issues disrupt sleep. During sleep, your brain processes emotions and consolidates memories. Adults need 7-9 hours nightly. Chronic sleep deprivation increases risk of depression and anxiety by 40%.',
    author: 'National Sleep Foundation',
    imageEmoji: '🌙',
    backgroundColor: '#F3E5F5',
    tags: ['sleep', 'mental-health', 'research']
  },

  // Motivation Resources
  {
    title: 'Morning Affirmations',
    type: 'Affirmation',
    duration: '3 mins',
    category: 'motivation',
    content: 'Start each morning with these affirmations: "I am capable of handling today\'s challenges. I deserve happiness and peace. I am growing stronger every day. I choose to focus on what I can control. I am worthy of good things." Say them aloud while looking in a mirror for maximum impact.',
    imageEmoji: '☀️',
    backgroundColor: '#FFF9C4',
    tags: ['affirmations', 'morning', 'positivity']
  },
  {
    title: 'Micro-Goals Strategy',
    type: 'Guide',
    duration: '8 mins',
    category: 'motivation',
    content: 'Break large goals into tiny, achievable steps. Instead of "exercise more," try "put on workout clothes" or "walk for 5 minutes." Completing micro-goals releases dopamine, building momentum. Chain these small wins together. Progress, not perfection, is the goal.',
    imageEmoji: '🎯',
    backgroundColor: '#FFF9C4',
    tags: ['goals', 'motivation', 'progress']
  },
  {
    title: 'The Power of Yet',
    type: 'Article',
    duration: '6 mins',
    category: 'motivation',
    content: 'Add "yet" to negative self-talk. "I can\'t do this... yet." "I don\'t understand... yet." This simple word shift changes your mindset from fixed to growth-oriented. It acknowledges current limitations while emphasizing future potential. Your brain is capable of remarkable growth and change.',
    author: 'Carol Dweck',
    imageEmoji: '🌱',
    backgroundColor: '#FFF9C4',
    tags: ['mindset', 'growth', 'psychology']
  },

  // Mindfulness Resources
  {
    title: 'Body Scan Meditation',
    type: 'Exercise',
    duration: '15 mins',
    category: 'mindfulness',
    content: 'Lie down comfortably. Starting with your toes, bring gentle awareness to each body part. Notice sensations without judgment: warmth, tingling, tension, relaxation. Slowly move up through feet, legs, torso, arms, and head. If your mind wanders, gently return to the body. This cultivates present-moment awareness.',
    imageEmoji: '🧘',
    backgroundColor: '#E0F2F1',
    tags: ['meditation', 'body-scan', 'awareness']
  },
  {
    title: 'Mindful Walking',
    type: 'Exercise',
    duration: '10 mins',
    category: 'mindfulness',
    content: 'Walk slowly, focusing on each step. Notice how your heel touches the ground, weight shifts forward, toes push off. Feel the air on your skin, hear sounds around you, observe what you see. When thoughts arise, acknowledge them and return to the sensation of walking. This is meditation in motion.',
    imageEmoji: '🚶',
    backgroundColor: '#E0F2F1',
    tags: ['walking', 'meditation', 'mindfulness']
  },
  {
    title: 'Mindful Eating Practice',
    type: 'Guide',
    duration: '12 mins',
    category: 'mindfulness',
    content: 'Choose one meal to eat mindfully. Remove distractions. Look at your food, notice colors and textures. Smell it. Take a small bite, chew slowly, notice flavors and sensations. Put your utensil down between bites. This practice improves your relationship with food and teaches you to be present.',
    imageEmoji: '�',
    backgroundColor: '#E0F2F1',
    tags: ['eating', 'mindfulness', 'awareness']
  },

  // Inspirational Quotes
  {
    title: 'On Inner Strength',
    type: 'Quote',
    duration: '1 min',
    category: 'anxiety',
    content: 'You are braver than you believe, stronger than you seem, and smarter than you think.',
    author: 'A.A. Milne',
    imageEmoji: '💪',
    backgroundColor: '#E3F2FD',
    tags: ['strength', 'courage', 'self-belief']
  },
  {
    title: 'On Change',
    type: 'Quote',
    duration: '1 min',
    category: 'motivation',
    content: 'The only way to make sense out of change is to plunge into it, move with it, and join the dance.',
    author: 'Alan Watts',
    imageEmoji: '🌊',
    backgroundColor: '#FFF9C4',
    tags: ['change', 'adaptation', 'growth']
  },
  {
    title: 'On Present Moment',
    type: 'Quote',
    duration: '1 min',
    category: 'mindfulness',
    content: 'The present moment is the only time over which we have dominion.',
    author: 'Thích Nhất Hạnh',
    imageEmoji: '🧘',
    backgroundColor: '#E0F2F1',
    tags: ['present', 'mindfulness', 'awareness']
  },
  {
    title: 'On Perseverance',
    type: 'Quote',
    duration: '1 min',
    category: 'depression',
    content: 'Even the darkest night will end and the sun will rise.',
    author: 'Victor Hugo',
    imageEmoji: '🌅',
    backgroundColor: '#FFF3E0',
    tags: ['hope', 'perseverance', 'optimism']
  },
  {
    title: 'On Self-Compassion',
    type: 'Quote',
    duration: '1 min',
    category: 'stress',
    content: 'Talk to yourself like you would to someone you love.',
    author: 'Brené Brown',
    imageEmoji: '💝',
    backgroundColor: '#E8F5E8',
    tags: ['self-compassion', 'kindness', 'self-talk']
  },
  {
    title: 'On Progress',
    type: 'Quote',
    duration: '1 min',
    category: 'motivation',
    content: 'Progress is not achieved by luck or accident, but by working on yourself daily.',
    author: 'Epictetus',
    imageEmoji: '�',
    backgroundColor: '#FFF9C4',
    tags: ['progress', 'consistency', 'growth']
  }
];

async function seedResources() {
  console.log('🌱 Starting resources seed...');
  console.log(`📊 Total resources to seed: ${ALL_RESOURCES.length}`);
  
  const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  
  if (!CONVEX_URL) {
    console.error('❌ Error: CONVEX_URL environment variable not set');
    console.error('Set it in .env.local as NEXT_PUBLIC_CONVEX_URL');
    process.exit(1);
  }
  
  const client = new ConvexHttpClient(CONVEX_URL);
  
  try {
    // Seed in batches of 50
    const BATCH_SIZE = 50;
    let totalSeeded = 0;
    
    for (let i = 0; i < ALL_RESOURCES.length; i += BATCH_SIZE) {
      const batch = ALL_RESOURCES.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Seeding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ALL_RESOURCES.length / BATCH_SIZE)} (${batch.length} resources)...`);
      
      const result: any = await client.mutation(api.resources.seedResources, {
        resources: batch,
      });
      
      totalSeeded += result.count;
      console.log(`✅ Successfully seeded ${result.count} resources`);
    }
    
    console.log(`\n🎉 Seed complete! Total resources seeded: ${totalSeeded}`);
    console.log('✨ Your Convex resources table is now populated!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the app to see resources loaded from Convex');
    console.log('2. Resources will fallback to local if Convex unavailable');
    console.log('3. External APIs still provide fresh quotes/affirmations');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Verify CONVEX_URL in .env.local');
    console.error('2. Ensure `npx convex dev` is running');
    console.error('3. Check convex/schema.ts has resources table');
    console.error('4. Verify convex/resources.ts has seedResources mutation');
    process.exit(1);
  }
  
  process.exit(0);
}

seedResources();
