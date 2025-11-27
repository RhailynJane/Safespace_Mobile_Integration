# SafeSpace Mental Health App - Project Documentation

## Project Overview

**SafeSpace** is a comprehensive mental health and wellness application designed to provide users with tools for mental health management, professional support, and community connection. The app combines evidence-based therapeutic techniques with modern technology to create a supportive ecosystem for mental wellbeing.

### Core Mission
To make mental health support accessible, personalized, and stigma-free through technology-enabled care solutions.

### Key Features
- **Mood Tracking & Analytics** - Daily mood monitoring with insights
- **AI-Powered Journaling** - Intelligent reflection and pattern recognition
- **Professional Consultations** - Secure video therapy sessions
- **Community Support** - Safe forum for shared experiences
- **Crisis Resources** - Immediate support during emergencies
- **Personalized Resources** - Curated mental health content
- **Self-Assessment Tools** - Clinical screening instruments (PHQ-9, GAD-7)

## Technical Architecture

### Frontend Stack
- **Framework**: React Native 0.81.5 with TypeScript 5.9
- **Platform**: Expo 54.0.21 with Expo Router 6.0
- **UI Components**: Custom design system with Expo Vector Icons
- **State Management**: React Context API + Convex Real-time Backend
- **Animation**: React Native Animated API
- **Icons**: Ionicons (@expo/vector-icons)
- **Camera/Media**: Expo Camera, Audio, AV, Image Picker
- **Navigation**: React Navigation 7.x

### Backend Stack
- **Primary Database**: Convex Real-time Backend
- **Secondary Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk with JWT tokens
- **Real-time**: Convex real-time queries and mutations
- **API**: RESTful APIs with Express (fallback)
- **File Storage**: Expo Media Library, File System
- **Video Calls**: Sendbird Calls React Native
- **Push Notifications**: Expo Notifications

## Module Documentation

### 1. **Authentication & Onboarding**
- Multi-step signup process with email verification
- Secure login with session management
- Progressive onboarding experience
- Profile setup and preferences

### 2. **Dashboard & Home**
- Personalized greeting based on time of day
- Quick access to core features
- Recent activity overview
- Mood tracking shortcuts
- Resource recommendations

### 3. **Mood Tracking System**
- 5-point mood scale with emojis
- Intensity scoring (1-5)
- Factor identification (sleep, stress, etc.)
- Historical trends and analytics
- Pattern recognition

### 4. **Journaling Platform**
- Rich text journal entries
- Emotion tagging system
- Search and filtering capabilities
- Privacy controls
- Export functionality

### 5. **Appointment Management**
- Support worker directory
- Availability scheduling
- Session type selection (video/phone/in-person)
- Appointment reminders
- Session notes and follow-ups

### 6. **Community Forum**
- Category-based discussions
- Post creation and moderation
- Comment threading
- Like and bookmark system
- Community guidelines enforcement

### 7. **Messaging System**
- Real-time chat functionality
- Contact management
- Group conversations
- File and image sharing
- Read receipts and typing indicators

### 8. **Video Consultations**
- HIPAA-compliant video calls
- Pre-call technical checks
- In-call chat and tools
- Session recording (with consent)
- Quality monitoring

### 9. **Crisis Support**
- Emergency contact access
- Hotline integration
- Safety planning tools
- Grounding exercises
- Emergency protocol activation

### 10. **Resources Library**
- Categorized mental health content
- Search and filtering
- Personalized recommendations
- Progress tracking
- Bookmark system

### 11. **Self-Assessment**
- Clinical screening tools (PHQ-9, GAD-7)
- Progress tracking over time
- Results interpretation
- Professional referral system
- Crisis detection algorithms

### 12. **Notifications System**
- Multi-type notifications (appointment, message, system)
- Mark-as-read functionality
- Push notification support
- Preference management
- Real-time updates

##  Database Architecture

### Database Architecture (Dual Backend)

#### Convex Tables (Real-time)
- **moods** - Daily mood tracking with real-time sync
- **appointments** - Therapy sessions with live status updates
- **profiles** - Extended user profiles and preferences
- **conversations** - Real-time messaging and chat
- **posts** - Community forum posts with reactions
- **activities** - User activity tracking and analytics
- **announcements** - Organization-specific announcements

#### PostgreSQL Tables (Prisma ORM)
- **Users** - User profiles and authentication (legacy)
- **Sessions** - Authentication sessions (legacy)
- **Journal Entries** - User journal content
- **Resources** - Mental health content library
- **Assessments** - Screening tool results

### Security Features
- Row-level security policies
- Data encryption at rest
- Audit logging for sensitive operations
- Consent management tracking
- Regular security backups

##  API Documentation

### Authentication (Clerk)
- **Multi-factor Authentication**: Email, SMS, Social providers
- **JWT Tokens**: Secure session management
- **Organization Support**: CMHA Calgary, Edmonton, SAIT affiliations
- **Development**: Clerk Dashboard integration

### Convex Functions (Real-time)
```typescript
// Mood Tracking
api.moods.getRecentMoods(userId, limit)
api.moods.getMoodStats(userId, days)
api.moods.recordMood(mood, intensity, factors)

// Appointments
api.appointments.getUserAppointments(userId)
api.appointments.createAppointment(details)
api.appointments.updateAppointmentStatus(id, status)

// Messaging
api.conversations.listForUser()
api.conversations.sendMessage(conversationId, body)
api.conversations.markRead(conversationId)

// Profile Management
api.profiles.getProfile(clerkId)
api.profiles.syncProfile(clerkData)
api.profiles.updatePreferences(clerkId, preferences)

// Community
api.posts.list(category?, limit?)
api.posts.getById(postId)
api.announcements.getForOrg(orgId)
```

### REST API Endpoints (Fallback)
```http
# Legacy endpoints maintained for compatibility
GET/POST /api/mood/entries
GET/POST /api/appointments  
GET/POST /api/conversations
GET /api/resources
GET/POST /api/journal/entries
```

### Real-time Features (Convex-Powered)
- **Live Messaging**: Instant message delivery and read receipts
- **Mood Sync**: Real-time mood tracking across devices
- **Appointment Updates**: Live status changes and notifications
- **Community Feed**: Real-time post updates and reactions
- **Push Notifications**: Expo Notifications with proper scheduling
- **Video Consultations**: Sendbird integration for HIPAA-compliant calls
- **Presence System**: Online/offline status tracking
- **Announcements**: Organization-specific real-time updates

## 🎨 Design System

### Color Palette
- **Primary**: `#7BB8A8` (Calming Teal)
- **Secondary**: `#7FDBDA` (Light Teal)
- **Accent**: `#FF6B6B` (Alert Red)
- **Neutral**: `#F8F9FA` (Background)
- **Text**: `#333333` (Dark Gray)

### Typography Scale
- **Headers**: 24px, 600 weight
- **Body**: 16px, 400 weight
- **Labels**: 14px, 500 weight
- **Small**: 12px, 400 weight

### Component Library
- Reusable UI components with consistent styling
- Accessibility-focused design patterns
- Responsive layouts for various screen sizes

## 🔒 Security & Compliance

### Data Protection
- End-to-end encryption for sensitive data
- HIPAA compliance for health information
- GDPR compliance for EU users
- Regular security audits and penetration testing

### Privacy Features
- Granular privacy controls
- Data anonymization options
- Consent management system
- Right to erasure implementation

## 📈 Analytics & Insights

### User Analytics
- Feature usage tracking
- Engagement metrics
- Retention analysis
- User satisfaction surveys

### Clinical Insights
- Mood pattern recognition
- Intervention effectiveness
- Outcome measurement
- Treatment progress tracking

## 🧪 Testing & Quality Assurance

### Testing Framework
- **Unit Testing**: Jest 30.2.0 with React Native Testing Library
- **Component Testing**: React Test Renderer for snapshot testing
- **E2E Testing**: Detox for end-to-end automation
- **Performance Testing**: Artillery and K6 load testing
- **Coverage**: 70%+ code coverage requirement

### Test Categories
```bash
# Feature-specific tests
npm run test:auth          # Authentication flows
npm run test:moods         # Mood tracking
npm run test:appointments  # Appointment system
npm run test:community     # Community forum
npm run test:crisis        # Crisis support
npm run test:messages      # Messaging system

# Comprehensive testing
npm run test:coverage      # Full coverage report
npm run test:docker        # Containerized testing
npm run test:e2e          # End-to-end testing
```

### Code Quality
- **TypeScript**: Strict mode enabled
- **ESLint**: React Native and TypeScript rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates
- **SonarQube**: Code quality and security analysis

### Development Workflow
1. **Feature Branch**: Create from `dev` branch
2. **Implementation**: TDD approach with tests first
3. **Testing**: Run feature-specific and integration tests
4. **Code Review**: Peer review with quality checklist
5. **CI/CD**: Automated testing and deployment
6. **Monitoring**: Performance and error tracking


---

## 📞 Contact & Team

### Project Leadership
- **Product Manager**: Rhailyn Jane Cona - rhailynjane.cona@edu.sait.ca
- **Technical Lead**: Rhailyn Jane Cona - rhailynjane.cona@edu.sait.ca
- **Mobile Lead Developer**: Anne Marie Ala - AnneMarie.Ala@edu.sait.ca
- **Project Coordinator**: Rhailyn Jane Cona - rhailynjane.cona@edu.sait.ca

### Development Team Structure

#### 🎯 Mobile Development Team
| Role | Team Member | Contact | Primary Responsibilities |
|------|-------------|---------|--------------------------|
| **Lead Mobile Developer** | Rhailyn Jane Cona | rhailynjane.cona@edu.sait.ca | React Native architecture, navigation, core components |
| **Mobile Developer** | Anne Marie Ala | AnneMarie.Ala@edu.sait.ca | UI components, state management, API integration |
| **Mobile/Backend Hybrid** | Rhailyn Jane Cona | rhailynjane.cona@edu.sait.ca | Mobile backend integration, authentication services |

#### 🌐 Web Development Team
| Role | Team Member | Contact | Primary Responsibilities |
|------|-------------|---------|--------------------------|
| **Frontend Lead** | Merilyne Mbong | Nchia.Mbong@edu.sait.ca | React web application, responsive design |
| **Frontend Developer** | Komalpreet Kaur | KomalpreetKaur05@edu.sait.ca | Component development, styling, user interactions |
| **Full Stack Developer** | Samuel Braun | Samuel.R.Braun@edu.sait.ca | Frontend-backend integration, API development |
| **Frontend Developer** | Rhailyn Jane Cona | rhailynjane.cona@edu.sait.ca | Cross-platform consistency, design system implementation |

#### ⚙️ Backend & Database Team
| Role | Team Member | Contact | Primary Responsibilities |
|------|-------------|---------|--------------------------|
| **Backend Lead (Mobile)** | Rhailyn Jane Cona | rhailynjane.cona@edu.sait.ca | Mobile API services, real-time features, WebSocket |
| **Backend Developer (Web)** | Komalpreet Kaur | KomalpreetKaur05@edu.sait.ca | REST API development, business logic, authentication |
| **Database Architect** | Samuel Braun | Samuel.R.Braun@edu.sait.ca | PostgreSQL schema design, queries, optimization, security |

#### 🎨 UX/UI Design Team
| Role | Team Member | Contact | Primary Responsibilities |
|------|-------------|---------|--------------------------|
| **Lead Designer** | Rhailyn Jane Cona | rhailynjane.cona@edu.sait.ca | Design system, user flows, prototyping, accessibility |

#### 🧪 Quality Assurance Team
**All Team Members Participate in QA**
- **Rhailyn Jane Cona**: End-to-end testing, user experience validation
- **Anne Marie Ala**: Mobile functionality testing, UI consistency
- **Merilyne Mbong**: Web application testing, cross-browser compatibility
- **Komalpreet Kaur**: API testing, integration testing, security testing
- **Samuel Braun**: Database testing, performance testing, data integrity

### Team Collaboration Structure

```
SafeSpace Development Team
│
├── Product Management & Technical Leadership
│   └── Rhailyn Jane Cona (Lead)
│
├── Mobile Development Stream
│   ├── Rhailyn Jane Cona (Lead)
│   └── Anne Marie Ala
│
├── Web Development Stream
│   ├── Merilyne Mbong (Frontend Lead)
│   ├── Komalpreet Kaur
│   ├── Samuel Braun
│   └── Rhailyn Jane Cona (Support)
│
├── Backend & Database Stream
│   ├── Rhailyn Jane Cona (Mobile Backend)
│   ├── Komalpreet Kaur (Web Backend)
│   └── Samuel Braun (Database Lead)
│
└── Design & UX Stream
    └── Rhailyn Jane Cona (Lead)
```

### Key Responsibilities Breakdown

#### Rhailyn Jane Cona (Multi-Role Lead)
- **Overall Project Coordination**: Timeline management, feature prioritization
- **Mobile Architecture**: React Native setup, navigation structure, core components
- **Backend Integration**: API design, authentication flow, real-time features
- **Design System**: UI/UX consistency across mobile and web platforms
- **Quality Assurance**: Test strategy, user acceptance testing

#### Anne Marie Ala (Mobile Specialist)
- **Mobile UI Development**: Screen components, layout implementation
- **State Management**: Redux/Context API implementation
- **Mobile-Specific Features**: Camera integration, push notifications
- **Performance Optimization**: Mobile app performance tuning

#### Merilyne Mbong (Web Frontend Lead)
- **Web Application Architecture**: React application structure
- **Responsive Design**: Cross-device compatibility
- **User Interface**: Web component development
- **Web-Specific Features**: Browser compatibility, PWA implementation

#### Komalpreet Kaur (Full Stack Developer)
- **Backend API Development**: RESTful endpoint creation
- **Business Logic**: Application functionality implementation
- **Frontend-Backend Integration**: Data flow management
- **Authentication Services**: Login/registration systems

#### Samuel Braun (Database & Backend Specialist)
- **Database Design**: PostgreSQL schema architecture
- **Query Optimization**: Performance tuning, indexing strategy
- **Data Security**: Encryption, access controls, compliance
- **API Integration**: Database connection management

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: 18+ required
- **Expo CLI**: Latest version
- **iOS Simulator** or **Android Emulator**
- **Clerk Account**: For authentication
- **Convex Account**: For real-time backend

### Installation
```bash
# Clone repository
git clone https://github.com/annieala/SafeSpace-prototype.git
cd SafeSpace-prototype

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
# Configure EXPO_PUBLIC_CONVEX_URL

# Start Convex development server
npm run convex:dev

# Start Expo development server
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific feature tests
npm run test:auth
npm run test:moods

# Docker testing
npm run test:docker
```

---

**Last Updated**: November 26, 2024
**Version**: 1.2.0
**Current Branch**: mobile-testing-docker  
**Documentation Maintainer**: Rhailyn Jane Cona

*For technical support or questions about this documentation, please contact the development team.*
