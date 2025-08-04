-- Migration 007: Fix Username Registration and Login Issues
-- This migration fixes:
-- 1. Username getting random numbers during registration
-- 2. Adds function to enable username login

-- Fix the user registration function to prevent random numbers in username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    desired_username TEXT;
    final_username TEXT;
    username_exists BOOLEAN;
BEGIN
    -- Get the desired username from metadata
    desired_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    
    -- Check if username already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE username = desired_username) INTO username_exists;
    
    -- If username exists, return error (don't add random numbers)
    IF username_exists THEN
        RAISE EXCEPTION 'Username % already exists. Please choose a different username.', desired_username;
    END IF;
    
    -- Use the exact username provided
    final_username := desired_username;
    
    INSERT INTO public.users (id, username, first_name, last_name, role)
    VALUES (
        NEW.id,
        final_username,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get email from username for login
CREATE OR REPLACE FUNCTION get_email_from_username(p_username TEXT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    -- Get user ID from username
    SELECT id INTO v_user_id
    FROM public.users
    WHERE username = p_username AND is_active = true;

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Username not found'
        );
    END IF;

    -- Get email from auth.users
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = v_user_id;

    IF v_email IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User email not found'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'email', v_email,
            'user_id', v_user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_email_from_username(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_email_from_username(TEXT) IS 'Converts username to email for login purposes. Used by frontend to enable username-based authentication.';
COMMENT ON FUNCTION handle_new_user() IS 'Updated to prevent random numbers being added to usernames during registration.';
