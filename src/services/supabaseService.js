import { supabase } from '../lib/supabase.js';
import { toast } from 'react-toastify';

// Helper function to handle API responses
const handleResponse = (data, error, successMessage = null) => {
  if (error) {
    console.error('API Error:', error);
    const errorMessage = error.message || 'An error occurred';
    if (!successMessage) toast.error(errorMessage);
    return { success: false, error: errorMessage, data: null };
  }
  
  if (successMessage) toast.success(successMessage);
  return { success: true, error: null, data };
};

// Categories Service
export const categoriesService = {
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async createCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          ...categoryData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      return handleResponse(data, error, 'Category created successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async updateCategory(id, categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      return handleResponse(data, error, 'Category updated successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async deleteCategory(id) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      return handleResponse(data, error, 'Category deleted successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getDifficultyLevels() {
    try {
      const { data, error } = await supabase
        .from('difficulty_levels')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getAvailableQuizzes() {
    try {
      const { data, error } = await supabase.rpc('get_available_quizzes');
      
      if (error) {
        console.error('RPC get_available_quizzes error:', error);
        return handleResponse(null, error);
      }
      
      // The RPC function returns a JSON object with success and data properties
      if (data && typeof data === 'object') {
        console.log('RPC response data:', data);
        return data; // Return the data directly as it already has success/data structure
      }
      
      return handleResponse(data, null);
    } catch (error) {
      console.error('getAvailableQuizzes catch error:', error);
      return handleResponse(null, error);
    }
  }
};

// Questions Service
export const questionsService = {
  async getQuestions(params = {}) {
    try {
      let query = supabase
        .from('questions')
        .select(`
          *,
          categories(id, name),
          difficulty_levels(id, name),
          users(first_name, last_name),
          options:question_options(*)
        `)
        .eq('is_active', true);

      // Apply filters
      if (params.category_id) {
        query = query.eq('category_id', params.category_id);
      }
      
      if (params.difficulty_id) {
        query = query.eq('difficulty_id', params.difficulty_id);
      }
      
      if (params.search) {
        query = query.ilike('question_text', `%${params.search}%`);
      }

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      // Get total count for pagination
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return handleResponse(null, error);
      }

      const totalPages = Math.ceil(count / limit);
      const result = {
        questions: data,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

      return handleResponse(result, null);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getQuestion(id) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          categories(id, name),
          difficulty_levels(id, name),
          options:question_options(*)
        `)
        .eq('id', id)
        .single();

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async createQuestion(questionData) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Create question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert([{
          category_id: questionData.category_id,
          difficulty_id: questionData.difficulty_id,
          question_text: questionData.question_text,
          explanation: questionData.explanation,
          image_url: questionData.image_url,
          audio_url: questionData.audio_url,
          created_by: user.user?.id
        }])
        .select()
        .single();

      if (questionError) {
        return handleResponse(null, questionError);
      }

      // Create options
      const optionsData = questionData.options.map((option, index) => ({
        question_id: question.id,
        option_text: option.option_text,
        is_correct: option.is_correct,
        order_index: index
      }));

      const { data: options, error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsData)
        .select();

      if (optionsError) {
        // Rollback question creation
        await supabase.from('questions').delete().eq('id', question.id);
        return handleResponse(null, optionsError);
      }

      return handleResponse({ ...question, options }, null, 'Question created successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async updateQuestion(id, questionData) {
    try {
      // Update question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .update({
          category_id: questionData.category_id,
          difficulty_id: questionData.difficulty_id,
          question_text: questionData.question_text,
          explanation: questionData.explanation,
          image_url: questionData.image_url,
          audio_url: questionData.audio_url
        })
        .eq('id', id)
        .select()
        .single();

      if (questionError) {
        return handleResponse(null, questionError);
      }

      // Delete existing options
      await supabase
        .from('question_options')
        .delete()
        .eq('question_id', id);

      // Create new options
      const optionsData = questionData.options.map((option, index) => ({
        question_id: id,
        option_text: option.option_text,
        is_correct: option.is_correct,
        order_index: index
      }));

      const { data: options, error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsData)
        .select();

      if (optionsError) {
        return handleResponse(null, optionsError);
      }

      return handleResponse({ ...question, options }, null, 'Question updated successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async deleteQuestion(id) {
    try {
      // Delete options first (due to foreign key constraint)
      await supabase
        .from('question_options')
        .delete()
        .eq('question_id', id);

      // Delete question
      const { data, error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      return handleResponse(data, error, 'Question deleted successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  }
};

// Quiz Service
export const quizService = {
  async startQuiz(quizData) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('start_quiz_attempt', {
        p_student_id: user.user?.id,
        p_category_id: quizData.category_id,
        p_difficulty_id: quizData.difficulty_id,
        p_question_count: quizData.question_count || 10
      });

      if (error) {
        return handleResponse(null, error);
      }

      // The function returns a JSON response
      return data;
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async submitQuiz(submissionData) {
    try {
      const { data, error } = await supabase.rpc('submit_quiz_answers', {
        p_attempt_id: submissionData.attempt_id,
        p_answers: submissionData.answers
      });

      if (error) {
        return handleResponse(null, error);
      }

      return data;
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getQuizResults(params = {}) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      let query = supabase
        .from('quiz_attempts')
        .select(`
          *,
          categories(id, name),
          difficulty_levels(id, name),
          users(first_name, last_name)
        `)
        .eq('is_completed', true);

      // If not admin/tutor, only show own results
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.user?.id)
        .single();

      if (userProfile?.role === 'student') {
        query = query.eq('student_id', user.user?.id);
      }

      if (params.student_id) {
        query = query.eq('student_id', params.student_id);
      }

      if (params.category_id) {
        query = query.eq('category_id', params.category_id);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query.order('completed_at', { ascending: false });

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getQuizResult(attemptId) {
    try {
      const { data, error } = await supabase.rpc('get_quiz_results', {
        p_attempt_id: attemptId
      });

      if (error) {
        return handleResponse(null, error);
      }

      return data;
    } catch (error) {
      return handleResponse(null, error);
    }
  }
};

// Analytics Service
export const analyticsService = {
  async getStudentProgress(studentId) {
    try {
      const { data, error } = await supabase.rpc('get_student_progress', {
        p_student_id: studentId
      });

      if (error) {
        return handleResponse(null, error);
      }

      return data;
    } catch (error) {
      return handleResponse(null, error);
    }
  },


  // Enhanced System Analytics function for Super Tutor Dashboard
  async getSystemAnalytics() {
    try {
      // Get user statistics with creation dates
      const { data: userStats } = await supabase
        .from('users')
        .select('role, created_at')
        .eq('is_active', true);

      // Get question count with category breakdown
      const { data: questionStats } = await supabase
        .from('questions')
        .select(`
          id,
          categories(id, name)
        `)
        .eq('is_active', true);

      // Get quiz attempts count
      const { count: quizCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true);

      // Get average score
      const { data: scoreData } = await supabase
        .from('quiz_attempts')
        .select('score, created_at')
        .eq('is_completed', true);

      // Get weekly growth data
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: newUsersThisWeek } = await supabase
        .from('users')
        .select('id')
        .gte('created_at', oneWeekAgo.toISOString())
        .eq('is_active', true);

      const { data: newQuestionsThisWeek } = await supabase
        .from('questions')
        .select('id')
        .gte('created_at', oneWeekAgo.toISOString())
        .eq('is_active', true);

      const { data: newAttemptsThisWeek } = await supabase
        .from('quiz_attempts')
        .select('id')
        .gte('created_at', oneWeekAgo.toISOString())
        .eq('is_completed', true);

      // Process user stats by role
      const roleStats = {};
      if (userStats) {
        userStats.forEach(user => {
          roleStats[user.role] = (roleStats[user.role] || 0) + 1;
        });
      }

      // Process questions by category
      const categoryStats = {};
      if (questionStats) {
        questionStats.forEach(question => {
          const categoryName = question.categories?.name || 'Uncategorized';
          categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
        });
      }

      // Generate user growth data for last 30 days
      const userGrowthData = [];
      if (userStats && userStats.length > 0) {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        });

        last30Days.forEach(date => {
          const usersOnDate = userStats.filter(user => 
            user.created_at && user.created_at.split('T')[0] === date
          ).length;
          
          if (usersOnDate > 0) {
            userGrowthData.push({
              date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              count: usersOnDate
            });
          }
        });
      }

      // Calculate average score
      const averageScore = scoreData && scoreData.length > 0 
        ? Math.round(scoreData.reduce((sum, item) => sum + item.score, 0) / scoreData.length)
        : 0;

      // Calculate score change (compare last week vs previous week)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const lastWeekScores = scoreData ? scoreData.filter(item => 
        new Date(item.created_at) >= oneWeekAgo
      ) : [];

      const previousWeekScores = scoreData ? scoreData.filter(item => {
        const date = new Date(item.created_at);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      }) : [];

      const lastWeekAvg = lastWeekScores.length > 0 
        ? lastWeekScores.reduce((sum, item) => sum + item.score, 0) / lastWeekScores.length
        : 0;

      const previousWeekAvg = previousWeekScores.length > 0 
        ? previousWeekScores.reduce((sum, item) => sum + item.score, 0) / previousWeekScores.length
        : 0;

      const scoreChange = previousWeekAvg > 0 
        ? Math.round(((lastWeekAvg - previousWeekAvg) / previousWeekAvg) * 100)
        : 0;

      const analytics = {
        totalUsers: userStats ? userStats.length : 0,
        totalQuestions: questionStats ? questionStats.length : 0,
        totalQuizzes: quizCount || 0,
        averageScore: averageScore,
        newUsersThisWeek: newUsersThisWeek ? newUsersThisWeek.length : 0,
        newQuestionsThisWeek: newQuestionsThisWeek ? newQuestionsThisWeek.length : 0,
        newAttemptsThisWeek: newAttemptsThisWeek ? newAttemptsThisWeek.length : 0,
        scoreChange: scoreChange,
        userStats: roleStats,
        userGrowth: userGrowthData,
        questionsByCategory: Object.entries(categoryStats).map(([name, count]) => ({
          category_name: name,
          count: count
        }))
      };

      return handleResponse(analytics, null);
    } catch (error) {
      console.error('System analytics error:', error);
      return handleResponse(null, error);
    }
  },

  // Enhanced Tutor Analytics function
  async getTutorAnalytics() {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Get all quiz attempts with related data
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          categories(name),
          difficulty_levels(name),
          users(first_name, last_name)
        `)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      if (!attempts || attempts.length === 0) {
        return handleResponse({
          totalAttempts: 0,
          averageScore: 0,
          categoryStats: [],
          studentPerformance: [],
          recentAttempts: []
        }, null);
      }

      // Get questions created by current tutor
      const { data: tutorQuestions } = await supabase
        .from('questions')
        .select(`
          id,
          categories(name)
        `)
        .eq('created_by', user.user?.id)
        .eq('is_active', true);

      // Process category stats based on tutor's questions
      const categoryStats = {};
      if (tutorQuestions) {
        tutorQuestions.forEach(question => {
          const categoryName = question.categories?.name || 'Uncategorized';
          categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
        });
      }

      // Process student performance (top 10 students by average score)
      const studentStats = {};
      attempts.forEach(attempt => {
        const studentName = `${attempt.users?.first_name || ''} ${attempt.users?.last_name || ''}`.trim() || 'Unknown Student';
        const studentId = attempt.student_id;
        
        if (!studentStats[studentId]) {
          studentStats[studentId] = {
            name: studentName,
            scores: [],
            totalAttempts: 0
          };
        }
        
        studentStats[studentId].scores.push(attempt.score);
        studentStats[studentId].totalAttempts++;
      });

      // Calculate average scores and sort
      const studentPerformance = Object.entries(studentStats)
        .map(([studentId, stats]) => ({
          student_id: studentId,
          first_name: stats.name.split(' ')[0] || 'Unknown',
          last_name: stats.name.split(' ').slice(1).join(' ') || '',
          average_score: Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length),
          total_attempts: stats.totalAttempts
        }))
        .sort((a, b) => b.average_score - a.average_score)
        .slice(0, 10);

      const analytics = {
        totalAttempts: attempts.length,
        averageScore: Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length),
        categoryStats: Object.entries(categoryStats).map(([name, count]) => ({
          category_name: name,
          question_count: count
        })),
        studentPerformance: studentPerformance,
        recentAttempts: attempts.slice(0, 10)
      };

      return handleResponse(analytics, null);
    } catch (error) {
      console.error('Tutor analytics error:', error);
      return handleResponse(null, error);
    }
  }
};

// Feedback Service
export const feedbackService = {
  async getFeedback(studentId = null) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      let query = supabase
        .from('feedback')
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          users!feedback_tutor_id_fkey(first_name, last_name),
          student:users!feedback_student_id_fkey(first_name, last_name, username)
        `);

      // Filter based on user role
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.user?.id)
        .single();

      if (userProfile?.role === 'student') {
        query = query.eq('student_id', user.user?.id);
      } else if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getTutorFeedback(params = {}) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      let query = supabase
        .from('feedback')
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          users!feedback_tutor_id_fkey(first_name, last_name),
          student:users!feedback_student_id_fkey(first_name, last_name, username)
        `);

      // Filter by tutor (only show feedback created by current tutor)
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.user?.id)
        .single();

      if (userProfile?.role === 'tutor') {
        query = query.eq('tutor_id', user.user?.id);
      }

      // Apply filters
      if (params.student_id) {
        query = query.eq('student_id', params.student_id);
      }

      if (params.search) {
        query = query.ilike('feedback_text', `%${params.search}%`);
      }

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      // Get total count for pagination
      let countQuery = supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true });

      if (userProfile?.role === 'tutor') {
        countQuery = countQuery.eq('tutor_id', user.user?.id);
      }

      if (params.student_id) {
        countQuery = countQuery.eq('student_id', params.student_id);
      }

      const { count } = await countQuery;

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return handleResponse(null, error);
      }

      // For each feedback item, get related student feedback if attempt_id exists
      const feedbackWithStudentFeedback = await Promise.all(
        (data || []).map(async (feedbackItem) => {
          if (feedbackItem.attempt_id) {
            // Get student feedback for the same quiz attempt
            const { data: studentFeedbackData, error: studentFeedbackError } = await supabase
              .from('student_feedback')
              .select(`
                id,
                feedback_text,
                rating,
                created_at
              `)
              .eq('attempt_id', feedbackItem.attempt_id)
              .eq('student_id', feedbackItem.student_id)
              .single();

            if (!studentFeedbackError && studentFeedbackData) {
              return {
                ...feedbackItem,
                student_feedback: studentFeedbackData
              };
            }
          }
          return feedbackItem;
        })
      );

      const totalPages = Math.ceil(count / limit);
      const result = {
        feedback: feedbackWithStudentFeedback || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

      return handleResponse(result, null);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async createFeedback(feedbackData) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('feedback')
        .insert([{
          student_id: feedbackData.student_id,
          attempt_id: feedbackData.attempt_id || null,
          feedback_text: feedbackData.feedback_text,
          recommendations: feedbackData.recommendations || null,
          rating: feedbackData.rating || null,
          tutor_id: user.user?.id
        }])
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          users!feedback_tutor_id_fkey(first_name, last_name),
          student:users!feedback_student_id_fkey(first_name, last_name, username)
        `)
        .single();

      return handleResponse(data, error, 'Feedback created successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async updateFeedback(id, feedbackData) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .update({
          feedback_text: feedbackData.feedback_text,
          recommendations: feedbackData.recommendations || null,
          rating: feedbackData.rating || null
        })
        .eq('id', id)
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          users!feedback_tutor_id_fkey(first_name, last_name),
          student:users!feedback_student_id_fkey(first_name, last_name, username)
        `)
        .single();

      return handleResponse(data, error, 'Feedback updated successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async deleteFeedback(id) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);

      return handleResponse(data, error, 'Feedback deleted successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async createStudentFeedback(feedbackData) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('student_feedback')
        .insert([{
          attempt_id: feedbackData.attempt_id,
          tutor_id: feedbackData.tutor_id || null,
          feedback_text: feedbackData.feedback_text,
          rating: feedbackData.rating || null,
          student_id: user.user?.id
        }])
        .select()
        .single();

      return handleResponse(data, error, 'Feedback submitted successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getStudentFeedback(studentId = null) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      let query = supabase
        .from('student_feedback')
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          tutor:users!tutor_id(first_name, last_name)
        `);

      // Use provided studentId or current user's ID
      const targetStudentId = studentId || user.user?.id;
      query = query.eq('student_id', targetStudentId);

      const { data, error } = await query.order('created_at', { ascending: false });

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async updateStudentFeedback(id, feedbackData) {
    try {
      const { data, error } = await supabase
        .from('student_feedback')
        .update({
          feedback_text: feedbackData.feedback_text,
          rating: feedbackData.rating || null
        })
        .eq('id', id)
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          tutor:users!tutor_id(first_name, last_name)
        `)
        .single();

      return handleResponse(data, error, 'Feedback updated successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getStudentFeedbackByAttempt(attemptId) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('student_feedback')
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          tutor:users!tutor_id(first_name, last_name)
        `)
        .eq('attempt_id', attemptId)
        .eq('student_id', user.user?.id)
        .single();

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getFeedbackByAttempt(attemptId) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          users!feedback_tutor_id_fkey(first_name, last_name),
          student:users!feedback_student_id_fkey(first_name, last_name, username)
        `)
        .eq('attempt_id', attemptId)
        .order('created_at', { ascending: false });

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getQuizAttempts(studentId = null) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      let query = supabase
        .from('quiz_attempts')
        .select(`
          id,
          score,
          completed_at,
          categories(name),
          difficulty_levels(name),
          users(first_name, last_name, username)
        `)
        .eq('is_completed', true);

      // Filter based on user role
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.user?.id)
        .single();

      if (userProfile?.role === 'student') {
        query = query.eq('student_id', user.user?.id);
      } else if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query
        .order('completed_at', { ascending: false })
        .limit(20);

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getAllStudentFeedback(params = {}) {
    try {
      let query = supabase
        .from('student_feedback')
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          student:users!student_id(first_name, last_name, username),
          tutor:users!tutor_id(first_name, last_name)
        `);

      // Apply filters
      if (params.student_id) {
        query = query.eq('student_id', params.student_id);
      }

      if (params.search) {
        query = query.ilike('feedback_text', `%${params.search}%`);
      }

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      // Get total count for pagination
      let countQuery = supabase
        .from('student_feedback')
        .select('*', { count: 'exact', head: true });

      if (params.student_id) {
        countQuery = countQuery.eq('student_id', params.student_id);
      }

      const { count } = await countQuery;

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return handleResponse(null, error);
      }

      const totalPages = Math.ceil(count / limit);
      const result = {
        feedback: data || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

      return handleResponse(result, null);
    } catch (error) {
      return handleResponse(null, error);
    }
  }
};

// User Management Service
export const usersService = {
  async getUsers(params = {}) {
    try {
      let query = supabase
        .from('users')
        .select('*');

      // Apply role filter - remove is_active filter to get all users
      if (params.role && params.role !== 'all') {
        query = query.eq('role', params.role);
      }

      if (params.search) {
        query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,username.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      // Apply pagination if specified
      if (params.page && params.limit) {
        const from = (params.page - 1) * params.limit;
        const to = from + params.limit - 1;
        query = query.range(from, to);
      } else if (params.limit) {
        query = query.limit(params.limit);
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return handleResponse(null, error);
      }

      // Prepare response with pagination info
      const result = {
        users: data || [],
        pagination: params.page ? {
          currentPage: params.page,
          totalPages: Math.ceil(count / params.limit),
          totalCount: count,
          hasNext: params.page < Math.ceil(count / params.limit),
          hasPrev: params.page > 1
        } : null
      };

      return handleResponse(result, null);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      return handleResponse(data, error);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getUserProfileByUsername(username) {
    try {
      const { data, error } = await supabase.rpc('get_user_profile_by_username', {
        p_username: username
      });

      if (error) {
        return handleResponse(null, error);
      }

      return data;
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async checkUsernameAvailability(username) {
    try {
      const { data, error } = await supabase.rpc('check_username_availability', {
        p_username: username
      });

      if (error) {
        return handleResponse(null, error);
      }

      return data;
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getStudents() {
    try {
      // Fallback if RPC function doesn't exist
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return handleResponse(null, error);
      }

      return handleResponse({ users: data }, null);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async getTutors() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['tutor', 'super_tutor'])
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return handleResponse(null, error);
      }

      return handleResponse({ users: data }, null);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async createUser(userData) {
    try {
      // Since we can't use admin.createUser in client-side, 
      // we'll create a user record directly in the users table
      // This assumes user registration happens through auth flow
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: userData.username,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          is_active: userData.isActive !== undefined ? userData.isActive : true
        }])
        .select()
        .single();

      return handleResponse(data, error, 'User created successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async updateUser(id, userData) {
    try {
      const updateData = {
        username: userData.username,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        is_active: userData.isActive
      };

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      return handleResponse(data, error, 'User updated successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  async deactivateUser(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      return handleResponse(data, error, 'User deactivated successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  }
};

// Storage Service
export const storageService = {
  async uploadFile(bucket, path, file) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      return handleResponse(data, error, 'File uploaded successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  async deleteFile(bucket, path) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      return handleResponse(data, error, 'File deleted successfully');
    } catch (error) {
      return handleResponse(null, error);
    }
  }
};

export default {
  categoriesService,
  questionsService,
  quizService,
  analyticsService,
  feedbackService,
  usersService,
  storageService
};
