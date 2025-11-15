/**
 * Smart Resource Recommendation System
 * 
 * Analyzes user's mood patterns and journal entries to recommend
 * personalized mental health resources.
 */

import { Resource } from './resourcesApi';

// Mood to category mapping
const MOOD_TO_CATEGORIES: Record<string, string[]> = {
  // Negative moods
  'very-sad': ['depression', 'motivation', 'mindfulness'],
  'sad': ['depression', 'motivation', 'stress'],
  'frustrated': ['stress', 'anxiety', 'mindfulness'],
  'annoyed': ['stress', 'anxiety', 'mindfulness'],
  'angry': ['stress', 'anxiety', 'mindfulness'],
  'furious': ['stress', 'anxiety', 'mindfulness'],
  'displeased': ['stress', 'motivation'],
  
  // Neutral/positive moods
  'neutral': ['mindfulness', 'motivation'],
  'content': ['mindfulness', 'motivation'],
  'happy': ['mindfulness', 'motivation'],
  'very-happy': ['mindfulness', 'motivation'],
  'ecstatic': ['mindfulness', 'motivation'],
};

// Keywords to category mapping for journal analysis
const JOURNAL_KEYWORDS: Record<string, string[]> = {
  stress: ['stress', 'stressed', 'overwhelmed', 'pressure', 'anxious', 'worry', 'worried', 'tense', 'burden'],
  anxiety: ['anxiety', 'anxious', 'nervous', 'panic', 'fear', 'scared', 'worried', 'uneasy', 'restless'],
  depression: ['sad', 'depressed', 'hopeless', 'empty', 'lonely', 'worthless', 'tired', 'exhausted', 'unmotivated'],
  sleep: ['sleep', 'insomnia', 'tired', 'exhausted', 'fatigue', 'rest', 'wake', 'nightmare', 'sleepless'],
  motivation: ['unmotivated', 'lazy', 'stuck', 'procrastinate', 'goal', 'achievement', 'progress'],
  mindfulness: ['meditation', 'mindful', 'present', 'awareness', 'breathing', 'calm', 'peace'],
};

// Mood severity scoring (1-5, where 5 is most severe/concerning)
const MOOD_SEVERITY: Record<string, number> = {
  'very-sad': 5,
  'furious': 5,
  'sad': 4,
  'angry': 4,
  'frustrated': 3,
  'annoyed': 3,
  'displeased': 3,
  'neutral': 2,
  'content': 1,
  'happy': 1,
  'very-happy': 1,
  'ecstatic': 1,
};

interface MoodEntry {
  mood_type: string;
  moodType?: string;
  type?: string;
  created_at: string;
  createdAt?: string;
}

interface JournalEntry {
  content: string;
  created_at?: string;
  createdAt?: string;
}

interface RecommendationScore {
  category: string;
  score: number;
  sources: string[]; // Track what influenced this score
}

/**
 * Analyze recent moods and return category priorities
 */
export function analyzeMoodPatterns(moods: MoodEntry[]): Map<string, RecommendationScore> {
  const categoryScores = new Map<string, RecommendationScore>();
  
  if (!moods || moods.length === 0) {
    // Default recommendations if no mood data
    return new Map([
      ['mindfulness', { category: 'mindfulness', score: 3, sources: ['default'] }],
      ['motivation', { category: 'motivation', score: 2, sources: ['default'] }],
      ['stress', { category: 'stress', score: 1, sources: ['default'] }],
    ]);
  }

  // Recent moods have more weight
  moods.forEach((mood, index) => {
    const moodType = mood.mood_type || mood.moodType || mood.type || 'neutral';
    const recencyWeight = moods.length - index; // More recent = higher weight
    const severityScore = MOOD_SEVERITY[moodType] || 2;
    
    // Get relevant categories for this mood
    const categories = MOOD_TO_CATEGORIES[moodType] || ['mindfulness'];
    
    categories.forEach((category, catIndex) => {
      const existing = categoryScores.get(category) || { 
        category, 
        score: 0, 
        sources: [] 
      };
      
      // Score calculation:
      // - Severity (1-5): How concerning is the mood
      // - Recency weight: Recent moods matter more
      // - Category priority: First category for mood gets more weight
      const priorityWeight = categories.length - catIndex;
      const moodScore = severityScore * recencyWeight * priorityWeight;
      
      existing.score += moodScore;
      existing.sources.push(`mood:${moodType}`);
      categoryScores.set(category, existing);
    });
  });

  return categoryScores;
}

/**
 * Analyze journal entries for keywords and themes
 */
export function analyzeJournalContent(journals: JournalEntry[]): Map<string, RecommendationScore> {
  const categoryScores = new Map<string, RecommendationScore>();
  
  if (!journals || journals.length === 0) {
    return categoryScores;
  }

  journals.forEach((journal, index) => {
    const content = journal.content?.toLowerCase() || '';
    const recencyWeight = journals.length - index;
    
    // Check each category's keywords
    Object.entries(JOURNAL_KEYWORDS).forEach(([category, keywords]) => {
      let matchCount = 0;
      const matchedKeywords: string[] = [];
      
      keywords.forEach(keyword => {
        // Count occurrences of keyword in content
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          matchCount += matches.length;
          matchedKeywords.push(keyword);
        }
      });
      
      if (matchCount > 0) {
        const existing = categoryScores.get(category) || { 
          category, 
          score: 0, 
          sources: [] 
        };
        
        // Score based on keyword frequency and recency
        const journalScore = matchCount * recencyWeight * 2;
        existing.score += journalScore;
        existing.sources.push(`journal:${matchedKeywords.join(',')}`);
        categoryScores.set(category, existing);
      }
    });
  });

  return categoryScores;
}

/**
 * Combine mood and journal analysis to get final category priorities
 */
export function getCategoryPriorities(
  moods: MoodEntry[], 
  journals: JournalEntry[]
): string[] {
  const moodScores = analyzeMoodPatterns(moods);
  const journalScores = analyzeJournalContent(journals);
  
  // Merge scores
  const combinedScores = new Map<string, RecommendationScore>();
  
  // Add mood scores (weight: 60%)
  moodScores.forEach((score, category) => {
    combinedScores.set(category, {
      category,
      score: score.score * 0.6,
      sources: score.sources,
    });
  });
  
  // Add journal scores (weight: 40%)
  journalScores.forEach((score, category) => {
    const existing = combinedScores.get(category);
    if (existing) {
      existing.score += score.score * 0.4;
      existing.sources.push(...score.sources);
    } else {
      combinedScores.set(category, {
        category,
        score: score.score * 0.4,
        sources: score.sources,
      });
    }
  });
  
  // Sort by score (highest first) and return category names
  const sorted = Array.from(combinedScores.values())
    .sort((a, b) => b.score - a.score)
    .map(s => s.category);
  
  console.log('[ResourceRecommendations] Category priorities:', sorted);
  console.log('[ResourceRecommendations] Scores:', 
    Array.from(combinedScores.entries()).map(([cat, score]) => 
      `${cat}: ${score.score.toFixed(1)} (${score.sources.slice(0, 3).join(', ')})`
    )
  );
  
  return sorted;
}

/**
 * Get personalized resource recommendations based on user data
 */
export function getPersonalizedRecommendations(
  allResources: Resource[],
  moods: MoodEntry[],
  journals: JournalEntry[],
  limit: number = 3
): Resource[] {
  if (!allResources || allResources.length === 0) {
    return [];
  }

  // Get priority categories based on user's mood and journal data
  const priorityCategories = getCategoryPriorities(moods, journals);
  
  if (priorityCategories.length === 0) {
    // Fallback to random quick resources
    return allResources
      .filter(r => r.type === 'Exercise' || r.type === 'Affirmation' || r.type === 'Quote')
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  // Score resources based on category priority
  const scoredResources = allResources.map(resource => {
    const categoryIndex = priorityCategories.indexOf(resource.category);
    let score = 0;
    
    if (categoryIndex !== -1) {
      // Higher score for higher priority categories
      score = (priorityCategories.length - categoryIndex) * 10;
    }
    
    // Bonus for quick, actionable content
    if (resource.type === 'Exercise') score += 5;
    if (resource.type === 'Affirmation') score += 4;
    if (resource.type === 'Quote') score += 3;
    
    // Bonus for short duration (more likely to be completed)
    const duration = parseInt(resource.duration) || 10;
    if (duration <= 5) score += 3;
    else if (duration <= 10) score += 2;
    else if (duration <= 15) score += 1;
    
    return { resource, score };
  });

  // Sort by score and take top recommendations
  const recommendations = scoredResources
    .sort((a, b) => {
      // Sort by score first
      if (b.score !== a.score) return b.score - a.score;
      // If same score, randomize
      return Math.random() - 0.5;
    })
    .slice(0, limit)
    .map(s => s.resource);

  console.log('[ResourceRecommendations] Top recommendations:', 
    recommendations.map(r => `${r.title} (${r.category}, ${r.type})`)
  );

  return recommendations;
}

/**
 * Get recommendation explanation for UI display
 */
export function getRecommendationReason(
  resource: Resource,
  moods: MoodEntry[],
  journals: JournalEntry[]
): string {
  const recentMood = moods[0];
  const moodType = recentMood?.mood_type || recentMood?.moodType || recentMood?.type;
  
  // Check if recent journal mentions keywords for this category
  const recentJournal = journals[0];
  const journalKeywords = JOURNAL_KEYWORDS[resource.category] || [];
  const matchedKeyword = journalKeywords.find(keyword => 
    recentJournal?.content?.toLowerCase().includes(keyword)
  );

  if (matchedKeyword) {
    return `Based on your recent journal about "${matchedKeyword}"`;
  }
  
  if (moodType) {
    const moodLabel = moodType.replace('-', ' ');
    return `Recommended for your ${moodLabel} mood`;
  }
  
  return 'Recommended for you';
}
