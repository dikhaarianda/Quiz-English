-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.difficulty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is tutor or super_tutor
CREATE OR REPLACE FUNCTION is_tutor_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('tutor', 'super_tutor') FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super_tutor
CREATE OR REPLACE FUNCTION is_super_tutor(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'super_tutor' FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Tutors can view all users" ON public.users
    FOR SELECT USING (is_tutor_or_admin(auth.uid()));

CREATE POLICY "Super tutors can manage all users" ON public.users
    FOR ALL USING (is_super_tutor(auth.uid()));

CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories table policies
CREATE POLICY "Everyone can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Tutors can manage categories" ON public.categories
    FOR ALL USING (is_tutor_or_admin(auth.uid()));

-- Difficulty levels table policies
CREATE POLICY "Everyone can view active difficulty levels" ON public.difficulty_levels
    FOR SELECT USING (is_active = true);

CREATE POLICY "Super tutors can manage difficulty levels" ON public.difficulty_levels
    FOR ALL USING (is_super_tutor(auth.uid()));

-- Questions table policies
CREATE POLICY "Everyone can view active questions" ON public.questions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Tutors can manage questions" ON public.questions
    FOR ALL USING (is_tutor_or_admin(auth.uid()));

-- Question options table policies
CREATE POLICY "Everyone can view question options" ON public.question_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.questions 
            WHERE id = question_id AND is_active = true
        )
    );

CREATE POLICY "Tutors can manage question options" ON public.question_options
    FOR ALL USING (is_tutor_or_admin(auth.uid()));

-- Quiz attempts table policies
CREATE POLICY "Students can view their own attempts" ON public.quiz_attempts
    FOR SELECT USING (
        auth.uid() = student_id OR 
        is_tutor_or_admin(auth.uid())
    );

CREATE POLICY "Students can create their own attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own attempts" ON public.quiz_attempts
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Tutors can view all attempts" ON public.quiz_attempts
    FOR SELECT USING (is_tutor_or_admin(auth.uid()));

-- Quiz answers table policies
CREATE POLICY "Students can view their own answers" ON public.quiz_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts 
            WHERE id = attempt_id AND student_id = auth.uid()
        ) OR is_tutor_or_admin(auth.uid())
    );

CREATE POLICY "Students can create their own answers" ON public.quiz_answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts 
            WHERE id = attempt_id AND student_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can view all answers" ON public.quiz_answers
    FOR SELECT USING (is_tutor_or_admin(auth.uid()));

-- Feedback table policies
CREATE POLICY "Students can view feedback about them" ON public.feedback
    FOR SELECT USING (
        auth.uid() = student_id OR 
        auth.uid() = tutor_id OR 
        is_super_tutor(auth.uid())
    );

CREATE POLICY "Tutors can create feedback" ON public.feedback
    FOR INSERT WITH CHECK (
        is_tutor_or_admin(auth.uid()) AND 
        auth.uid() = tutor_id
    );

CREATE POLICY "Tutors can update their own feedback" ON public.feedback
    FOR UPDATE USING (
        auth.uid() = tutor_id OR 
        is_super_tutor(auth.uid())
    );

CREATE POLICY "Super tutors can delete feedback" ON public.feedback
    FOR DELETE USING (is_super_tutor(auth.uid()));

-- Student feedback table policies
CREATE POLICY "Students can view their own feedback" ON public.student_feedback
    FOR SELECT USING (
        auth.uid() = student_id OR 
        auth.uid() = tutor_id OR 
        is_super_tutor(auth.uid())
    );

CREATE POLICY "Students can create feedback" ON public.student_feedback
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own feedback" ON public.student_feedback
    FOR UPDATE USING (auth.uid() = student_id);

-- User sessions table policies
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Super tutors can view all sessions" ON public.user_sessions
    FOR SELECT USING (is_super_tutor(auth.uid()));
