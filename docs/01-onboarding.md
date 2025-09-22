# SafeSpace Mental Health App - Onboarding 
## 📱 Frontend Documentation

### Screen Flow Components

#### 1. SplashScreen Component
**File**: `app/splash.tsx`

**Purpose**: Initial app loading screen with brand introduction

**Key Features**:
- Smooth fade-in and scale-up animations for logo
- 2-second display duration before automatic navigation
- Safe area handling for different device types

**Animation Details**:
- **Fade Animation**: Opacity from 0 to 1 over 800ms
- **Scale Animation**: Logo grows from 80% to 100% size over 800ms
- **Automatic Navigation**: Redirects to `/loading` after 2 seconds

**Technical Implementation**:
```typescript
// Animation values
const fadeAnim = new Animated.Value(0);        // Opacity control
const scaleAnim = new Animated.Value(0.8);     // Scale control

// Parallel animations
Animated.parallel([
  Animated.timing(fadeAnim, { toValue: 1, duration: 800 }),
  Animated.timing(scaleAnim, { toValue: 1, duration: 800 })
]).start();
```

---

#### 2. LoadingScreen Component
**File**: `app/loading.tsx`

**Purpose**: Progress indicator screen with decorative animations

**Key Features**:
- 6 animated circles with different behaviors and timing
- Progress counter from 1% to 100% (2% increments every 50ms)
- Automatic navigation to quote screen upon completion

**Circle Animations**:
- **Circle 1**: Medium pulse (1-second cycle, 100% ↔ 120%)
- **Circle 2**: Slow pulse (1.2-second cycle, 100% ↔ 130%)
- **Circle 3**: Slowest pulse (1.5-second cycle, 100% ↔ 110%)
- **Circle 4**: Background pulse (3-second cycle, 90% ↔ 140%)
- **Circle 5**: Fast flicker (0.8-second cycle, 70% ↔ 150%)
- **Circle 6**: Combined scale + movement (1.5-second cycle)

**Progress System**:
```typescript
const [progress, setProgress] = useState(1);

// Progress updates every 50ms
const interval = setInterval(() => {
  setProgress((prev) => {
    if (prev >= 100) {
      clearInterval(interval);
      router.replace("/quote");
      return 100;
    }
    return prev + 2;
  });
}, 50);
```

---

#### 3. QuoteScreen Component
**File**: `app/quote.tsx`

**Purpose**: Inspirational quote display before onboarding

**Key Features**:
- Combined fade, slide, and scale animations
- 4-second display before automatic navigation
- Warm, comforting color scheme (#fed7aa)

**Animation Sequence**:
- **Fade**: Elements become visible over 1 second
- **Slide**: Quote moves up 20px over 1 second
- **Scale**: Logo grows from 80% to 100% over 1 second

**Content**:
- SafeSpace logo (150x150 container)
- Quote: "Healing takes time, and asking for help is a courageous step."
- Author: Mariska Hargitay

---

#### 4. OnboardingFlow Component
**File**: `app/onboarding.tsx`

**Purpose**: Multi-step user onboarding experience

**Key Features**:
- 6-step onboarding process with unique backgrounds
- Progress indicator (brown progress line)
- Full-screen colored backgrounds (75% top section)
- Text content area (25% bottom section with off-white background)

**Onboarding Steps Structure**:
1. **Welcome Screen** (`bgColor: "#f9fafb"`)
   - Title: "Welcome to SafeSpace!"
   - No step indicator

2. **Step One** (`bgColor: "#b9e0d1"`)
   - Title: "Personalize Your Mental Health State"
   - AI-focused content

3. **Step Two** (`bgColor: "#f7c193"`)
   - Title: "Intelligent Mood Tracking"
   - Mood tracking features

4. **Step Three** (`bgColor: "#e0e7ff"`)
   - Title: "AI Mental Journaling"
   - Journaling capabilities

5. **Step Four** (`bgColor: "#1f655a"`)
   - Title: "Mindful Resources That Makes You Happy"
   - Resource access

6. **Step Five** (`bgColor: "#ffffff"`)
   - Title: "Loving & Supportive Community"
   - Community features

**Navigation Flow**:
- Circular continue button (→) advances through steps
- Final step navigates to `/(auth)/login`
- Progress line shows completion percentage

**Visual Design**:
- **Top Section (75%)**: Full-color background with centered illustration
- **Bottom Section (25%)**: Off-white (#f8fafc) with text content
- **Step Indicator**: Semi-transparent white pill for steps 2-6
- **Progress Line**: Brown-colored line showing completion

---

## 🗄️ Backend Documentation

### Database Schema (PostgreSQL)

#### User Onboarding Tracking Table
```sql
CREATE TABLE user_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    completed_steps INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 6,
    last_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster user lookup
CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);
```

#### App Settings Table (For Screen Timing Configuration)
```sql
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate with screen timing defaults
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
('splash_screen_duration', '2000', 'Splash screen display time in milliseconds'),
('loading_screen_duration', '5000', 'Loading screen total duration'),
('quote_screen_duration', '4000', 'Quote screen display time');
```

### API Endpoints for Screen Flow

#### 1. Get Onboarding Progress
```http
GET /api/user/onboarding/progress
Authorization: Bearer <token>

Response:
{
  "completedSteps": 3,
  "totalSteps": 6,
  "currentStep": 4,
  "lastCompletedAt": "2024-01-15T10:30:00Z"
}
```

#### 2. Update Onboarding Progress
```http
POST /api/user/onboarding/complete-step
Authorization: Bearer <token>
Content-Type: application/json

{
  "stepNumber": 4
}

Response:
{
  "success": true,
  "completedSteps": 4,
  "isOnboardingComplete": false
}
```

#### 3. Get App Configuration
```http
GET /api/app/config

Response:
{
  "screenTimings": {
    "splashDuration": 2000,
    "loadingDuration": 5000,
    "quoteDuration": 4000
  },
  "features": {
    "onboardingEnabled": true,
    "skipOnboarding": false
  }
}
```

