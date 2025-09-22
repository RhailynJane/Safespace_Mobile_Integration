/**
* LLM Prompt: Create comprehensive React Native component documentation covering frontend implementation details and backend integration specs including PostgreSQL schema design and REST API endpoints. 
* Reference: chat.deepseek.com
*/

# SafeSpace Authentication Flow - Authentication Documentation

## 📱 Frontend Authentication Components

### 1. LoginScreen Component
**File**: `app/(auth)/login.tsx`

**Purpose**: User authentication with email and password

**Key Features**:
- Email and password validation
- Password visibility toggle
- Loading states during authentication
- Navigation to signup and password reset
- Keyboard-avoiding behavior for iOS/Android

**Form Validation**:
```typescript
// Client-side validation
if (!email.trim()) {
  setEmailError("Email is required");
  return;
}
if (!password.trim()) {
  setPasswordError("Password is required");
  return;
}
```

**Mock Authentication Flow**:
```typescript
const signIn = async (email: string, password: string) => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
  return { error: null }; // Demo success
};
```

**UI Components**:
- **Toggle Container**: Switch between Sign In/Sign Up modes
- **Input Fields**: Styled with icons and error handling
- **Sign In Button**: Disabled during loading state
- **Footer Links**: Navigation to signup and password reset

---

### 2. SignupScreen Component
**File**: `app/(auth)/signup.tsx`

**Purpose**: Multi-step user registration process

**Key Features**:
- 4-step progressive form (Personal → Password → Verification → Success)
- State management for form data across steps
- Back navigation between steps
- Error handling and loading states

**Step Flow**:
1. **Personal Information** (`personal`)
   - Collects name, email, age, phone number
   - Uses `PersonalInfoStep` component

2. **Password Setup** (`password`)
   - Password creation with real-time validation
   - Uses `PasswordStep` component
   - Simulates API call for account creation

3. **Email Verification** (`verification`)
   - Mock email verification process
   - Resend functionality with cooldown
   - Uses `EmailVerificationStep` component

4. **Success Screen** (`success`)
   - Confirmation of successful registration
   - Navigation to login screen
   - Uses `SuccessStep` component

**State Management**:
```typescript
interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  phoneNumber: string;
  password: string;
  verificationCode: string;
}

const [signupData, setSignupData] = useState<SignupData>({...});
const updateSignupData = (data: Partial<SignupData>) => {
  setSignupData((prev) => ({ ...prev, ...data }));
};
```

---

### 3. ForgotPasswordScreen Component
**File**: `app/(auth)/forgot-password.tsx`

**Purpose**: Password reset flow with email verification

**Key Features**:
- Email validation with format checking
- Mock password reset API simulation
- Success confirmation with alert
- Back navigation to login

**Validation Logic**:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email.trim())) {
  setEmailError("Please enter a valid email address");
  return;
}
```

**Success Flow**:
- Shows success message
- Displays confirmation alert
- Navigates back to login on alert dismissal

---

## 🗄️ Backend Database Schema

### Users Table (PostgreSQL)
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
    verification_token_expires_at TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);
```

### Sessions Table (For Authentication)
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
```

### Password Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
```

---

## 🔌 API Endpoints Specification

### Authentication Endpoints

#### 1. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userpassword123"
}

Response (200):
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": true
  },
  "sessionToken": "jwt_token_here",
  "expiresIn": 86400
}

Response (401):
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### 2. User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "age": 25,
  "phoneNumber": "+1234567890"
}

Response (201):
{
  "success": true,
  "userId": "uuid",
  "message": "Registration successful. Verification email sent."
}

Response (400):
{
  "success": false,
  "error": "Email already exists"
}
```

#### 3. Email Verification
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}

Response (200):
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 4. Password Reset Request
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### 5. Password Reset Confirmation
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## 🔐 Security Implementation

### Password Hashing (bcrypt)
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;

// Hash password during registration
const hashPassword = async (password) => {
  return await bcrypt.hash(password, saltRounds);
};

// Verify password during login
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### JWT Token Generation
```javascript
const jwt = require('jsonwebtoken');

const generateAuthToken = (userId) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const generateVerificationToken = (userId) => {
  return jwt.sign(
    { userId, type: 'verification' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};
```

### Email Service Integration
```javascript
class EmailService {
  async sendVerificationEmail(userEmail, verificationToken) {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
    
    // Implementation for sending email via SMTP or email service
    // This would integrate with services like SendGrid, AWS SES, etc.
  }

  async sendPasswordResetEmail(userEmail, resetToken) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    // Password reset email implementation
  }
}
```

---

## 🗃️ Database Connection Configuration

### Environment Variables
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/safespace_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=safespace_db
DB_USER=safespace_user
DB_PASSWORD=secure_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password

# App Configuration
APP_URL=https://your-app.com
```

### PostgreSQL Connection Pool
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection fails
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Error handling for pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
```

### Database Service Functions

#### User Service
```javascript
class UserService {
  async createUser(userData) {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, age, phone_number, verification_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, created_at
    `;
    
    const values = [
      userData.email,
      await hashPassword(userData.password),
      userData.firstName,
      userData.lastName,
      userData.age,
      userData.phoneNumber,
      generateVerificationToken() // Store token for email verification
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async verifyUserEmail(token) {
    const query = `
      UPDATE users 
      SET email_verified = true, verification_token = NULL 
      WHERE verification_token = $1 
      RETURNING id, email
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }
}
```

#### Authentication Service
```javascript
class AuthService {
  async authenticateUser(email, password) {
    const user = await userService.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    if (!user.email_verified) {
      throw new Error('Email not verified');
    }

    return user;
  }

  async createSession(userId) {
    const sessionToken = generateAuthToken(userId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const query = `
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING session_token, expires_at
    `;
    
    const result = await pool.query(query, [userId, sessionToken, expiresAt]);
    return result.rows[0];
  }
}
```

This documentation provides comprehensive coverage of both frontend authentication components and backend database integration for the SafeSpace mental health app's authentication system.