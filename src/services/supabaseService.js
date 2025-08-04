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
      return handleResponse(data, error);
    } catch (error) {
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

  async getTutorAnalytics() {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          categories(name),
          difficulty_levels(name),
          users(first_name, last_name)
        `)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      if (error) {
        return handleResponse(null, error);
      }

      // Process data for analytics
      const analytics = {
        totalAttempts: data.length,
        averageScore: data.reduce((sum, attempt) => sum + attempt.score, 0) / data.length || 0,
        categoryStats: {},
        recentAttempts: data.slice(0, 10)
      };

      // Group by category
      data.forEach(attempt => {
        const categoryName = attempt.categories?.name || 'Unknown';
        if (!analytics.categoryStats[categoryName]) {
          analytics.categoryStats[categoryName] = {
            attempts: 0,
            totalScore: 0,
            averageScore: 0
          };
        }
        analytics.categoryStats[categoryName].attempts++;
        analytics.categoryStats[categoryName].totalScore += attempt.score;
        analytics.categoryStats[categoryName].averageScore = 
          analytics.categoryStats[categoryName].totalScore / analytics.categoryStats[categoryName].attempts;
      });

      return handleResponse(analytics, null);
    } catch (error) {
      return handleResponse(null, error);
    }
  },

  // NEW: Add System Analytics function for Super Tutor Dashboard
  async getSystemAnalytics() {
    try {
      // Get user statistics
      const { data: userStats } = await supabase
        .from('users')
        .select('role')
        .eq('is_active', true);

      // Get question count
      const { count: questionCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get quiz attempts count
      const { count: quizCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true);

      // Get average score
      const { data: scoreData } = await supabase
        .from('quiz_attempts')
        .select('score')
        .eq('is_completed', true);

      // Process user stats by role
      const roleStats = {};
      if (userStats) {
        userStats.forEach(user => {
          roleStats[user.role] = (roleStats[user.role] || 0) + 1;
        });
      }

      // Calculate average score
      const averageScore = scoreData && scoreData.length > 0 
        ? Math.round(scoreData.reduce((sum, item) => sum + item.score, 0) / scoreData.length)
        : 0;

      const analytics = {
        totalUsers: userStats ? userStats.length : 0,
        totalQuestions: questionCount || 0,
        totalQuizzes: quizCount || 0,
        averageScore: averageScore,
        userStats: roleStats
      };

      return handleResponse(analytics, null);
    } catch (error) {
      console.error('System analytics error:', error);
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
          users!feedback_tutor_id_fkey(first_name, last_name)
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

  async createFeedback(feedbackData) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('feedback')
        .insert([{
          ...feedbackData,
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
          users!feedback_tutor_id_fkey(first_name, last_name)
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
        .update(feedbackData)
        .eq('id', id)
        .select(`
          *,
          quiz_attempts(
            id,
            score,
            categories(name),
            difficulty_levels(name)
          ),
          users!feedback_tutor_id_fkey(first_name, last_name)
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
          ...feedbackData,
          student_id: user.user?.id
        }])
        .select()
        .single();

      return handleResponse(data, error, 'Feedback submitted successfully');
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
