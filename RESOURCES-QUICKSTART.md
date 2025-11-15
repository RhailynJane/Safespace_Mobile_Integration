# Resources Feature - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Start Convex Backend
```bash
npm run convex:dev
```

Wait for the message: "Convex functions ready!"

### Step 2: Seed Resources
Open a new terminal and run:
```bash
npm run seed:resources
```

You should see:
```
✅ Successfully seeded resources!
📝 Created 27 resources
🎉 Resource seeding complete!
```

### Step 3: Start the App
In another terminal:
```bash
npm start
```

### Step 4: Test Resources
1. Open the app on your device/emulator
2. Navigate to the Resources tab
3. Try these features:
   - ✨ Tap "Daily Affirmation" (fetches from external API)
   - 💭 Tap "Random Quote" (fetches from ZenQuotes)
   - 🔍 Search for "breathing"
   - 📂 Filter by category (Stress, Anxiety, etc.)
   - ⭐ Bookmark a resource
   - 📖 Tap a resource to view full content

## 🎯 What's Working

### ✅ Hardcoded Resources (27 total)
- 3 Stress management resources
- 3 Anxiety support resources  
- 3 Depression resources
- 3 Sleep improvement resources
- 6 Motivation resources (includes quotes)
- 3 Mindfulness resources
- 6 Inspirational quotes across categories

### ✅ External API Integration
- **ZenQuotes API**: Random inspirational quotes
- **Affirmations.dev**: Daily affirmations
- Both have automatic fallback to local content

### ✅ Features
- Category filtering
- Real-time search
- Bookmarking/favorites
- Pull-to-refresh
- Live Convex subscriptions
- Responsive UI with themes

## 📋 Verify Everything Works

### Test Checklist
```bash
# 1. Backend is running
npm run convex:dev
# Look for: "Convex functions ready!"

# 2. Resources are seeded
npm run seed:resources
# Look for: "Created 27 resources"

# 3. Check Convex Dashboard
# Visit: https://dashboard.convex.dev
# Navigate to: Your Project > Data > resources table
# Should see 27 entries
```

### In the App
- [ ] Resources screen loads
- [ ] All 6 categories visible
- [ ] "Daily Affirmation" works
- [ ] "Random Quote" works
- [ ] Search finds results
- [ ] Category filtering works
- [ ] Can bookmark resources
- [ ] Resource detail view opens

## 🔧 Troubleshooting

### Resources Not Showing?

**Problem**: Empty state or loading forever

**Solutions**:
1. Check Convex is running: `npm run convex:dev`
2. Re-run seed: `npm run seed:resources`
3. Check `.env` has `EXPO_PUBLIC_CONVEX_URL`
4. Restart app: Press `r` in Metro bundler

### External APIs Not Working?

**Problem**: Only seeing local quotes/affirmations

**Solutions**:
1. Check internet connection
2. External APIs may be rate-limited (normal behavior)
3. Fallback to local content is automatic (this is expected!)
4. Check console for network errors

### Seed Script Fails?

**Problem**: Error running `npm run seed:resources`

**Solutions**:
1. Ensure Convex is running first
2. Check `EXPO_PUBLIC_CONVEX_URL` in `.env`
3. Try: `npx tsx scripts/seedResources.ts` directly
4. Check you have internet connection

### Bookmarks Not Saving?

**Problem**: Star icon doesn't stay selected

**Solutions**:
1. Ensure you're logged in (check authentication)
2. Check Clerk user ID is available
3. Look for errors in console
4. Try logging out and back in

## 🎨 Customization

### Adding New Resources

Edit `scripts/seedResources.ts` and add to `ALL_RESOURCES`:

```typescript
{
  title: 'Your Resource Title',
  type: 'Exercise', // or 'Article', 'Guide', 'Quote', 'Affirmation'
  duration: '5 mins',
  category: 'stress', // or 'anxiety', 'depression', 'sleep', 'motivation', 'mindfulness'
  content: 'Full content text here...',
  author: 'Optional Author Name',
  imageEmoji: '🎯',
  backgroundColor: '#E8F5E8',
  tags: ['tag1', 'tag2', 'tag3']
}
```

Then re-run: `npm run seed:resources`

### Changing Category Colors

Edit `utils/resourcesApi.ts` and modify `CATEGORIES`:

```typescript
{
  id: 'stress',
  name: 'Stress',
  icon: '💧',
  color: '#FF8A65', // Change this!
  tags: ['peace', 'calm', 'relaxation']
}
```

## 📚 Documentation

- **Full Documentation**: `docs/17-resources-setup.md`
- **API Reference**: See docs for all queries, mutations, and actions
- **Architecture**: Detailed system design in docs

## 🎉 You're All Set!

The Resources feature is now fully functional with:
- ✅ 27 hardcoded resources seeded
- ✅ ZenQuotes API integration
- ✅ Affirmations.dev API integration  
- ✅ Live Convex subscriptions
- ✅ Bookmarking system
- ✅ Search and filtering
- ✅ Automatic fallbacks

**Next Steps**:
1. Explore the UI
2. Test external APIs
3. Try bookmarking resources
4. Customize content to your needs

Need help? Check `docs/17-resources-setup.md` for detailed documentation!

---
**Last Updated**: November 12, 2025
