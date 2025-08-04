-- Fix get_quiz_results function to return correct data structure
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
                    'started_at', qa.started_at,
                    'completed_at', qa.completed_at,
                    'category_id', qa.category_id,
                    'difficulty_id', qa.difficulty_id,
                    'category_name', c.name,
                    'difficulty_name', dl.name
                )
                FROM public.quiz_attempts qa
                JOIN public.categories c ON c.id = qa.category_id
                JOIN public.difficulty_levels dl ON dl.id = qa.difficulty_id
                WHERE qa.id = p_attempt_id
            ),
            'questions', (
                SELECT json_agg(
                    json_build_object(
                        'id', qans.question_id,
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
