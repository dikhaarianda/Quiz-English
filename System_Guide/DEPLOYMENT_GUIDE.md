# 🚀 Quiz English Platform - Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Frontend Deployment](#frontend-deployment)
5. [Backend Configuration](#backend-configuration)
6. [Domain & SSL Setup](#domain--ssl-setup)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Accounts:
- **GitHub Account** - For code repository
- **Vercel Account** - For frontend hosting
- **Supabase Account** - For backend services
- **Domain Provider** (optional) - For custom domain

### Required Tools:
- **Node.js 18+** - Runtime environment
- **Git** - Version control
- **npm/yarn** - Package manager
- **VS Code** (recommended) - Code editor

---

## 🌍 Environment Setup

### 1. Development Environment
```bash
# Clone repository
git clone <repository-url>
cd English-Quiz

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add environment variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Environment Variables
```bash
# .env.local (Development)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# .env.production (Production)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "deploy": "npm run build && vercel --prod"
  }
}
```

---

## 🗄️ Database Setup

### 1. Create Supabase Project
```bash
# Go to https://supabase.com
# Click "New Project"
# Choose organization and region
# Set database password
# Wait for project initialization
```

### 2. Run Database Migrations
```sql
-- Execute in Supabase SQL Editor in order:

-- 1. Initial Schema
-- File: supabase/migrations/001_initial_schema.sql
-- Creates all tables and relationships

-- 2. RLS Policies
-- File: supabase/migrations/002_rls_policies.sql
-- Sets up Row Level Security

-- 3. Functions
-- File: supabase/migrations/003_functions.sql
-- Creates database functions

-- 4. Sample Data
-- File: supabase/migrations/004_sample_data.sql
-- Inserts initial data

-- 5. Storage Setup
-- File: supabase/migrations/005_storage_setup.sql
-- Configures file storage

-- 6. Demo Users
-- File: supabase/migrations/006_create_demo_users.sql
-- Creates demo accounts
```

### 3. Configure Authentication
```sql
-- In Supabase Dashboard > Authentication > Settings

-- Email Templates:
-- Customize confirmation and reset password emails

-- URL Configuration:
-- Site URL: https://your-domain.com
-- Redirect URLs: https://your-domain.com/auth/callback

-- Providers:
-- Enable Email provider
-- Configure social providers if needed
```

### 4. Setup Storage
```sql
-- In Supabase Dashboard > Storage

-- Create bucket 'quiz-files'
-- Set public access for images
-- Configure upload policies

-- Storage policies:
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view files" ON storage.objects
FOR SELECT USING (true);
```

---

## 🌐 Frontend Deployment

### 1. Vercel Deployment (Recommended)

#### Automatic Deployment:
```bash
# Connect GitHub repository to Vercel
# 1. Go to vercel.com
# 2. Click "New Project"
# 3. Import from GitHub
# 4. Select English-Quiz repository
# 5. Configure build settings
```

#### Manual Deployment:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

#### Vercel Configuration:
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {
    "app/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### 2. Alternative Deployment Options

#### Netlify:
```bash
# Build command: npm run build
# Publish directory: dist
# Environment variables: Same as Vercel

# _redirects file for SPA routing
echo "/*    /index.html   200" > dist/_redirects
```

#### GitHub Pages:
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json
"homepage": "https://username.github.io/English-Quiz",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

---

## ⚙️ Backend Configuration

### 1. Supabase Project Settings
```sql
-- Database Settings
-- Connection pooling: Enable
-- Connection limit: 100
-- Statement timeout: 8000ms

-- API Settings
-- Auto-generate API docs: Enable
-- API URL: https://your-project.supabase.co/rest/v1/
-- GraphQL URL: https://your-project.supabase.co/graphql/v1
```

### 2. Security Configuration
```sql
-- RLS Policies Review
-- Ensure all tables have proper RLS policies
-- Test policies with different user roles

-- API Keys Management
-- Use anon key for frontend
-- Keep service_role key secure
-- Rotate keys periodically
```

### 3. Performance Optimization
```sql
-- Database Indexes
CREATE INDEX CONCURRENTLY idx_quiz_attempts_student_date 
ON quiz_attempts(student_id, completed_at DESC) 
WHERE is_completed = true;

CREATE INDEX CONCURRENTLY idx_questions_category_difficulty 
ON questions(category_id, difficulty_id) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_feedback_student_created 
ON feedback(student_id, created_at DESC);

-- Connection Pooling
-- Enable in Supabase Dashboard > Settings > Database
-- Set appropriate pool size based on usage
```

---

## 🌐 Domain & SSL Setup

### 1. Custom Domain Configuration
```bash
# In Vercel Dashboard:
# 1. Go to Project Settings > Domains
# 2. Add custom domain
# 3. Configure DNS records

# DNS Configuration:
# Type: CNAME
# Name: www (or @)
# Value: cname.vercel-dns.com
```

### 2. SSL Certificate
```bash
# Vercel automatically provides SSL certificates
# Certificate auto-renewal is handled by Vercel
# Force HTTPS redirect is enabled by default
```

### 3. Supabase Custom Domain (Optional)
```bash
# For custom API domain:
# 1. Go to Supabase Dashboard > Settings > API
# 2. Add custom domain
# 3. Configure DNS CNAME record
# 4. Update environment variables
```

---

## 📊 Monitoring & Logging

### 1. Vercel Analytics
```bash
# Enable in Vercel Dashboard:
# 1. Go to Project > Analytics
# 2. Enable Web Analytics
# 3. View performance metrics
```

### 2. Supabase Monitoring
```sql
-- Database Metrics
-- Monitor in Supabase Dashboard > Reports
-- Track query performance
-- Monitor connection usage
-- Check error rates

-- Custom Logging
CREATE TABLE public.application_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Error Tracking
```javascript
// Frontend Error Tracking
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to logging service
});

// API Error Logging
const logError = async (error, context) => {
  await supabase
    .from('application_logs')
    .insert({
      level: 'ERROR',
      message: error.message,
      user_id: user?.id,
      metadata: { context, stack: error.stack }
    });
};
```

### 4. Performance Monitoring
```javascript
// Web Vitals Tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

## 💾 Backup Strategy

### 1. Database Backup
```sql
-- Automatic Backups (Supabase Pro)
-- Daily backups retained for 7 days
-- Weekly backups retained for 4 weeks
-- Monthly backups retained for 3 months

-- Manual Backup
-- Go to Supabase Dashboard > Settings > Database
-- Click "Create backup"
-- Download backup file
```

### 2. Code Backup
```bash
# Git Repository Backup
# Primary: GitHub repository
# Mirror: GitLab or Bitbucket (optional)

# Automated backup script
#!/bin/bash
git push origin main
git push backup main  # backup remote
```

### 3. File Storage Backup
```javascript
// Backup uploaded files
const backupFiles = async () => {
  const { data: files } = await supabase.storage
    .from('quiz-files')
    .list();
    
  // Download and backup files to external storage
  for (const file of files) {
    const { data } = await supabase.storage
      .from('quiz-files')
      .download(file.name);
    
    // Save to backup location
  }
};
```

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build project
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### 2. Database Migration Pipeline
```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  push:
    paths:
      - 'supabase/migrations/**'
    branches: [ main ]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run migrations
      run: |
        # Install Supabase CLI
        npm install -g @supabase/cli
        
        # Run migrations
        supabase db push --db-url ${{ secrets.DATABASE_URL }}
```

### 3. Automated Testing
```javascript
// tests/api.test.js
import { describe, it, expect } from 'vitest';
import { authService, questionsService } from '../src/services/supabaseService';

describe('API Tests', () => {
  it('should login successfully', async () => {
    const result = await authService.login({
      username: 'test_user',
      password: 'test_password'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.user).toBeDefined();
  });
  
  it('should fetch questions', async () => {
    const result = await questionsService.getQuestions({ limit: 5 });
    
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });
});
```

---

## 🔧 Troubleshooting

### 1. Common Deployment Issues

#### Build Failures:
```bash
# Issue: Build fails with dependency errors
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Issue: Environment variables not found
# Solution: Check Vercel environment variables
vercel env ls
vercel env add VARIABLE_NAME
```

#### Database Connection Issues:
```sql
-- Issue: RLS blocking queries
-- Solution: Check policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Issue: Connection pool exhausted
-- Solution: Optimize queries and increase pool size
-- In Supabase Dashboard > Settings > Database
```

### 2. Performance Issues
```javascript
// Issue: Slow page loads
// Solution: Implement code splitting
const LazyComponent = React.lazy(() => import('./Component'));

// Issue: Large bundle size
// Solution: Analyze bundle
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/assets/*.js
```

### 3. SSL/Domain Issues
```bash
# Issue: SSL certificate not working
# Solution: Check DNS propagation
nslookup your-domain.com

# Issue: Custom domain not working
# Solution: Verify DNS records
dig your-domain.com CNAME
```

### 4. Database Performance
```sql
-- Issue: Slow queries
-- Solution: Add indexes
EXPLAIN ANALYZE SELECT * FROM quiz_attempts WHERE student_id = 'uuid';

-- Add appropriate index
CREATE INDEX CONCURRENTLY idx_quiz_attempts_student 
ON quiz_attempts(student_id);

-- Issue: High memory usage
-- Solution: Optimize queries
-- Use LIMIT and pagination
-- Avoid SELECT *
-- Use appropriate JOINs
```

---

## 📋 Deployment Checklist

### Pre-Deployment:
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup created

### Deployment:
- [ ] Build successful
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] SSL certificate active
- [ ] Domain configured

### Post-Deployment:
- [ ] Application accessible
- [ ] All features working
- [ ] Performance metrics normal
- [ ] Error logs checked
- [ ] Monitoring active

### Rollback Plan:
- [ ] Previous version tagged
- [ ] Database rollback script ready
- [ ] Rollback procedure documented
- [ ] Team notified of rollback process

---

## 🚀 Production Optimization

### 1. Performance Optimization
```javascript
// Code splitting
const routes = [
  {
    path: '/student',
    component: lazy(() => import('./pages/StudentDashboard'))
  },
  {
    path: '/tutor',
    component: lazy(() => import('./pages/TutorDashboard'))
  }
];

// Image optimization
const optimizeImage = (file) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Resize and compress image
};
```

### 2. Caching Strategy
```javascript
// Service Worker for caching
// sw.js
const CACHE_NAME = 'quiz-app-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### 3. Security Headers
```javascript
// vercel.json security headers
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

Dokumentasi deployment ini memberikan panduan lengkap untuk men-deploy aplikasi Quiz English dari development hingga production, termasuk monitoring dan maintenance yang diperlukan.
