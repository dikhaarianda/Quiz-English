# Supabase Backend Setup Guide

This guide will help you set up the complete Supabase backend for the English Quiz Platform.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js installed on your machine
3. Git (optional, for version control)

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: English Quiz Platform
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be set up (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (something like `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Configure Environment Variables

1. In your project root, copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Set Up the Database

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order:

   **Migration 1: Initial Schema**

   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste into SQL Editor and run

   **Migration 2: RLS Policies**

   - Copy the contents of `supabase/migrations/002_rls_policies.sql`
   - Paste into SQL Editor and run

   **Migration 3: Functions**

   - Copy the contents of `supabase/migrations/003_functions.sql`
   - Paste into SQL Editor and run

   **Migration 4: Sample Data**

   - Copy the contents of `supabase/migrations/004_sample_data.sql`
   - Paste into SQL Editor and run

   **Migration 5: Storage Setup**

   - Copy the contents of `supabase/migrations/005_storage_setup.sql`
   - Paste into SQL Editor and run

### Option B: Using Supabase CLI (Advanced)

1. Install Supabase CLI:

   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:

   ```bash
   supabase login
   ```

3. Link your project:

   ```bash
   supabase link --project-ref your-project-id
   ```

4. Push migrations:
   ```bash
   supabase db push
   ```

## Step 6: Configure Authentication

1. In Supabase dashboard, go to **Authentication** > **Settings**
2. Configure the following:

   **Site URL**: `http://localhost:5173` (for development)

   **Redirect URLs**: Add these URLs:

   - `http://localhost:5173`
   - `http://localhost:5173/auth/callback`
   - Your production URL when ready

3. **Email Templates** (Optional):
   - Customize the email templates for registration confirmation
   - Go to **Authentication** > **Email Templates**

## Step 7: Set Up Storage Buckets

The storage buckets should be created automatically by the migration. Verify in **Storage** section:

- `avatars` - For user profile pictures
- `question-images` - For question images
- `question-audio` - For audio questions
- `feedback-files` - For feedback attachments

## Step 8: Create Test Users (Optional)

You can create test users through the application or manually in the dashboard:

1. Go to **Authentication** > **Users**
2. Click "Add user"
3. Create users with different roles:
   - **Student**: `student@test.com` / `password123`
   - **Tutor**: `tutor@test.com` / `password123`
   - **Super Tutor**: `admin@test.com` / `password123`

## Step 9: Test the Application

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open `http://localhost:5173` in your browser

3. Test the following:
   - User registration and login
   - Quiz taking functionality
   - Question management (as tutor)
   - User management (as super tutor)

## Demo Accounts

The sample data includes demo accounts you can use:

- **Super Tutor**: username `admin`, password `admin123`
- **Tutor**: username `sarah_tutor`, password `password123`
- **Student**: username `john_student`, password `password123`

Note: These accounts need to be created through the registration process first.

## Database Schema Overview

### Core Tables

- **users**: Extended user profiles with roles
- **categories**: Quiz categories (Grammar, Vocabulary, etc.)
- **difficulty_levels**: Beginner, Intermediate, Advanced
- **questions**: Quiz questions with explanations
- **question_options**: Multiple choice options
- **quiz_attempts**: Student quiz attempts and scores
- **quiz_answers**: Individual question answers
- **feedback**: Tutor feedback to students
- **student_feedback**: Student feedback to tutors

### Key Features

- **Row Level Security (RLS)**: Ensures users can only access appropriate data
- **Role-based Access**: Different permissions for students, tutors, and super tutors
- **Auto-grading**: Automatic quiz scoring
- **Progress Tracking**: Detailed analytics for students and tutors
- **File Storage**: Support for images, audio, and documents

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**

   - Make sure `.env` file is in the project root
   - Restart the development server after changing `.env`

2. **Database Connection Issues**

   - Verify your Supabase URL and key are correct
   - Check if your project is paused (free tier limitation)

3. **RLS Policy Errors**

   - Make sure all migrations ran successfully
   - Check user roles are set correctly

4. **Storage Upload Issues**
   - Verify storage buckets exist
   - Check file size and type restrictions

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
- Review the application logs in browser developer tools

## Production Deployment

When ready for production:

1. Update environment variables with production URLs
2. Configure proper CORS settings in Supabase
3. Set up proper email templates
4. Configure custom domain (optional)
5. Set up monitoring and backups
6. Review and adjust RLS policies if needed

## Security Considerations

- Never commit `.env` files to version control
- Use strong passwords for database and admin accounts
- Regularly review and audit user permissions
- Keep Supabase and dependencies updated
- Monitor for suspicious activity in logs

## Backup and Recovery

- Supabase automatically backs up your database
- For additional safety, consider setting up regular exports
- Test your backup restoration process periodically

---

Your English Quiz Platform backend is now ready! 🎉

For any issues or questions, please refer to the troubleshooting section or check the application logs.
