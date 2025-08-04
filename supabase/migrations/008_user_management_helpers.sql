-- Migration 008: User Management Helper Functions
-- Additional functions to support user management and profile operations

-- Function to get user profile by username (for admin/tutor use)
CREATE OR REPLACE FUNCTION get_user_profile_by_username(p_username TEXT)
RETURNS JSON AS $$
DECLARE
    v_user_profile RECORD;
BEGIN
    -- Get user profile from username
    SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.created_at,
        au.email,
        au.email_confirmed_at
    INTO v_user_profile
    FROM public.users u
    JOIN auth.users au ON au.id = u.id
    WHERE u.username = p_username AND u.is_active = true;

    IF v_user_profile.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'id', v_user_profile.id,
            'username', v_user_profile.username,
            'first_name', v_user_profile.first_name,
            'last_name', v_user_profile.last_name,
            'email', v_user_profile.email,
            'role', v_user_profile.role,
            'is_active', v_user_profile.is_active,
            'created_at', v_user_profile.created_at,
            'email_confirmed', v_user_profile.email_confirmed_at IS NOT NULL
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check username availability during registration
CREATE OR REPLACE FUNCTION check_username_availability(p_username TEXT)
RETURNS JSON AS $$
DECLARE
    username_exists BOOLEAN;
BEGIN
    -- Check if username already exists
    SELECT EXISTS(
        SELECT 1 FROM public.users 
        WHERE LOWER(username) = LOWER(p_username)
    ) INTO username_exists;
    
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'available', NOT username_exists,
            'username', p_username
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get students for tutor dashboard
CREATE OR REPLACE FUNCTION get_students_for_tutor()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'success', true,
        'data', (
            SELECT json_agg(
                json_build_object(
                    'id', u.id,
                    'username', u.username,
                    'first_name', u.first_name,
                    'last_name', u.last_name,
                    'created_at', u.created_at,
                    'total_attempts', COALESCE(stats.total_attempts, 0),
                    'average_score', COALESCE(stats.avg_score, 0),
                    'last_activity', stats.last_activity
                ) ORDER BY u.first_name, u.last_name
            )
            FROM public.users u
            LEFT JOIN (
                SELECT 
                    qa.student_id,
                    COUNT(*) as total_attempts,
                    AVG(qa.score) as avg_score,
                    MAX(qa.completed_at) as last_activity
                FROM public.quiz_attempts qa
                WHERE qa.is_completed = true
                GROUP BY qa.student_id
            ) stats ON stats.student_id = u.id
            WHERE u.role = 'student' AND u.is_active = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_profile_by_username(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_username_availability(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_students_for_tutor() TO authenticated;

-- Add RLS policy for the new functions
-- Only tutors and super_tutors can access detailed student information
CREATE POLICY "tutors_can_access_student_profiles" ON public.users
    FOR SELECT USING (
        role = 'student' AND 
        EXISTS (
            SELECT 1 FROM public.users current_user 
            WHERE current_user.id = auth.uid() 
            AND current_user.role IN ('tutor', 'super_tutor')
        )
    );

-- Add comments for documentation
COMMENT ON FUNCTION get_user_profile_by_username(TEXT) IS 'Gets detailed user profile by username. Restricted to authenticated users.';
COMMENT ON FUNCTION check_username_availability(TEXT) IS 'Checks if a username is available during registration. Case-insensitive check.';
COMMENT ON FUNCTION get_students_for_tutor() IS 'Returns list of students with their quiz statistics for tutor dashboard.';
