/**
* LLM Prompt: Create comprehensive React Native component documentation covering frontend implementation details and backend integration specs including PostgreSQL schema design and REST API endpoints. 
* Reference: chat.deepseek.com
*/

# SafeSpace Mental Health App - Components

## 📱 Frontend Documentation

### Component Overview

#### 1. AppHeader Component
**File**: `components/AppHeader.tsx`

**Purpose**: Reusable header component with navigation menu and user profile

**Key Features**:
- Dynamic title display
- Back button or profile image toggle
- Side navigation drawer with smooth animations
- Notification access
- Responsive design

**Props Interface**:
```typescript
interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showNotifications?: boolean;
  rightActions?: React.ReactNode;
  onMenuPress?: () => void;
}
```

**Usage Example**:
```tsx
<AppHeader 
  title="Dashboard"
  showBack={false}
  showNotifications={true}
/>
```

#### 2. BottomNavigation Component
**File**: `components/BottomNavigation.tsx`

**Purpose**: Tab-based navigation bar with active state indicators

**Features**:
- Customizable tabs array
- Active tab highlighting
- Rounded design with shadows
- Accessibility support

#### 3. CurvedBackground Component
**File**: `components/CurvedBackground.tsx`

**Purpose**: Elegant SVG-based background with gradient curves

**Features**:
- Responsive SVG paths
- Customizable gradients
- Perfect for login/onboarding screens

#### 4. Authentication Flow Components
**Multi-step signup process**:

1. **PersonalInfoStep** - Collects user personal information
2. **PasswordStep** - Password creation with real-time validation
3. **EmailVerificationStep** - Email verification with resend functionality
4. **SuccessStep** - Verification success confirmation

### 🎨 Design System

**Color Palette**:
- Primary: `#7BB8A8` (Teal)
- Secondary: `#7FDBDA` (Light Teal)
- Success: `#4CAF50` (Green)
- Error: `#FF6B6B` (Red)
- Text: `#333` (Dark), `#666` (Medium), `#999` (Light)

**Typography**:
- Headers: 24px, 600 weight
- Body: 16px, 400 weight
- Labels: 14px, 500 weight

```

## 🗄️ Backend Documentation

### Database Schema (PostgreSQL)

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    phone_number VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Profiles Table
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_image_url VARCHAR(500),
    bio TEXT,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

