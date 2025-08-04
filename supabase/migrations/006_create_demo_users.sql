-- This script creates demo users for testing purposes
-- Note: In production, users should register through the application

-- Create demo users in auth.users table (this would normally be done through Supabase Auth)
-- This is just for reference - actual user creation should be done through the application

-- Demo user data that can be created through registration:
-- 1. Super Tutor (Admin)
--    Username: admin
--    Email: admin@demo.com
--    Password: admin123
--    Role: super_tutor

-- 2. Tutor
--    Username: sarah_tutor
--    Email: sarah@demo.com
--    Password: password123
--    Role: tutor

-- 3. Student
--    Username: john_student
--    Email: john@demo.com
--    Password: password123
--    Role: student

-- Additional sample students for testing
-- 4. Student 2
--    Username: mary_student
--    Email: mary@demo.com
--    Password: password123
--    Role: student

-- 5. Student 3
--    Username: alex_student
--    Email: alex@demo.com
--    Password: password123
--    Role: student

-- Note: These users need to be created through the registration process
-- This file serves as documentation for the demo accounts

-- You can create these users by:
-- 1. Going to the registration page
-- 2. Filling in the details above
-- 3. Or using the Supabase dashboard to create users manually

-- For manual creation in Supabase dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Fill in email and password
-- 4. In user metadata, add:
--    {
--      "username": "admin",
--      "first_name": "Admin",
--      "last_name": "User",
--      "role": "super_tutor"
--    }

-- Sample quiz attempts for demo purposes (after users are created)
-- These will be created when users actually take quizzes

COMMENT ON SCHEMA public IS 'Demo users should be created through the application registration process or Supabase dashboard';
