# Personalized Resource Recommendation System

## Overview
The SafeSpace app now features an intelligent recommendation system that analyzes user mood patterns and journal entries to suggest personalized mental health resources.

## How It Works

### Data Sources
1. **Recent Moods** (last 7 entries)
   - Mood type (happy, sad, stressed, anxious, etc.)
   - Timestamp (recent moods weighted more heavily)
   - Severity scoring (1-5 scale)

2. **Journal Entries** (last 5 entries)
   - Content analysis for keywords
   - Sentiment indicators
   - Theme extraction

### Analysis Process

#### 1. Mood Pattern Analysis
- Maps mood types to relevant resource categories
- Negative moods (sad, angry, frustrated) → Stress, Anxiety, Depression resources
- Neutral/positive moods → Mindfulness, Motivation resources
- Severity scoring prioritizes concerning moods
- Recency weighting (recent moods matter more)

#### 2. Journal Content Analysis
- Scans for mental health-related keywords
- Categories mapped to keyword clusters:
  - **Stress**: stressed, overwhelmed, pressure, anxious, worry, tense
  - **Anxiety**: anxiety, nervous, panic, fear, worried, uneasy
  - **Depression**: sad, hopeless, empty, lonely, tired, unmotivated
  - **Sleep**: insomnia, exhausted, fatigue, nightmare, sleepless
  - **Motivation**: unmotivated, stuck, procrastinate, goal, achievement
  - **Mindfulness**: meditation, mindful, present, breathing, calm

#### 3. Score Combination
- Mood analysis: 60% weight
- Journal analysis: 40% weight
- Combined scores determine category priorities

#### 4. Resource Selection
Resources are scored based on:
- **Category Match** (highest priority categories get highest scores)
- **Content Type** (quick, actionable content preferred)
  - Exercises: +5 points
  - Affirmations: +4 points
  - Quotes: +3 points
- **Duration** (shorter = higher completion likelihood)
  - ≤5 mins: +3 points
  - ≤10 mins: +2 points
  - ≤15 mins: +1 point

## Examples

### Scenario 1: Recent Stress
**User Data:**
- Recent moods: frustrated, annoyed, sad
- Journal: "Feeling so stressed and overwhelmed with work"

**Analysis:**
- Stress category prioritized (keywords + mood match)
- Anxiety secondary (mood indicators)

**Recommendations:**
1. Box Breathing Technique (Exercise, 5 mins, Stress)
2. Progressive Muscle Relaxation (Exercise, 12 mins, Stress)
3. Worry Time Technique (Guide, 6 mins, Anxiety)

### Scenario 2: Low Motivation
**User Data:**
- Recent moods: neutral, displeased, sad
- Journal: "Can't get motivated, feeling stuck and lazy"

**Analysis:**
- Motivation category prioritized (keywords + mood)
- Depression secondary (mood patterns)

**Recommendations:**
1. Morning Affirmations (Affirmation, 3 mins, Motivation)
2. Micro-Goals Strategy (Guide, 8 mins, Motivation)
3. Three Good Things Practice (Exercise, 5 mins, Depression)

### Scenario 3: Anxiety Patterns
**User Data:**
- Recent moods: anxious, worried, frustrated
- Journal: "Can't stop worrying about everything, feeling panicky"

**Analysis:**
- Anxiety category strongly prioritized
- Stress secondary

**Recommendations:**
1. 5-4-3-2-1 Grounding Technique (Exercise, 3 mins, Anxiety)
2. Box Breathing Technique (Exercise, 5 mins, Stress)
3. Understanding Anxiety (Article, 10 mins, Anxiety)

## Implementation Details

### Files
- `utils/resourceRecommendations.ts` - Core recommendation engine
- `app/(app)/(tabs)/home.tsx` - Integration in home screen
- `utils/resourcesApi.ts` - Resource data and fetching

### Key Functions

#### `analyzeMoodPatterns(moods)`
- Returns category scores based on mood analysis
- Uses mood severity and recency weighting

#### `analyzeJournalContent(journals)`
- Returns category scores based on keyword matching
- Counts keyword frequency and applies recency weight

#### `getCategoryPriorities(moods, journals)`
- Combines mood and journal analysis
- Returns sorted list of category priorities

#### `getPersonalizedRecommendations(resources, moods, journals, limit)`
- Main recommendation function
- Scores all resources based on category match and content type
- Returns top N recommendations

## Configuration

### Mood Mappings
Edit `MOOD_TO_CATEGORIES` in `resourceRecommendations.ts`:
```typescript
const MOOD_TO_CATEGORIES: Record<string, string[]> = {
  'very-sad': ['depression', 'motivation', 'mindfulness'],
  'frustrated': ['stress', 'anxiety', 'mindfulness'],
  // Add more mappings...
};
```

### Journal Keywords
Edit `JOURNAL_KEYWORDS` in `resourceRecommendations.ts`:
```typescript
const JOURNAL_KEYWORDS: Record<string, string[]> = {
  stress: ['stress', 'overwhelmed', 'pressure'],
  anxiety: ['anxiety', 'nervous', 'panic'],
  // Add more keywords...
};
```

### Severity Scores
Edit `MOOD_SEVERITY` for mood importance:
```typescript
const MOOD_SEVERITY: Record<string, number> = {
  'very-sad': 5,  // Most concerning
  'sad': 4,
  'neutral': 2,
  'happy': 1,     // Least concerning
};
```

## Benefits

### For Users
✅ Relevant content based on current mental state
✅ Proactive support when struggling
✅ Quick, actionable resources (exercises, affirmations)
✅ Reduced cognitive load (no searching needed)

### For Therapists/Support Workers
✅ Insight into user needs
✅ Automated first-line support
✅ Evidence-based recommendations
✅ Trend identification

## Future Enhancements

### Planned Improvements
- [ ] Machine learning for pattern recognition
- [ ] Time-of-day preferences
- [ ] Completion rate feedback loop
- [ ] Collaborative filtering (anonymous patterns)
- [ ] Seasonal/contextual adjustments
- [ ] Integration with assessment results
- [ ] Resource effectiveness tracking
- [ ] A/B testing different recommendation strategies

### Advanced Features
- [ ] Natural language processing for journal sentiment
- [ ] Predictive recommendations (before crisis)
- [ ] Personalized resource creation
- [ ] Multi-modal content (audio, video)
- [ ] Social recommendations (community favorites)

## Testing

### Manual Testing
1. Add varied mood entries (happy, sad, stressed)
2. Write journal with keywords ("stressed", "anxious")
3. Navigate to home screen
4. Verify relevant resources shown
5. Change mood patterns
6. Verify recommendations update

### Test Cases
```typescript
// Test 1: Stress pattern
moods: ['frustrated', 'annoyed', 'stressed']
journals: ['Feeling overwhelmed']
expected: Stress/Anxiety resources

// Test 2: No data
moods: []
journals: []
expected: Default mindfulness/motivation

// Test 3: Mixed signals
moods: ['happy', 'sad', 'neutral']
journals: ['Good day but feeling anxious']
expected: Balance of anxiety and motivation
```

## Performance

### Optimizations
- Caching of resource analysis
- Debounced updates (not on every mood change)
- Lazy loading of journal content
- Memoized category calculations

### Metrics to Monitor
- Recommendation relevance (user feedback)
- Resource completion rates
- Time to first interaction
- Diversity of recommended content
- Category distribution over time

## Privacy & Ethics

### Data Handling
- All analysis done client-side
- No mood/journal data sent to external services
- Anonymous patterns only for improvements
- User control over data sharing

### Ethical Considerations
- Avoid reinforcing negative patterns
- Balance urgent help with positive growth
- Transparent recommendation reasons
- User override/customization options
- Professional support always available

## Support

### Troubleshooting
**Recommendations not updating:**
- Check mood data is being tracked
- Verify journal entries are saved
- Clear app cache and reload

**Not personalized enough:**
- Need at least 3 mood entries
- Journal entries improve accuracy
- System learns over time

**Too focused on one category:**
- Algorithm diversifies automatically
- Add variety to mood tracking
- Write about different topics

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0
