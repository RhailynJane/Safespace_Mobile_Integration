# Resources Feature - Setup & Documentation

## Overview
The Resources feature provides mental health content including articles, exercises, guides, affirmations, and quotes. It integrates both hardcoded local resources and external APIs (ZenQuotes and Affirmations.dev) for fresh daily content.

## Features

### 1. Content Types
- **Articles**: Educational content about mental health topics
- **Exercises**: Practical activities for stress relief, anxiety management, etc.
- **Guides**: Step-by-step instructions for mental health practices
- **Affirmations**: Positive statements for self-improvement
- **Quotes**: Inspirational quotes from various authors

### 2. Categories
- Stress Management
- Anxiety Support
- Depression Resources
- Sleep Improvement
- Motivation
- Mindfulness

### 3. External API Integration
- **ZenQuotes API**: Fetches random inspirational quotes
- **Affirmations.dev**: Provides daily affirmations
- Both APIs have fallback to local content if unavailable

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Resources Screen                         │
│  (app/(app)/resources/index.tsx)                            │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ├─── Convex Backend (convex/resources.ts)
                    │    ├── Queries (live subscriptions)
                    │    │   ├── listResources
                    │    │   ├── listByCategory
                    │    │   ├── search
                    │    │   └── getResource
                    │    │
                    │    ├── Actions (external API)
                    │    │   ├── getDailyQuote (ZenQuotes)
                    │    │   └── getDailyAffirmationExternal (Affirmations.dev)
                    │    │
                    │    └── Mutations
                    │        ├── createResource
                    │        ├── seedResources
                    │        ├── addBookmark
                    │        └── removeBookmark
                    │
                    └─── Utils (utils/resourcesApi.ts)
                         └── Fallback functions & caching
```

## Setup Instructions

### Step 1: Ensure Convex is Running

Make sure your Convex backend is deployed and running:

```bash
npm run convex:dev
```

### Step 2: Seed Resources Database

Run the seed script to populate the Convex database with hardcoded resources:

```bash
npm run seed:resources
```

This will:
- Connect to your Convex backend
- Insert 27 mental health resources
- Create resources across all categories
- Include articles, exercises, guides, quotes, and affirmations

**Expected Output:**
```
🌱 Starting resource seeding...
📊 Total resources to seed: 27
✅ Successfully seeded resources!
📝 Created 27 resources
🎉 Resource seeding complete!
✨ All done!
```

### Step 3: Verify Resources

Check that resources are available by:
1. Opening the app
2. Navigating to the Resources screen
3. Verifying that all categories show content
4. Testing search functionality
5. Trying the "Daily Affirmation" and "Random Quote" quick actions

## Database Schema

The resources are stored in Convex with the following schema:

```typescript
resources: {
  title: string,
  type: 'Affirmation' | 'Quote' | 'Article' | 'Exercise' | 'Guide',
  duration: string,
  category: 'stress' | 'anxiety' | 'depression' | 'sleep' | 'motivation' | 'mindfulness',
  content: string,
  author?: string,
  imageEmoji: string,
  backgroundColor: string,
  tags?: string[],
  isExternal?: boolean,
  active: boolean,
  sortOrder?: number,
  createdAt: number,
  updatedAt: number
}
```

### Indexes
- `by_category`: Fast category filtering
- `by_type`: Fast type filtering
- `by_active`: Show only active resources
- `by_sort`: Custom ordering

### Bookmarks
Users can bookmark (favorite) resources:

```typescript
resourceBookmarks: {
  userId: string,
  resourceId: Id<"resources">,
  createdAt: number
}
```

## API Integration

### ZenQuotes API
- **Endpoint**: `https://zenquotes.io/api/random`
- **Purpose**: Fetch random inspirational quotes
- **Rate Limit**: Free tier (check their website)
- **Fallback**: Local quotes from database
- **Caching**: Daily quotes cached with AsyncStorage

### Affirmations.dev
- **Endpoint**: `https://www.affirmations.dev`
- **Purpose**: Fetch daily affirmations
- **Rate Limit**: No known limits
- **Fallback**: Local affirmations from database

### Implementation

External APIs are called via Convex actions (server-side) to avoid CORS issues:

```typescript
// In convex/resources.ts
export const getDailyQuote = action({
  handler: async () => {
    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();
    // ... process and return
  }
});
```

The frontend calls these actions:

```typescript
// In app/(app)/resources/index.tsx
const getDailyQuoteAction = useAction(api.resources.getDailyQuote);
const quote = await getDailyQuoteAction();
```

## Usage Examples

### Fetch All Resources
```typescript
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

const { resources } = useQuery(api.resources.listResources, { limit: 100 });
```

### Search Resources
```typescript
const searchResults = useQuery(api.resources.search, { 
  query: 'breathing', 
  limit: 50 
});
```

### Get Daily Quote
```typescript
import { useAction } from 'convex/react';

const getDailyQuote = useAction(api.resources.getDailyQuote);
const quote = await getDailyQuote();
```

### Add Bookmark
```typescript
const addBookmark = useMutation(api.resources.addBookmark);
await addBookmark({ 
  userId: user.id, 
  resourceId: resource.id 
});
```

## Features in UI

### 1. Featured Resource
- Displays a highlighted resource at the top
- Fetches fresh external quote daily
- Shows quote text and author

### 2. Quick Actions
- **Daily Affirmation**: Fetches from external API or database
- **Random Quote**: Fetches from external API or database
- One-tap access to motivational content

### 3. Category Filters
- Horizontal scrolling category chips
- Visual indicators (emoji + color)
- Toggle on/off filtering

### 4. Search Bar
- Real-time search across title, content, and tags
- Debounced for performance
- Clear button when text is entered

### 5. Resource Cards
- Emoji representation
- Type, duration, and author metadata
- Bookmark (star) toggle
- Tap to view full content

### 6. Pull to Refresh
- Refreshes external content
- Updates featured quote
- Smooth loading animation

## Content Guidelines

When adding new resources:

1. **Title**: Clear, concise (3-7 words)
2. **Duration**: Realistic estimate (e.g., "5 mins", "10 mins")
3. **Content**: 
   - Practical and actionable
   - Evidence-based when possible
   - Empathetic tone
   - 100-300 words for articles
   - 50-100 words for exercises
4. **Category**: Match to primary benefit
5. **Tags**: 2-5 relevant keywords
6. **Emoji**: Relevant to content type
7. **Background Color**: Match category theme

## Troubleshooting

### Resources Not Loading

1. **Check Convex Connection**:
   ```bash
   npm run convex:dev
   ```

2. **Verify Environment Variables**:
   Ensure `EXPO_PUBLIC_CONVEX_URL` is set in `.env`

3. **Check Seed Status**:
   Run seed script again: `npm run seed:resources`

### External APIs Failing

- The app will automatically fallback to local content
- Check console for error messages
- Verify internet connectivity
- ZenQuotes may have rate limits

### Bookmarks Not Saving

1. Ensure user is authenticated
2. Check Clerk user ID is available
3. Verify Convex mutations are working
4. Check console for errors

## Performance Considerations

### Optimization Strategies

1. **Live Queries**: Convex subscriptions automatically update UI
2. **Lazy Loading**: Resources loaded on demand
3. **Caching**: External quotes cached daily in AsyncStorage
4. **Pagination**: Limit queries to reasonable amounts (50-100)
5. **Search Debouncing**: Prevents excessive queries

### Best Practices

- Use `useMemo` for expensive computations
- Implement pull-to-refresh for user control
- Show loading states during API calls
- Provide meaningful empty states

## Future Enhancements

### Planned Features
- [ ] Resource recommendations based on user mood
- [ ] Audio versions of exercises
- [ ] Community ratings and comments
- [ ] Personalized resource collections
- [ ] Offline mode with full content sync
- [ ] Multiple language support
- [ ] Advanced filtering (duration, difficulty)
- [ ] Resource history and tracking

### Additional API Integrations
- [ ] MindTools API for additional exercises
- [ ] Psychology Today content
- [ ] Meditation guides from external sources
- [ ] Video content integration

## Testing

### Manual Testing Checklist
- [ ] View all resources
- [ ] Filter by each category
- [ ] Search for specific content
- [ ] Bookmark/unbookmark resources
- [ ] Test external quote fetch
- [ ] Test external affirmation fetch
- [ ] Verify fallbacks when APIs fail
- [ ] Test pull-to-refresh
- [ ] Check resource detail view
- [ ] Verify empty states

### Automated Tests
TODO: Add Jest tests for:
- Resource queries
- Search functionality
- Bookmark mutations
- External API calls
- Fallback logic

## Support

For issues or questions:
1. Check this documentation
2. Review Convex dashboard for data
3. Check browser/app console for errors
4. Review API status for external services

## Resources Count by Category

After seeding, you should have:
- **Stress**: 3 resources
- **Anxiety**: 3 resources
- **Depression**: 3 resources
- **Sleep**: 3 resources
- **Motivation**: 6 resources (includes 3 quotes)
- **Mindfulness**: 3 resources
- **Mixed**: 6 inspirational quotes across categories

**Total**: 27 resources

## API Reference

### Queries
- `listResources({ limit })`
- `listByCategory({ category, limit })`
- `listByType({ type, limit })`
- `search({ query, limit })`
- `getResource({ resourceId })`
- `getDailyAffirmation()`
- `getRandomQuote()`
- `listBookmarkedIds({ userId })`

### Actions
- `getDailyQuote()` - Fetches from ZenQuotes API
- `getDailyAffirmationExternal()` - Fetches from Affirmations.dev
- `fetchExternalQuote()` - Generic quote fetcher
- `fetchExternalAffirmation()` - Generic affirmation fetcher

### Mutations
- `createResource({ ... })`
- `seedResources({ resources })`
- `updateResource({ resourceId, ... })`
- `deleteResource({ resourceId })`
- `addBookmark({ userId, resourceId })`
- `removeBookmark({ userId, resourceId })`

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0
