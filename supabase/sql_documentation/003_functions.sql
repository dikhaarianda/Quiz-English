-- Function to handle user registration with role assignment
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

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to start a quiz attempt
CREATE OR REPLACE FUNCTION start_quiz_attempt(
    p_student_id UUID,
    p_category_id INTEGER,
    p_difficulty_id INTEGER,
    p_question_count INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
    v_attempt_id INTEGER;
    v_questions JSON;
    v_existing_attempt INTEGER;
BEGIN
    -- Check if student already has a completed attempt for this category/difficulty
    SELECT id INTO v_existing_attempt
    FROM public.quiz_attempts
    WHERE student_id = p_student_id
      AND category_id = p_category_id
      AND difficulty_id = p_difficulty_id
      AND is_completed = true;

    IF v_existing_attempt IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'You have already completed this quiz'
        );
    END IF;

    -- Check if there's an incomplete attempt
    SELECT id INTO v_existing_attempt
    FROM public.quiz_attempts
    WHERE student_id = p_student_id
      AND category_id = p_category_id
      AND difficulty_id = p_difficulty_id
      AND is_completed = false;

    IF v_existing_attempt IS NOT NULL THEN
        -- Return existing attempt
        SELECT json_build_object(
            'success', true,
            'data', json_build_object(
                'attempt_id', v_existing_attempt,
                'questions', (
                    SELECT json_agg(
                        json_build_object(
                            'id', q.id,
                            'question_text', q.question_text,
                            'image_url', q.image_url,
                            'audio_url', q.audio_url,
                            'options', (
                                SELECT json_agg(
                                    json_build_object(
                                        'id', qo.id,
                                        'option_text', qo.option_text
                                    ) ORDER BY qo.order_index
                                )
                                FROM public.question_options qo
                                WHERE qo.question_id = q.id
                            )
                        )
                    )
                    FROM public.questions q
                    WHERE q.category_id = p_category_id
                      AND q.difficulty_id = p_difficulty_id
                      AND q.is_active = true
                    ORDER BY RANDOM()
                    LIMIT p_question_count
                ),
                'total_questions', p_question_count
            )
        ) INTO v_questions;

        RETURN v_questions;
    END IF;

    -- Create new attempt
    INSERT INTO public.quiz_attempts (student_id, category_id, difficulty_id, total_questions)
    VALUES (p_student_id, p_category_id, p_difficulty_id, p_question_count)
    RETURNING id INTO v_attempt_id;

    -- Get random questions for the quiz
    SELECT json_build_object(
        'success', true,
        'data', json_build_object(
            'attempt_id', v_attempt_id,
            'questions', (
                SELECT json_agg(
                    json_build_object(
                        'id', q.id,
                        'question_text', q.question_text,
                        'image_url', q.image_url,
                        'audio_url', q.audio_url,
                        'options', (
                            SELECT json_agg(
                                json_build_object(
                                    'id', qo.id,
                                    'option_text', qo.option_text
                                ) ORDER BY qo.order_index
                            )
                            FROM public.question_options qo
                            WHERE qo.question_id = q.id
                        )
                    )
                )
                FROM public.questions q
                WHERE q.category_id = p_category_id
                  AND q.difficulty_id = p_difficulty_id
                  AND q.is_active = true
                ORDER BY RANDOM()
                LIMIT p_question_count
            ),
            'total_questions', p_question_count
        )
    ) INTO v_questions;

    RETURN v_questions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit quiz answers and calculate score
CREATE OR REPLACE FUNCTION submit_quiz_answers(
    p_attempt_id INTEGER,
    p_answers JSON
)
RETURNS JSON AS $$
DECLARE
    v_answer JSON;
    v_correct_count INTEGER := 0;
    v_total_questions INTEGER;
    v_score DECIMAL(5,2);
    v_student_id UUID;
BEGIN
    -- Get attempt details
    SELECT student_id, total_questions INTO v_student_id, v_total_questions
    FROM public.quiz_attempts
    WHERE id = p_attempt_id AND is_completed = false;

    IF v_student_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Quiz attempt not found or already completed'
        );
    END IF;

    -- Process each answer
    FOR v_answer IN SELECT * FROM json_array_elements(p_answers)
    LOOP
        DECLARE
            v_question_id INTEGER := (v_answer->>'question_id')::INTEGER;
            v_selected_option_id INTEGER := (v_answer->>'selected_option_id')::INTEGER;
            v_is_correct BOOLEAN;
        BEGIN
            -- Check if the selected option is correct
            SELECT is_correct INTO v_is_correct
            FROM public.question_options
            WHERE id = v_selected_option_id;

            -- Insert the answer
            INSERT INTO public.quiz_answers (attempt_id, question_id, selected_option_id, is_correct)
            VALUES (p_attempt_id, v_question_id, v_selected_option_id, COALESCE(v_is_correct, false));

            -- Count correct answers
            IF v_is_correct THEN
                v_correct_count := v_correct_count + 1;
            END IF;
        END;
    END LOOP;

    -- Calculate score
    v_score := (v_correct_count::DECIMAL / v_total_questions::DECIMAL) * 100;

    -- Update the attempt
    UPDATE public.quiz_attempts
    SET 
        correct_answers = v_correct_count,
        score = v_score,
        completed_at = NOW(),
        is_completed = true
    WHERE id = p_attempt_id;

    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'attempt_id', p_attempt_id,
            'correct_answers', v_correct_count,
            'total_questions', v_total_questions,
            'score', v_score
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student progress analytics
CREATE OR REPLACE FUNCTION get_student_progress(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'success', true,
        'data', json_build_object(
            'totalAttempts', (
                SELECT COUNT(*)
                FROM public.quiz_attempts
                WHERE student_id = p_student_id AND is_completed = true
            ),
            'averageScore', (
                SELECT COALESCE(AVG(score), 0)
                FROM public.quiz_attempts
                WHERE student_id = p_student_id AND is_completed = true
            ),
            'bestScore', (
                SELECT COALESCE(MAX(score), 0)
                FROM public.quiz_attempts
                WHERE student_id = p_student_id AND is_completed = true
            ),
            'categoryStats', (
                SELECT json_object_agg(
                    c.name,
                    json_build_object(
                        'attempts', stats.attempts,
                        'averageScore', stats.avg_score,
                        'bestScore', stats.best_score
                    )
                )
                FROM (
                    SELECT 
                        qa.category_id,
                        COUNT(*) as attempts,
                        AVG(qa.score) as avg_score,
                        MAX(qa.score) as best_score
                    FROM public.quiz_attempts qa
                    WHERE qa.student_id = p_student_id AND qa.is_completed = true
                    GROUP BY qa.category_id
                ) stats
                JOIN public.categories c ON c.id = stats.category_id
            ),
            'recentAttempts', (
                SELECT json_agg(
                    json_build_object(
                        'id', qa.id,
                        'category_name', c.name,
                        'difficulty_name', dl.name,
                        'score', qa.score,
                        'completed_at', qa.completed_at
                    ) ORDER BY qa.completed_at DESC
                )
                FROM public.quiz_attempts qa
                JOIN public.categories c ON c.id = qa.category_id
                JOIN public.difficulty_levels dl ON dl.id = qa.difficulty_id
                WHERE qa.student_id = p_student_id AND qa.is_completed = true
                LIMIT 10
            )
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get quiz results with detailed answers
CREATE OR REPLACE FUNCTION get_quiz_results(p_attempt_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'success', true,
        'data', json_build_object(
            'attempt', (
                SELECT json_build_object(
                    'id', qa.id,
                    'score', qa.score,
                    'correct_answers', qa.correct_answers,
                    'total_questions', qa.total_questions,
                    'time_taken', qa.time_taken,
                    'completed_at', qa.completed_at,
                    'category_name', c.name,
                    'difficulty_name', dl.name
                )
                FROM public.quiz_attempts qa
                JOIN public.categories c ON c.id = qa.category_id
                JOIN public.difficulty_levels dl ON dl.id = qa.difficulty_id
                WHERE qa.id = p_attempt_id
            ),
            'answers', (
                SELECT json_agg(
                    json_build_object(
                        'question_id', qans.question_id,
                        'question_text', q.question_text,
                        'explanation', q.explanation,
                        'selected_option_id', qans.selected_option_id,
                        'is_correct', qans.is_correct,
                        'options', (
                            SELECT json_agg(
                                json_build_object(
                                    'id', qo.id,
                                    'option_text', qo.option_text,
                                    'is_correct', qo.is_correct,
                                    'is_selected', qo.id = qans.selected_option_id
                                ) ORDER BY qo.order_index
                            )
                            FROM public.question_options qo
                            WHERE qo.question_id = q.id
                        )
                    ) ORDER BY qans.id
                )
                FROM public.quiz_answers qans
                JOIN public.questions q ON q.id = qans.question_id
                WHERE qans.attempt_id = p_attempt_id
            )
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available quizzes (categories with difficulties)
CREATE OR REPLACE FUNCTION get_available_quizzes()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'success', true,
        'data', (
            SELECT json_agg(
                json_build_object(
                    'id', c.id,
                    'name', c.name,
                    'description', c.description,
                    'difficulties', (
                        SELECT json_agg(
                            json_build_object(
                                'id', dl.id,
                                'name', dl.name,
                                'description', dl.description,
                                'question_count', (
                                    SELECT COUNT(*)
                                    FROM public.questions q
                                    WHERE q.category_id = c.id
                                      AND q.difficulty_id = dl.id
                                      AND q.is_active = true
                                )
                            ) ORDER BY dl.order_index
                        )
                        FROM public.difficulty_levels dl
                        WHERE dl.is_active = true
                        AND EXISTS (
                            SELECT 1 FROM public.questions q
                            WHERE q.category_id = c.id
                              AND q.difficulty_id = dl.id
                              AND q.is_active = true
                        )
                    )
                ) ORDER BY c.name
            )
            FROM public.categories c
            WHERE c.is_active = true
            AND EXISTS (
                SELECT 1 FROM public.questions q
                WHERE q.category_id = c.id AND q.is_active = true
            )
        )
    );
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
