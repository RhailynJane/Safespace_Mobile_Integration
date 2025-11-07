/**
 * Seed Resources Script
 * 
 * Populates Convex resources table from ALL_RESOURCES static data
 * Run this script after deploying Convex schema to initialize resource library
 * 
 * Usage:
 * 1. Ensure Convex is deployed: npx convex dev
 * 2. Run: node scripts/seed-resources.js
 * 
 * This script will:
 * - Import all static resources from resourcesApi
 * - Transform them to Convex schema format
 * - Bulk insert using seedResources mutation
 * - Report success/failure for each batch
 */

import { ConvexHttpClient } from "convex/browser";

// Update this with your Convex deployment URL
const CONVEX_URL = process.env.CONVEX_URL || "https://your-deployment.convex.cloud";

// Import resources from the static data
// Note: You'll need to copy ALL_RESOURCES array here or import from resourcesApi
const ALL_RESOURCES = [
  // Stress Management Resources
  {
    id: 'stress-1',
    title: 'Box Breathing Technique',
    type: 'Exercise',
    duration: '5 mins',
    category: 'stress',
    content: 'Box breathing is a powerful stress-relief technique used by Navy SEALs. Breathe in for 4 counts, hold for 4 counts, breathe out for 4 counts, hold for 4 counts. Repeat for 5 minutes. This activates your parasympathetic nervous system, reducing stress hormones and promoting calm.',
    image_emoji: '🧘‍♀️',
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
    image_emoji: '💪',
    backgroundColor: '#E8F5E8',
    tags: ['relaxation', 'body-scan', 'tension-relief']
  },
  // Add more resources here...
  // For production, import from utils/resourcesApi.ts ALL_RESOURCES array
];

async function seedResources() {
  console.log('🌱 Starting resources seed...');
  console.log(`📊 Total resources to seed: ${ALL_RESOURCES.length}`);
  
  // Create Convex client
  const client = new ConvexHttpClient(CONVEX_URL);
  
  try {
    // Transform resources to Convex format
    const convexResources = ALL_RESOURCES.map(resource => ({
      title: resource.title,
      type: resource.type,
      duration: resource.duration,
      category: resource.category,
      content: resource.content,
      author: resource.author || undefined,
      imageEmoji: resource.image_emoji,
      backgroundColor: resource.backgroundColor,
      tags: resource.tags || [],
    }));
    
    // Seed in batches of 50 to avoid timeout
    const BATCH_SIZE = 50;
    let totalSeeded = 0;
    
    for (let i = 0; i < convexResources.length; i += BATCH_SIZE) {
      const batch = convexResources.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Seeding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(convexResources.length / BATCH_SIZE)} (${batch.length} resources)...`);
      
      const result = await client.mutation("resources:seedResources", {
        resources: batch,
      });
      
      totalSeeded += result.count;
      console.log(`✅ Successfully seeded ${result.count} resources`);
    }
    
    console.log(`\n🎉 Seed complete! Total resources seeded: ${totalSeeded}`);
    console.log('✨ Your Convex resources table is now populated!');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Verify CONVEX_URL is correct');
    console.error('2. Ensure convex dev is running');
    console.error('3. Check schema.ts has resources table defined');
    console.error('4. Verify resources.ts has seedResources mutation');
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the seed
seedResources();
