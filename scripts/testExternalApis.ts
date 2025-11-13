/**
 * Test script to verify external API integration
 * Tests ZenQuotes and Affirmations.dev APIs
 * 
 * Usage: npx tsx scripts/testExternalApis.ts
 */

console.log('🧪 Testing External APIs...\n');

// Test ZenQuotes API
async function testZenQuotes() {
  console.log('1️⃣ Testing ZenQuotes API...');
  try {
    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();
    
    if (data && data[0]) {
      console.log('   ✅ ZenQuotes API is working!');
      console.log(`   📝 Quote: "${data[0].q}"`);
      console.log(`   👤 Author: ${data[0].a}\n`);
      return true;
    } else {
      console.log('   ⚠️  ZenQuotes returned unexpected data\n');
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('   ❌ ZenQuotes API failed:', errorMessage);
    console.log('   ℹ️  App will fallback to local quotes\n');
    return false;
  }
}

// Test Affirmations.dev API
async function testAffirmations() {
  console.log('2️⃣ Testing Affirmations.dev API...');
  try {
    const response = await fetch('https://www.affirmations.dev');
    const data = await response.json();
    
    if (data && data.affirmation) {
      console.log('   ✅ Affirmations.dev API is working!');
      console.log(`   📝 Affirmation: "${data.affirmation}"\n`);
      return true;
    } else {
      console.log('   ⚠️  Affirmations.dev returned unexpected data\n');
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('   ❌ Affirmations.dev API failed:', errorMessage);
    console.log('   ℹ️  App will fallback to local affirmations\n');
    return false;
  }
}

// Test multiple requests to check rate limiting
async function testRateLimits() {
  console.log('3️⃣ Testing Rate Limits (5 requests)...');
  const results = { success: 0, failed: 0 };
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await fetch('https://zenquotes.io/api/random');
      const data = await response.json();
      
      if (data && data[0]) {
        results.success++;
        console.log(`   ✅ Request ${i}/5: Success`);
      } else {
        results.failed++;
        console.log(`   ⚠️  Request ${i}/5: Unexpected data`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      console.log(`   ❌ Request ${i}/5: Failed`);
    }
  }
  
  console.log(`\n   📊 Results: ${results.success} success, ${results.failed} failed`);
  
  if (results.failed > 2) {
    console.log('   ⚠️  High failure rate - possible rate limiting\n');
  } else {
    console.log('   ✅ Rate limits look good!\n');
  }
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════════\n');
  
  const zenQuotesWorks = await testZenQuotes();
  const affirmationsWorks = await testAffirmations();
  await testRateLimits();
  
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📋 Summary:\n');
  
  if (zenQuotesWorks && affirmationsWorks) {
    console.log('   🎉 All external APIs are working perfectly!');
    console.log('   ✅ Your app will receive fresh quotes and affirmations\n');
  } else if (zenQuotesWorks || affirmationsWorks) {
    console.log('   ⚠️  Some APIs are not responding');
    console.log('   ℹ️  Your app will fallback to local content for failed APIs\n');
  } else {
    console.log('   ❌ No external APIs are responding');
    console.log('   ℹ️  Your app will use local resources only');
    console.log('   ℹ️  This is normal behavior and the app will work fine!\n');
  }
  
  console.log('💡 Tips:');
  console.log('   • External APIs may have occasional downtime');
  console.log('   • The app has built-in fallbacks to local content');
  console.log('   • Rate limiting is normal and handled automatically');
  console.log('   • Users will always see content even if APIs fail\n');
  
  console.log('✨ Your resources feature is ready to use!\n');
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
