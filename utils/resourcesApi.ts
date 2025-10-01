/**
 * Resources API Service
 * Integrates with ZenQuotes and Quotable APIs for mental health resources
 */
import axios from 'axios';

// API Base URLs
const ZENQUOTES_API = 'https://zenquotes.io/api';
const QUOTABLE_API = 'https://api.quotable.io';

// Resource type definitions
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

// Category mappings with API tags
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
    tags: ['courage', 'strength', 'confidence', 'fear']
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
    tags: ['peace', 'rest', 'calm', 'tranquility']
  },
  {
    id: 'motivation',
    name: 'Motivation',
    icon: '⚡',
    color: '#FFB74D',
    tags: ['success', 'motivation', 'inspiration', 'achievement']
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    icon: '🧘',
    color: '#BA68C8',
    tags: ['mindfulness', 'meditation', 'present', 'awareness']
  }
];

// Background colors for variety
const BACKGROUND_COLORS = [
  '#E8F5E8', '#E3F2FD', '#FFF3E0', '#F3E5F5', '#E0F2F1', '#FFF9C4'
];

// Emoji icons for resources
const RESOURCE_ICONS = [
  '🧘‍♀️', '🧠', '📊', '📅', '💪', '🌟', '🌈', '☀️', '🌸', '🎯'
];

/**
 * Fetch quotes from ZenQuotes API
 */
async function fetchZenQuotes(count: number = 10): Promise<any[]> {
  try {
    const response = await axios.get(`${ZENQUOTES_API}/quotes`);
    return response.data.slice(0, count);
  } catch (error) {
    console.error('ZenQuotes API error:', error);
    throw error;
  }
}

/**
 * Fetch quotes from Quotable API with filtering
 */
async function fetchQuotableQuotes(tags?: string[], limit: number = 10): Promise<any[]> {
  try {
    const params: any = { limit };
    if (tags && tags.length > 0) {
      params.tags = tags.join('|'); // OR operator for tags
    }
    
    const response = await axios.get(`${QUOTABLE_API}/quotes`, { params });
    return response.data.results;
  } catch (error) {
    console.error('Quotable API error:', error);
    throw error;
  }
}

/**
 * Fetch random quote from Quotable API
 */
async function fetchRandomQuote(tags?: string[]): Promise<any> {
  try {
    const params: any = {};
    if (tags && tags.length > 0) {
      params.tags = tags.join(',');
    }
    
    const response = await axios.get(`${QUOTABLE_API}/random`, { params });
    return response.data;
  } catch (error) {
    console.error('Quotable random quote error:', error);
    throw error;
  }
}

/**
 * Transform API response to Resource format
 */
function transformToResource(quote: any, index: number, category?: string): Resource {
  const categoryData = category 
    ? CATEGORIES.find(c => c.id === category)
    : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  // Estimate reading time based on content length
  const wordCount = quote.content?.split(' ').length || quote.q?.split(' ').length || 20;
  const readingTime = Math.max(1, Math.ceil(wordCount / 50)); // Avg 50 words per minute for reflection

  return {
    id: quote._id || quote.h || `resource-${index}`,
    title: quote.content?.slice(0, 50) || quote.q?.slice(0, 50) || 'Inspirational Quote',
    type: 'Affirmation',
    duration: `${readingTime} min`,
    category: categoryData?.id || 'mindfulness',
    content: quote.content || quote.q || '',
    author: quote.author || quote.a || 'Unknown',
    image: RESOURCE_ICONS[index % RESOURCE_ICONS.length] || '🌟',
    backgroundColor: BACKGROUND_COLORS[index % BACKGROUND_COLORS.length] || '#FFFFFF',
    tags: quote.tags || []
  };
}

/**
 * Fetch all resources (combines multiple API calls)
 */
export async function fetchAllResources(): Promise<Resource[]> {
  try {
    // Fetch from both APIs for variety
    const [zenQuotes, quotableQuotes] = await Promise.allSettled([
      fetchZenQuotes(5),
      fetchQuotableQuotes(undefined, 10)
    ]);

    const resources: Resource[] = [];

    // Process ZenQuotes results
    if (zenQuotes.status === 'fulfilled') {
      zenQuotes.value.forEach((quote, index) => {
        resources.push(transformToResource(quote, index));
      });
    }

    // Process Quotable results
    if (quotableQuotes.status === 'fulfilled') {
      quotableQuotes.value.forEach((quote, index) => {
        resources.push(transformToResource(quote, index + 5));
      });
    }

    // Add some curated mental health exercises (static but valuable)
    const curatedResources: Resource[] = [
      {
        id: 'breathing-exercise',
        title: 'Breathing Exercises',
        type: 'Exercise',
        duration: '5 mins',
        category: 'stress',
        content: 'Practice deep breathing techniques to reduce stress and anxiety. Inhale for 4 counts, hold for 4, exhale for 6.',
        image: '🧘‍♀️',
        backgroundColor: '#E8F5E8',
        tags: ['breathing', 'relaxation', 'stress-relief']
      },
      {
        id: 'sleep-routine',
        title: 'Better Sleep Routine',
        type: 'Guide',
        duration: '15 mins',
        category: 'sleep',
        content: 'Create a consistent sleep schedule and bedtime routine to improve sleep quality.',
        image: '🛏️',
        backgroundColor: '#F3E5F5',
        tags: ['sleep', 'routine', 'wellness']
      },
      {
        id: 'mood-tracking',
        title: 'Mood Tracking Tips',
        type: 'Article',
        duration: '8 mins',
        category: 'depression',
        content: 'Learn how to track your mood patterns and identify triggers for better mental health.',
        image: '📊',
        backgroundColor: '#FFF3E0',
        tags: ['mood', 'tracking', 'mental-health']
      }
    ];

    return [...curatedResources, ...resources];
  } catch (error) {
    console.error('Error fetching resources:', error);
    // Return fallback resources if API fails
    return getFallbackResources();
  }
}

/**
 * Fetch resources by category
 */
export async function fetchResourcesByCategory(categoryId: string): Promise<Resource[]> {
  try {
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) {
      return fetchAllResources();
    }

    // Fetch quotes with category-specific tags
    const quotes = await fetchQuotableQuotes(category.tags, 15);
    
    return quotes.map((quote, index) => 
      transformToResource(quote, index, categoryId)
    );
  } catch (error) {
    console.error('Error fetching category resources:', error);
    return [];
  }
}

/**
 * Search resources by query
 */
export async function searchResources(query: string): Promise<Resource[]> {
  try {
    // Search in Quotable API
    const response = await axios.get(`${QUOTABLE_API}/search/quotes`, {
      params: { query, limit: 20 }
    });

    return response.data.results.map((quote: any, index: number) => 
      transformToResource(quote, index)
    );
  } catch (error) {
    console.error('Error searching resources:', error);
    return [];
  }
}

/**
 * Get quote of the day
 */
export async function getQuoteOfTheDay(): Promise<Resource | null> {
  try {
    const response = await axios.get(`${ZENQUOTES_API}/today`);
    if (response.data && response.data.length > 0) {
      return transformToResource(response.data[0], 0);
    }
    return null;
  } catch (error) {
    console.error('Error fetching quote of the day:', error);
    return null;
  }
}

/**
 * Fallback resources if API fails
 */
function getFallbackResources(): Resource[] {
  return [
    {
      id: 'fallback-1',
      title: 'Take a Deep Breath',
      type: 'Affirmation',
      duration: '2 mins',
      category: 'stress',
      content: 'You are doing better than you think. Take a moment to breathe and reset.',
      image: '🧘‍♀️',
      backgroundColor: '#E8F5E8'
    },
    {
      id: 'fallback-2',
      title: 'You Are Strong',
      type: 'Affirmation',
      duration: '2 mins',
      category: 'anxiety',
      content: 'Your strength is greater than any challenge. You have overcome before and will again.',
      image: '💪',
      backgroundColor: '#E3F2FD'
    },
    {
      id: 'fallback-3',
      title: 'Tomorrow is a New Day',
      type: 'Affirmation',
      duration: '2 mins',
      category: 'depression',
      content: 'Every sunrise brings new opportunities. Be gentle with yourself.',
      image: '🌅',
      backgroundColor: '#FFF3E0'
    }
  ];
}