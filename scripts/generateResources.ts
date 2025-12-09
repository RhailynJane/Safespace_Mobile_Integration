/**
 * Generate mental health resources using Gemini AI
 * This script uses Gemini to create new articles, exercises, affirmations, and quotes
 * 
 * Usage: npx tsx scripts/generateResources.ts [category] [count]
 * Example: npx tsx scripts/generateResources.ts anxiety 5
 * 
 * Categories: stress, anxiety, depression, sleep, motivation, mindfulness, all
 * Default: Generates 3 resources for each category
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!GEMINI_API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY not found in environment variables");
  process.exit(1);
}

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL not found in environment variables");
  process.exit(1);
}

// Initialize clients
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
const convexClient = new ConvexHttpClient(CONVEX_URL);

// Categories and their color schemes
const CATEGORIES = {
  stress: { backgroundColor: '#E8F5E8', emoji: ['🧘‍♀️', '💪', '🌿', '🍃', '🌊'] },
  anxiety: { backgroundColor: '#E3F2FD', emoji: ['🧠', '💙', '🌈', '🕊️', '☁️'] },
  depression: { backgroundColor: '#FFF3E0', emoji: ['☀️', '🌻', '🌟', '💛', '🌅'] },
  sleep: { backgroundColor: '#F3E5F5', emoji: ['😴', '🌙', '⭐', '💤', '🛏️'] },
  motivation: { backgroundColor: '#FFF9C4', emoji: ['🚀', '💪', '🎯', '⚡', '🔥'] },
  mindfulness: { backgroundColor: '#E0F2F1', emoji: ['🧘', '🌸', '🦋', '🌺', '🍀'] },
};

// Resource types with their characteristics
const RESOURCE_TYPES = [
  { type: 'article', duration: '6-10 mins' },
  { type: 'exercise', duration: '3-8 mins' },
  { type: 'affirmation', duration: '1-2 mins' },
  { type: 'quote', duration: '1 min' },
];

/**
 * Generate a single resource using Gemini
 */
async function generateResource(category: string, type: string): Promise<any> {
  const prompt = `You are a licensed mental health professional creating therapeutic content for a mental health app called SafeSpace.

Create a ${type} focused on ${category} management for young adults dealing with mental health challenges.

Requirements:
- ${type === 'article' ? 'Educational and evidence-based, 150-250 words' : ''}
- ${type === 'exercise' ? 'Step-by-step therapeutic technique, 100-200 words' : ''}
- ${type === 'affirmation' ? 'Positive, empowering statement, 30-60 words' : ''}
- ${type === 'quote' ? 'Inspirational quote with brief context, 20-40 words' : ''}
- Professional, compassionate, non-judgmental tone
- Actionable and practical
- Suitable for diverse audiences
- Evidence-based when applicable

Return ONLY a JSON object with this exact structure:
{
  "title": "Engaging title (3-6 words)",
  "content": "The main content following the requirements above",
  "author": "${type === 'quote' ? 'Author name or Mental Health Professional' : 'Mental Health Foundation'}",
  "tags": ["tag1", "tag2", "tag3"]
}

Do not include any markdown formatting, code blocks, or explanatory text. Return only the JSON object.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the response - remove markdown code blocks if present
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const generatedData = JSON.parse(cleanedText);
    
    // Get random emoji and duration for this type
    const categoryConfig = CATEGORIES[category as keyof typeof CATEGORIES];
    const randomEmoji = categoryConfig.emoji[Math.floor(Math.random() * categoryConfig.emoji.length)];
    
    // Find duration for this type
    const typeConfig = RESOURCE_TYPES.find(rt => rt.type === type);
    const duration = typeConfig?.duration || '5 mins';
    
    return {
      title: generatedData.title,
      type: type.charAt(0).toUpperCase() + type.slice(1),
      duration: duration,
      category: category,
      content: generatedData.content,
      author: generatedData.author,
      imageEmoji: randomEmoji,
      backgroundColor: categoryConfig.backgroundColor,
      tags: generatedData.tags || [category, type],
    };
  } catch (error) {
    console.error(`❌ Error generating ${type} for ${category}:`, error);
    throw error;
  }
}

/**
 * Generate multiple resources for a category
 */
async function generateResourcesForCategory(
  category: string, 
  count: number = 3
): Promise<any[]> {
  console.log(`\n📝 Generating ${count} resources for ${category}...`);
  const resources: any[] = [];
  
  // Distribute across different types
  const types = ['article', 'exercise', 'affirmation', 'quote'];
  
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    console.log(`   ⏳ Generating ${type} ${i + 1}/${count}...`);
    
    try {
      const resource = await generateResource(category, type);
      resources.push(resource);
      console.log(`   ✅ Created: "${resource.title}"`);
      
      // Add delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`   ❌ Failed to generate ${type}`);
    }
  }
  
  return resources;
}

/**
 * Save resources to Convex database
 */
async function saveResources(resources: any[]): Promise<void> {
  console.log(`\n💾 Saving ${resources.length} resources to database...`);
  
  try {
    await convexClient.mutation(api.resources.seedResources, {
      resources: resources,
    });
    console.log(`✅ Successfully saved all resources!`);
  } catch (error) {
    console.error('❌ Error saving resources:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const categoryArg = args[0] || 'all';
  const countArg = parseInt(args[1]) || 3;
  
  console.log('🤖 Gemini Resource Generator');
  console.log('============================');
  console.log(`📊 Category: ${categoryArg}`);
  console.log(`🔢 Resources per category: ${countArg}`);
  
  const allResources: any[] = [];
  
  if (categoryArg === 'all') {
    // Generate for all categories
    for (const category of Object.keys(CATEGORIES)) {
      const resources = await generateResourcesForCategory(category, countArg);
      allResources.push(...resources);
    }
  } else {
    // Generate for specific category
    if (!CATEGORIES[categoryArg as keyof typeof CATEGORIES]) {
      console.error(`❌ Invalid category: ${categoryArg}`);
      console.error(`Valid categories: ${Object.keys(CATEGORIES).join(', ')}, all`);
      process.exit(1);
    }
    const resources = await generateResourcesForCategory(categoryArg, countArg);
    allResources.push(...resources);
  }
  
  // Save to database
  if (allResources.length > 0) {
    await saveResources(allResources);
    
    console.log('\n✨ Generation complete!');
    console.log(`📚 Total resources created: ${allResources.length}`);
    console.log('\nResource breakdown:');
    
    const byCategory = allResources.reduce((acc: any, r: any) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} resources`);
    });
  } else {
    console.log('\n⚠️ No resources were generated');
  }
  
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
