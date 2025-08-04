# 📚 Quiz English Platform - Development Guide

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Frontend Components](#frontend-components)
8. [Authentication & Authorization](#authentication--authorization)
9. [Development Setup](#development-setup)
10. [Deployment Guide](#deployment-guide)
11. [Troubleshooting](#troubleshooting)
12. [Adding New Features](#adding-new-features)
13. [Maintenance Tasks](#maintenance-tasks)

---

## 🎯 System Overview

Quiz English adalah platform pembelajaran bahasa Inggris berbasis web dengan 3 role pengguna:

- **Student**: Mengerjakan quiz dan melihat progress
- **Tutor**: Membuat soal dan memberikan feedback
- **Super Tutor**: Mengelola sistem dan pengguna

### Key Features:

- ✅ Multi-role authentication system
- ✅ Interactive quiz system dengan timer
- ✅ Real-time progress tracking dengan charts
- ✅ Feedback system antara tutor dan student
- ✅ Analytics dashboard untuk setiap role
- ✅ Responsive design (mobile-friendly)
- ✅ File upload untuk gambar dan audio

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React +      │◄──►│   (Supabase)    │◄──►│   (PostgreSQL)  │
│   Vite)         │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Supabase      │    │   File Storage  │
│   (Hosting)     │    │   (Auth + API)  │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow:

1. **User Authentication**: Supabase Auth handles login/logout
2. **API Calls**: Frontend calls Supabase REST API
3. **Real-time Updates**: Supabase Realtime untuk live updates
4. **File Storage**: Supabase Storage untuk gambar/audio
5. **Database**: PostgreSQL dengan Row Level Security (RLS)

---

## 🛠️ Technology Stack

### Frontend:

- **React 18** - UI Library
- **Vite** - Build tool dan dev server
- **React Router** - Client-side routing
- **Chart.js + react-chartjs-2** - Data visualization
- **Lucide React** - Icon library
- **React Toastify** - Notifications
- **Tailwind CSS** - Utility-first CSS framework

### Backend:

- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data security
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage

### Deployment:

- **Vercel** - Frontend hosting
- **Supabase Cloud** - Backend hosting

---

## 📁 Project Structure

```
English-Quiz/
├── public/                     # Static files
│   ├── user-guide.html        # User documentation
│   └── favicon.ico
├── src/                       # Source code
│   ├── components/            # Reusable components
│   │   ├── Loading.jsx       # Loading spinner
│   │   └── Navbar.jsx        # Navigation bar
│   ├── contexts/             # React contexts
│   │   └── AuthContext.jsx   # Authentication context
│   ├── lib/                  # Utilities
│   │   └── supabase.js       # Supabase client config
│   ├── pages/                # Page components
│   │   ├── Login.jsx         # Login page
│   │   ├── Register.jsx      # Registration page
│   │   ├── StudentDashboard.jsx
│   │   ├── TutorDashboard.jsx
│   │   ├── SuperTutorDashboard.jsx
│   │   ├── QuizTaking.jsx    # Quiz interface
│   │   ├── QuizResults.jsx   # Results page
│   │   ├── QuestionManagement.jsx
│   │   ├── FeedbackManagement.jsx
│   │   ├── UserManagement.jsx
│   │   └── StudentProgress.jsx
│   ├── services/             # API services
│   │   └── supabaseService.js # All API calls
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── supabase/                 # Database migrations
│   ├── migrations/           # SQL migration files
│   └── instruction/          # Setup guides
├── package.json              # Dependencies
├── vite.config.js           # Vite configuration
├── vercel.json              # Vercel deployment config
└── README.md                # Project overview
```

---

## 🗄️ Database Schema

### Core Tables:

#### 1. users (extends auth.users)

```sql
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. categories

```sql
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. difficulty_levels

```sql
CREATE TABLE public.difficulty_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);
```

#### 4. questions

```sql
CREATE TABLE public.questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id),
    difficulty_id INTEGER REFERENCES public.difficulty_levels(id),
    question_text TEXT NOT NULL,
    explanation TEXT,
    image_url TEXT,
    audio_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. question_options

```sql
CREATE TABLE public.question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0
);
```

#### 6. quiz_attempts

```sql
CREATE TABLE public.quiz_attempts (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES public.users(id),
    category_id INTEGER REFERENCES public.categories(id),
    difficulty_id INTEGER REFERENCES public.difficulty_levels(id),
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0,
    time_taken INTEGER, -- in seconds
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false
);
```

#### 7. quiz_answers

```sql
CREATE TABLE public.quiz_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES public.questions(id),
    selected_option_id INTEGER REFERENCES public.question_options(id),
    is_correct BOOLEAN DEFAULT false,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 8. feedback

```sql
CREATE TABLE public.feedback (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES public.quiz_attempts(id),
    student_id UUID REFERENCES public.users(id),
    tutor_id UUID REFERENCES public.users(id),
    feedback_text TEXT NOT NULL,
    recommendations TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Relationships:

- **users** ←→ **questions** (created_by)
- **categories** ←→ **questions** (category_id)
- **difficulty_levels** ←→ **questions** (difficulty_id)
- **questions** ←→ **question_options** (question_id)
- **users** ←→ **quiz_attempts** (student_id)
- **quiz_attempts** ←→ **quiz_answers** (attempt_id)
- **quiz_attempts** ←→ **feedback** (attempt_id)

---

## 🔌 API Documentation

### Authentication Endpoints:

#### Login

```javascript
// File: src/services/supabaseService.js
const authService = {
  async login(credentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.username + "@quiz.com", // Convert username to email
      password: credentials.password,
    });
    return { data, error };
  },
};
```

#### Register

```javascript
async register(userData) {
  const { data, error } = await supabase.auth.signUp({
    email: userData.username + '@quiz.com',
    password: userData.password,
    options: {
      data: {
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role
      }
    }
  });
  return { data, error };
}
```

### Quiz Endpoints:

#### Get Available Quizzes

```javascript
const categoriesService = {
  async getAvailableQuizzes() {
    const { data, error } = await supabase
      .from("categories")
      .select(
        `
        id, name, description,
        difficulties:difficulty_levels(
          id, name,
          question_count:questions(count)
        )
      `
      )
      .eq("is_active", true);

    return { success: !error, data, error };
  },
};
```

#### Submit Quiz Attempt

```javascript
const quizService = {
  async submitQuizAttempt(attemptData) {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        student_id: attemptData.student_id,
        category_id: attemptData.category_id,
        difficulty_id: attemptData.difficulty_id,
        total_questions: attemptData.total_questions,
        correct_answers: attemptData.correct_answers,
        score: attemptData.score,
        time_taken: attemptData.time_taken,
        completed_at: new Date().toISOString(),
        is_completed: true,
      })
      .select()
      .single();

    return { success: !error, data, error };
  },
};
```

### Question Management:

#### Create Question

```javascript
const questionsService = {
  async createQuestion(questionData) {
    // Insert question
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        category_id: questionData.category_id,
        difficulty_id: questionData.difficulty_id,
        question_text: questionData.question_text,
        explanation: questionData.explanation,
        created_by: questionData.created_by,
      })
      .select()
      .single();

    if (questionError) return { success: false, error: questionError };

    // Insert options
    const optionsData = questionData.options.map((option, index) => ({
      question_id: question.id,
      option_text: option.text,
      is_correct: option.is_correct,
      order_index: index,
    }));

    const { error: optionsError } = await supabase
      .from("question_options")
      .insert(optionsData);

    return { success: !optionsError, data: question, error: optionsError };
  },
};
```

### Analytics Endpoints:

#### Get Student Progress

```javascript
const analyticsService = {
  async getStudentProgress(studentId) {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(
        `
        id, score, completed_at,
        categories(name),
        difficulty_levels(name)
      `
      )
      .eq("student_id", studentId)
      .eq("is_completed", true)
      .order("completed_at", { ascending: false });

    return { success: !error, data, error };
  },
};
```

#### Get System Analytics

```javascript
async getSystemAnalytics() {
  const [usersResult, questionsResult, attemptsResult] = await Promise.all([
    supabase.from('users').select('role'),
    supabase.from('questions').select('id'),
    supabase.from('quiz_attempts').select('score').eq('is_completed', true)
  ]);

  const analytics = {
    totalUsers: usersResult.data?.length || 0,
    totalQuestions: questionsResult.data?.length || 0,
    totalQuizzes: attemptsResult.data?.length || 0,
    averageScore: attemptsResult.data?.length > 0
      ? Math.round(attemptsResult.data.reduce((sum, attempt) => sum + attempt.score, 0) / attemptsResult.data.length)
      : 0,
    userStats: usersResult.data?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {}) || {}
  };

  return { success: true, data: analytics };
}
```

---

## 🎨 Frontend Components

### 1. AuthContext (src/contexts/AuthContext.jsx)

```javascript
// Manages global authentication state
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. Dashboard Components

#### StudentDashboard.jsx

- **Purpose**: Main dashboard untuk student
- **Features**:
  - Statistics cards (total attempts, average score, best score)
  - Performance charts (Line chart untuk recent scores)
  - Available quizzes grid
  - Recent results list
  - Feedback dari tutor

#### TutorDashboard.jsx

- **Purpose**: Dashboard untuk tutor
- **Features**:
  - Statistics overview (total students, questions, attempts)
  - Student performance charts
  - Recent students list
  - Recent questions created
  - Quick actions (create question, give feedback)

#### SuperTutorDashboard.jsx

- **Purpose**: Admin dashboard
- **Features**:
  - Platform-wide statistics
  - User growth charts
  - Users by role distribution
  - System health indicators
  - User management tools

### 3. Quiz Components

#### QuizTaking.jsx

```javascript
// Key features:
- Timer functionality
- Question navigation
- Auto-save answers
- Progress indicator
- Submit confirmation

const QuizTaking = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save answers
  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
};
```

#### QuizResults.jsx

- **Purpose**: Menampilkan hasil quiz
- **Features**:
  - Score display dengan color coding
  - Question-by-question review
  - Correct/incorrect indicators
  - Explanations untuk setiap jawaban
  - Feedback dari tutor (jika ada)

### 4. Management Components

#### QuestionManagement.jsx

```javascript
// Features:
- CRUD operations untuk questions
- Category dan difficulty filtering
- Bulk operations
- Image/audio upload
- Preview mode

const QuestionForm = () => {
  const [formData, setFormData] = useState({
    category_id: '',
    difficulty_id: '',
    question_text: '',
    explanation: '',
    options: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await questionsService.createQuestion(formData);
    if (result.success) {
      toast.success('Question created successfully!');
      resetForm();
    }
  };
};
```

---

## 🔐 Authentication & Authorization

### Row Level Security (RLS) Policies:

#### Users Table

```sql
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Super tutors can read all users
CREATE POLICY "Super tutors can read all users" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_tutor'
  )
);
```

#### Questions Table

```sql
-- Anyone can read active questions
CREATE POLICY "Anyone can read active questions" ON public.questions
FOR SELECT USING (is_active = true);

-- Tutors and super tutors can create questions
CREATE POLICY "Tutors can create questions" ON public.questions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('tutor', 'super_tutor')
  )
);
```

#### Quiz Attempts Table

```sql
-- Students can read their own attempts
CREATE POLICY "Students can read own attempts" ON public.quiz_attempts
FOR SELECT USING (student_id = auth.uid());

-- Students can create their own attempts
CREATE POLICY "Students can create attempts" ON public.quiz_attempts
FOR INSERT WITH CHECK (student_id = auth.uid());
```

### Frontend Route Protection:

```javascript
// src/App.jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.user_metadata?.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Usage:
<Route
  path="/admin/*"
  element={
    <ProtectedRoute allowedRoles={["super_tutor"]}>
      <SuperTutorDashboard />
    </ProtectedRoute>
  }
/>;
```

---

## 🚀 Development Setup

### Prerequisites:

- Node.js 18+
- npm atau yarn
- Git
- Supabase account

### Local Development:

1. **Clone Repository**

```bash
git clone <repository-url>
cd English-Quiz
```

2. **Install Dependencies**

```bash
npm install
```

3. **Environment Setup**

```bash
# Create .env file
cp .env.example .env

# Add your Supabase credentials:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database Setup**

```bash
# Run migrations in Supabase SQL Editor
# Execute files in order:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
# 3. supabase/migrations/003_functions.sql
# 4. supabase/migrations/004_sample_data.sql
```

5. **Start Development Server**

```bash
npm run dev
```

### Development Commands:

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## 🌐 Deployment Guide

### Vercel Deployment:

1. **Connect Repository**

   - Login ke Vercel
   - Import project dari GitHub
   - Select English-Quiz repository

2. **Environment Variables**

```bash
# Add in Vercel dashboard:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Build Settings**

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

4. **Deploy**
   - Push ke main branch
   - Vercel akan auto-deploy
   - Check deployment logs untuk errors

### Supabase Setup:

1. **Create Project**

   - Login ke Supabase
   - Create new project
   - Note down URL dan anon key

2. **Run Migrations**

   - Go to SQL Editor
   - Run migration files in order
   - Enable RLS pada semua tables

3. **Configure Auth**
   - Go to Authentication > Settings
   - Configure email templates
   - Set up redirect URLs

---

## 🔧 Troubleshooting

### Common Issues:

#### 1. Authentication Issues

```javascript
// Problem: User not persisting after refresh
// Solution: Check AuthContext implementation

// Problem: RLS blocking queries
// Solution: Verify policies in Supabase

// Problem: Login failing
// Solution: Check email format conversion
const email = username + "@quiz.com";
```

#### 2. Database Issues

```sql
-- Problem: Foreign key constraints
-- Solution: Check data integrity

-- Problem: RLS policies too restrictive
-- Solution: Test policies in SQL editor
SELECT * FROM public.users WHERE auth.uid() = id;
```

#### 3. Build Issues

```bash
# Problem: Build failing on Vercel
# Solution: Check environment variables

# Problem: Import errors
# Solution: Check file paths and extensions
import Component from './Component.jsx'; // Include .jsx
```

#### 4. Performance Issues

```javascript
// Problem: Slow queries
// Solution: Add indexes and optimize queries

// Problem: Large bundle size
// Solution: Implement code splitting
const LazyComponent = lazy(() => import("./Component"));
```

### Debug Tools:

#### 1. Supabase Logs

```javascript
// Enable debug mode
const supabase = createClient(url, key, {
  auth: {
    debug: true,
  },
});
```

#### 2. React DevTools

- Install React DevTools extension
- Check component state dan props
- Monitor re-renders

#### 3. Network Tab

- Check API calls
- Verify request/response data
- Monitor loading times

---

## ➕ Adding New Features

### 1. Adding New Page

#### Step 1: Create Component

```javascript
// src/pages/NewFeature.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const NewFeature = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // API call here
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container">
      <div className="main-content">
        <h1>New Feature</h1>
        {/* Content here */}
      </div>
    </div>
  );
};

export default NewFeature;
```

#### Step 2: Add Route

```javascript
// src/App.jsx
import NewFeature from "./pages/NewFeature";

// Add to routes:
<Route
  path="/new-feature"
  element={
    <ProtectedRoute allowedRoles={["tutor", "super_tutor"]}>
      <NewFeature />
    </ProtectedRoute>
  }
/>;
```

#### Step 3: Add Navigation

```javascript
// src/components/Navbar.jsx
// Add menu item:
{
  user?.user_metadata?.role === "tutor" && (
    <Link to="/new-feature" className="nav-link">
      New Feature
    </Link>
  );
}
```

### 2. Adding New API Endpoint

#### Step 1: Database Changes

```sql
-- Add new table or columns
ALTER TABLE existing_table ADD COLUMN new_field TEXT;

-- Add RLS policy
CREATE POLICY "Policy name" ON table_name
FOR SELECT USING (condition);
```

#### Step 2: Service Function

```javascript
// src/services/supabaseService.js
const newService = {
  async getNewData(params) {
    const { data, error } = await supabase
      .from("table_name")
      .select("*")
      .eq("field", params.value);

    return { success: !error, data, error };
  },

  async createNewData(newData) {
    const { data, error } = await supabase
      .from("table_name")
      .insert(newData)
      .select()
      .single();

    return { success: !error, data, error };
  },
};

export { newService };
```

#### Step 3: Frontend Integration

```javascript
// In component:
import { newService } from "../services/supabaseService";

const handleCreate = async (formData) => {
  const result = await newService.createNewData(formData);
  if (result.success) {
    toast.success("Created successfully!");
    // Update UI
  } else {
    toast.error("Error creating data");
  }
};
```

### 3. Adding New Chart Type

```javascript
// Install chart library if needed
npm install react-chartjs-2 chart.js

// Create chart component
import { Pie } from 'react-chartjs-2';

const NewChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [{
      data: data.map(item => item.value),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div style={{ height: '300px' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};
```

---

## 🔧 Maintenance Tasks

### Daily Tasks:

- [ ] Check error logs di Vercel dan Supabase
- [ ] Monitor database performance
- [ ] Check user feedback/reports

### Weekly Tasks:

- [ ] Review dan update dependencies
- [ ] Backup database
- [ ] Check security alerts
- [ ] Review performance metrics

### Monthly Tasks:

- [ ] Update documentation
- [ ] Review dan optimize queries
- [ ] Clean up unused files/code
- [ ] Security audit

### Database Maintenance:

#### 1. Backup

```sql
-- Create backup (run in Supabase dashboard)
-- Go to Settings > Database > Backups
-- Enable automatic backups
```

#### 2. Performance Monitoring

```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### 3. Index Optimization

```sql
-- Check missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100;

-- Add indexes as needed
CREATE INDEX idx_quiz_attempts_student_completed
ON quiz_attempts(student_id, completed_at)
WHERE is_completed = true;
```

### Code Maintenance:

#### 1. Dependency Updates

```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Check for security vulnerabilities
npm audit
npm audit fix
```

#### 2. Code Quality

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Check bundle size
npm run build
npx bundlesize
```

#### 3. Performance Optimization

```javascript
// Implement code splitting
const LazyComponent = React.lazy(() => import("./Component"));

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Optimize re-renders
const MemoizedComponent = React.memo(Component);
```

---

## 📝 Best Practices

### 1. Code Organization

- Gunakan consistent naming conventions
- Separate concerns (components, services, utilities)
- Keep components small dan focused
- Use TypeScript untuk better type safety (optional)

### 2. Database Design

- Always use RLS policies
- Create proper indexes
- Normalize data appropriately
- Use foreign key constraints

### 3. Security

- Never expose sensitive data di frontend
- Validate input di backend
- Use parameterized queries
- Implement proper authentication

### 4. Performance

- Implement pagination untuk large datasets
- Use lazy loading untuk components
- Optimize images dan assets
- Cache frequently accessed data

### 5. Error Handling

```javascript
// Always handle errors gracefully
try {
  const result = await apiCall
```
