/**
 * Verify resources are in the Convex database
 * Usage: npx tsx scripts/verifyResources.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL not found");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function verifyResources() {
  try {
    console.log('🔍 Checking resources in Convex database...\n');
    
    // Fetch all resources
    const result: any = await client.query(api.resources.listResources, { limit: 100 });
    
    if (!result || !result.resources) {
      console.log('❌ No resources found in database');
      console.log('Please run: npm run seed:resources');
      return;
    }
    
    const resources = result.resources;
    console.log(`✅ Found ${resources.length} resources in database!\n`);
    
    // Group by category
    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    resources.forEach((r: any) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byType[r.type] = (byType[r.type] || 0) + 1;
    });
    
    console.log('📊 Resources by Category:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });
    
    console.log('\n📊 Resources by Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    console.log('\n📝 Sample Resources:');
    resources.slice(0, 3).forEach((r: any) => {
      console.log(`   • ${r.title} (${r.type} - ${r.category})`);
    });
    
    console.log('\n✨ Resources are ready! Refresh your app to see them.');
    console.log('💡 If app still shows empty, try:');
    console.log('   1. Close and reopen the app');
    console.log('   2. Pull down to refresh');
    console.log('   3. Check Convex connection in app console\n');
    
  } catch (error) {
    console.error('❌ Error verifying resources:', error);
    console.log('\n💡 Make sure Convex is running: npm run convex:dev');
  }
}

verifyResources().then(() => process.exit(0));
