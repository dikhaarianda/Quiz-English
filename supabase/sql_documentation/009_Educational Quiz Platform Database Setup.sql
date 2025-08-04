-- ===========================================
-- COMPLETE SUPABASE DATABASE SETUP SCRIPT
-- ===========================================
-- Run this script in order in Supabase SQL Editor

-- Step 1: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'tutor', 'super_tutor');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_status') THEN
        CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived');
    END IF;
END $$;

-- Step 3: Create tables in correct order (respecting foreign keys)

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Difficulty levels table
CREATE TABLE IF NOT EXISTS public.difficulty_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
    difficulty_id INTEGER REFERENCES public.difficulty_levels(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    explanation TEXT,
    image_url TEXT,
    audio_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question options table
CREATE TABLE IF NOT EXISTS public.question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Quiz answers table
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES public.questions(id),
    selected_option_id INTEGER REFERENCES public.question_options(id),
    is_correct BOOLEAN DEFAULT false,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    recommendations TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student feedback table
CREATE TABLE IF NOT EXISTS public.student_feedback (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES public.users(id),
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_category ON public.quiz_attempts(category_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON public.quiz_attempts(is_completed);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student ON public.feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tutor ON public.feedback(tutor_id);

-- Step 5: Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_updated_at ON public.feedback;
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Insert default data
INSERT INTO public.difficulty_levels (name, description, order_index) VALUES
('Easy', 'Basic level questions', 1),
('Medium', 'Intermediate level questions', 2),
('Hard', 'Advanced level questions', 3)
ON CONFLICT (name) DO NOTHING;

-- Step 8: Simple user registration function (without complex logic first)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username VARCHAR(50);
BEGIN
    -- Generate simple username
    v_username := COALESCE(
        NEW.raw_user_meta_data->>'username', 
        split_part(NEW.email, '@', 1)
    );
    
    -- Add timestamp if username might conflict
    v_username := LEFT(v_username, 40) || '_' || EXTRACT(EPOCH FROM NOW())::bigint::text;
    
    INSERT INTO public.users (
        id, 
        username, 
        first_name, 
        last_name, 
        role
    ) VALUES (
        NEW.id,
        v_username,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'student' -- Always default to student for now
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 10: TEMPORARY - Disable RLS during initial setup
-- (You can enable this later after testing)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;