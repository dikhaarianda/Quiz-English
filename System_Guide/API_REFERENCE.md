# 🔌 Quiz English Platform - API Reference

## 📋 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [User Management APIs](#user-management-apis)
3. [Category & Difficulty APIs](#category--difficulty-apis)
4. [Question Management APIs](#question-management-apis)
5. [Quiz APIs](#quiz-apis)
6. [Analytics APIs](#analytics-apis)
7. [Feedback APIs](#feedback-apis)
8. [File Upload APIs](#file-upload-apis)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication APIs

### Login

```javascript
// File: src/services/supabaseService.js
const authService = {
  /**
   * Login user dengan username dan password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} Response dengan user data atau error
   */
  async login(credentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username + "@quiz.com",
        password: credentials.password,
      });

      if (error) throw error;

      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      return {
        success: true,
        data: {
          user: data.user,
          profile: profile,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Logout current user
   * @returns {Promise<Object>} Success status
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get current session
   * @returns {Promise<Object>} Current session data
   */
  async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

### Register

```javascript
/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Unique username
 * @param {string} userData.password - Password (min 6 chars)
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} userData.role - User role (student|tutor|super_tutor)
 * @returns {Promise<Object>} Registration result
 */
async register(userData) {
  try {
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', userData.username)
      .single();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.username + '@quiz.com',
      password: userData.password,
      options: {
        data: {
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role || 'student'
        }
      }
    });

    if (authError) throw authError;

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role || 'student'
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return {
      success: true,
      data: {
        user: authData.user,
        profile: profile
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

---

## 👥 User Management APIs

```javascript
const usersService = {
  /**
   * Get users dengan filtering dan pagination
   * @param {Object} options - Query options
   * @param {string} options.role - Filter by role
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.search - Search term
   * @returns {Promise<Object>} Users data
   */
  async getUsers(options = {}) {
    try {
      let query = supabase.from("users").select("*");

      // Apply filters
      if (options.role) {
        query = query.eq("role", options.role);
      }

      if (options.search) {
        query = query.or(
          `first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,username.ilike.%${options.search}%`
        );
      }

      if (options.is_active !== undefined) {
        query = query.eq("is_active", options.is_active);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      // Order by created_at desc
      query = query.order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          users: data,
          total: count,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user data
   */
  async updateUser(userId, updateData) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Deactivate user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success status
   */
  async deactivateUser(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

---

## 📚 Category & Difficulty APIs

```javascript
const categoriesService = {
  /**
   * Get all active categories dengan difficulties
   * @returns {Promise<Object>} Categories with difficulties
   */
  async getAvailableQuizzes() {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select(
          `
          id,
          name,
          description,
          difficulties:difficulty_levels!inner(
            id,
            name,
            order_index,
            question_count:questions(count)
          )
        `
        )
        .eq("is_active", true)
        .eq("difficulties.is_active", true)
        .order("name");

      if (error) throw error;

      // Transform data untuk frontend
      const transformedData = data.map((category) => ({
        ...category,
        difficulties: category.difficulties.map((diff) => ({
          ...diff,
          question_count: diff.question_count[0]?.count || 0,
        })),
      }));

      return {
        success: true,
        data: transformedData,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get all categories
   * @returns {Promise<Object>} All categories
   */
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Create new category
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.name - Category name
   * @param {string} categoryData.description - Category description
   * @param {string} categoryData.created_by - Creator user ID
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: categoryData.name,
          description: categoryData.description,
          created_by: categoryData.created_by,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

const difficultyService = {
  /**
   * Get all difficulty levels
   * @returns {Promise<Object>} Difficulty levels
   */
  async getDifficultyLevels() {
    try {
      const { data, error } = await supabase
        .from("difficulty_levels")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

---

## ❓ Question Management APIs

```javascript
const questionsService = {
  /**
   * Get questions dengan filtering
   * @param {Object} options - Query options
   * @param {number} options.category_id - Filter by category
   * @param {number} options.difficulty_id - Filter by difficulty
   * @param {string} options.created_by - Filter by creator
   * @param {number} options.limit - Limit results
   * @returns {Promise<Object>} Questions data
   */
  async getQuestions(options = {}) {
    try {
      let query = supabase.from("questions").select(`
          *,
          categories(id, name),
          difficulty_levels(id, name),
          users(first_name, last_name),
          question_options(*)
        `);

      // Apply filters
      if (options.category_id) {
        query = query.eq("category_id", options.category_id);
      }

      if (options.difficulty_id) {
        query = query.eq("difficulty_id", options.difficulty_id);
      }

      if (options.created_by) {
        query = query.eq("created_by", options.created_by);
      }

      if (options.is_active !== undefined) {
        query = query.eq("is_active", options.is_active);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Order by created_at desc
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get questions untuk quiz
   * @param {number} categoryId - Category ID
   * @param {number} difficultyId - Difficulty ID
   * @param {number} limit - Number of questions
   * @returns {Promise<Object>} Quiz questions
   */
  async getQuizQuestions(categoryId, difficultyId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select(
          `
          *,
          question_options(*)
        `
        )
        .eq("category_id", categoryId)
        .eq("difficulty_id", difficultyId)
        .eq("is_active", true)
        .limit(limit);

      if (error) throw error;

      // Shuffle questions dan options
      const shuffledQuestions = data
        .sort(() => Math.random() - 0.5)
        .map((question) => ({
          ...question,
          question_options: question.question_options.sort(
            (a, b) => a.order_index - b.order_index
          ),
        }));

      return {
        success: true,
        data: shuffledQuestions,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Create new question dengan options
   * @param {Object} questionData - Question data
   * @returns {Promise<Object>} Created question
   */
  async createQuestion(questionData) {
    try {
      // Validate options
      const correctOptions = questionData.options.filter(
        (opt) => opt.is_correct
      );
      if (correctOptions.length !== 1) {
        throw new Error("Question must have exactly one correct answer");
      }

      // Insert question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert({
          category_id: questionData.category_id,
          difficulty_id: questionData.difficulty_id,
          question_text: questionData.question_text,
          explanation: questionData.explanation,
          image_url: questionData.image_url,
          audio_url: questionData.audio_url,
          created_by: questionData.created_by,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Insert options
      const optionsData = questionData.options.map((option, index) => ({
        question_id: question.id,
        option_text: option.text,
        is_correct: option.is_correct,
        order_index: index,
      }));

      const { data: options, error: optionsError } = await supabase
        .from("question_options")
        .insert(optionsData)
        .select();

      if (optionsError) throw optionsError;

      return {
        success: true,
        data: {
          ...question,
          question_options: options,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update question
   * @param {number} questionId - Question ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated question
   */
  async updateQuestion(questionId, updateData) {
    try {
      // Update question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .update({
          category_id: updateData.category_id,
          difficulty_id: updateData.difficulty_id,
          question_text: updateData.question_text,
          explanation: updateData.explanation,
          image_url: updateData.image_url,
          audio_url: updateData.audio_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", questionId)
        .select()
        .single();

      if (questionError) throw questionError;

      // Update options if provided
      if (updateData.options) {
        // Delete existing options
        await supabase
          .from("question_options")
          .delete()
          .eq("question_id", questionId);

        // Insert new options
        const optionsData = updateData.options.map((option, index) => ({
          question_id: questionId,
          option_text: option.text,
          is_correct: option.is_correct,
          order_index: index,
        }));

        const { data: options, error: optionsError } = await supabase
          .from("question_options")
          .insert(optionsData)
          .select();

        if (optionsError) throw optionsError;

        return {
          success: true,
          data: {
            ...question,
            question_options: options,
          },
        };
      }

      return {
        success: true,
        data: question,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Delete question
   * @param {number} questionId - Question ID
   * @returns {Promise<Object>} Success status
   */
  async deleteQuestion(questionId) {
    try {
      const { error } = await supabase
        .from("questions")
        .update({ is_active: false })
        .eq("id", questionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

---

## 🎯 Quiz APIs

```javascript
const quizService = {
  /**
   * Start new quiz attempt
   * @param {Object} quizData - Quiz data
   * @param {string} quizData.student_id - Student ID
   * @param {number} quizData.category_id - Category ID
   * @param {number} quizData.difficulty_id - Difficulty ID
   * @param {number} quizData.total_questions - Total questions
   * @returns {Promise<Object>} Quiz attempt data
   */
  async startQuizAttempt(quizData) {
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .insert({
          student_id: quizData.student_id,
          category_id: quizData.category_id,
          difficulty_id: quizData.difficulty_id,
          total_questions: quizData.total_questions,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Submit quiz answers
   * @param {Object} submissionData - Submission data
   * @param {number} submissionData.attempt_id - Attempt ID
   * @param {Array} submissionData.answers - Array of answers
   * @param {number} submissionData.time_taken - Time taken in seconds
   * @returns {Promise<Object>} Submission result
   */
  async submitQuizAnswers(submissionData) {
    try {
      // Insert answers
      const answersData = submissionData.answers.map((answer) => ({
        attempt_id: submissionData.attempt_id,
        question_id: answer.question_id,
        selected_option_id: answer.selected_option_id,
        is_correct: answer.is_correct,
        answered_at: new Date().toISOString(),
      }));

      const { error: answersError } = await supabase
        .from("quiz_answers")
        .insert(answersData);

      if (answersError) throw answersError;

      // Calculate score
      const correctAnswers = submissionData.answers.filter(
        (a) => a.is_correct
      ).length;
      const score = Math.round(
        (correctAnswers / submissionData.answers.length) * 100
      );

      // Update attempt
      const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .update({
          correct_answers: correctAnswers,
          score: score,
          time_taken: submissionData.time_taken,
          completed_at: new Date().toISOString(),
          is_completed: true,
        })
        .eq("id", submissionData.attempt_id)
        .select(
          `
          *,
          categories(name),
          difficulty_levels(name)
        `
        )
        .single();

      if (attemptError) throw attemptError;

      return {
        success: true,
        data: {
          attempt: attempt,
          score: score,
          correct_answers: correctAnswers,
          total_questions: submissionData.answers.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get quiz results
   * @param {Object} options - Query options
   * @param {string} options.student_id - Student ID
   * @param {number} options.attempt_id - Specific attempt ID
   * @param {number} options.limit - Limit results
   * @returns {Promise<Object>} Quiz results
   */
  async getQuizResults(options = {}) {
    try {
      let query = supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          categories(id, name),
          difficulty_levels(id, name),
          users(first_name, last_name)
        `
        )
        .eq("is_completed", true);

      if (options.student_id) {
        query = query.eq("student_id", options.student_id);
      }

      if (options.attempt_id) {
        query = query.eq("id", options.attempt_id);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      query = query.order("completed_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get detailed quiz result dengan answers
   * @param {number} attemptId - Attempt ID
   * @returns {Promise<Object>} Detailed quiz result
   */
  async getQuizResultDetail(attemptId) {
    try {
      // Get attempt data
      const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          categories(name),
          difficulty_levels(name),
          users(first_name, last_name)
        `
        )
        .eq("id", attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Get answers dengan question details
      const { data: answers, error: answersError } = await supabase
        .from("quiz_answers")
        .select(
          `
          *,
          questions(
            id,
            question_text,
            explanation,
            question_options(*)
          ),
          question_options!selected_option_id(
            id,
            option_text,
            is_correct
          )
        `
        )
        .eq("attempt_id", attemptId)
        .order("answered_at");

      if (answersError) throw answersError;

      return {
        success: true,
        data: {
          attempt: attempt,
          answers: answers,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

---

## 📊 Analytics APIs

```javascript
const analyticsService = {
  /**
   * Get student progress analytics
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Student analytics
   */
  async getStudentProgress(studentId) {
    try {
      // Get all attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select(
          `
          id,
          score,
          completed_at,
          categories(name),
          difficulty_levels(name)
        `
        )
        .eq("student_id", studentId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false });

      if (attemptsError) throw attemptsError;

      // Calculate statistics
      const totalAttempts = attempts.length;
      const averageScore =
        totalAttempts > 0
          ? Math.round(
              attempts.reduce((sum, attempt) => sum + attempt.score, 0) /
                totalAttempts
            )
          : 0;
      const bestScore =
        totalAttempts > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;

      // Category statistics
      const categoryStats = attempts.reduce((acc, attempt) => {
        const categoryName = attempt.categories?.name || "Unknown";
        if (!acc[categoryName]) {
          acc[categoryName] = {
            attempts: 0,
            totalScore: 0,
            averageScore: 0,
          };
        }
        acc[categoryName].attempts++;
        acc[categoryName].totalScore += attempt.score;
        acc[categoryName].averageScore = Math.round(
          acc[categoryName].totalScore / acc[categoryName].attempts
        );
        return acc;
      }, {});

      return {
        success: true,
        data: {
          totalAttempts,
          averageScore,
          bestScore,
          completedQuizzes: totalAttempts,
          categoryStats,
          recentAttempts: attempts.slice(0, 10),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get system-wide analytics
   * @returns {Promise<Object>} System analytics
   */
  async getSystemAnalytics() {
    try {
      // Get user statistics
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("role, is_active");

      if (usersError) throw usersError;

      // Get question statistics
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, is_active");

      if (questionsError) throw questionsError;

      // Get quiz attempts statistics
      const { data: attempts, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("score, completed_at")
        .eq("is_completed", true);

      if (attemptsError) throw attemptsError;

      // Calculate statistics
      const userStats = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      const totalUsers = users.length;
      const totalQuestions = questions.filter((q) => q.is_active).length;
      const totalQuizzes = attempts.length;
      const averageScore =
        attempts.length > 0
          ? Math.round(
              attempts.reduce((sum, attempt) => sum + attempt.score, 0) /
                attempts.length
            )
          : 0;

      return {
        success: true,
        data: {
          totalUsers,
          totalQuestions,
          totalQuizzes,
          averageScore,
          userStats,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get tutor analytics
   * @param {string} tutorId - Tutor ID
   * @returns {Promise<Object>} Tutor analytics
   */
  async getTutorAnalytics(tutorId) {
    try {
      // Get questions created by tutor
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select(
          `
          id,
          categories(name),
          difficulty_levels(name),
          created_at
        `
        )
        .eq("created_by", tutorId)
        .eq("is_active", true);

      if (questionsError) throw questionsError;

      // Get feedback given by tutor
      const { data: feedback, error: feedbackError } = await supabase
        .from("feedback")
        .select("id, rating, created_at")
        .eq("tutor_id", tutorId);

      if (feedbackError) throw feedbackError;

      // Calculate statistics
      const totalQuestions = questions.length;
      const totalFeedback = feedback.length;
      const averageRating =
        feedback.length > 0
          ? Math.round(
              (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) /
                feedback.length) *
                10
            ) / 10
          : 0;

      // Questions by category
      const questionsByCategory = questions.reduce((acc, question) => {
        const categoryName = question.categories?.name || "Unknown";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          totalQuestions,
          totalFeedback,
          averageRating,
          questionsByCategory,
          recentQuestions: questions.slice(0, 5),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

---

## 💬 Feedback APIs

```javascript
const feedbackService = {
  /**
   * Create feedback untuk quiz attempt
   * @param {Object} feedbackData - Feedback data
   * @param {number} feedbackData.attempt_id - Quiz attempt ID
   * @param {string} feedbackData.student_id - Student ID
   * @param {string} feedbackData.tutor_id - Tutor ID
   * @param {string} feedbackData.feedback_text - Feedback text
   * @param {string} feedbackData.recommendations - Recommendations
   * @param {number} feedbackData.rating - Rating (1-5)
   * @returns {Promise<Object>} Created feedback
   */
  async createFeedback(feedbackData) {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .insert({
          attempt_id: feedbackData.attempt_id,
          student_id: feedbackData.student_id,
          tutor_id: feedbackData.tutor_id,
          feedback_text: feedbackData.feedback_text,
          recommendations: feedbackData.recommendations,
          rating: feedbackData.rating,
        })
        .select(
          `
          *,
          users!tutor_id(first_name, last_name),
          quiz_attempts(
            score,
            categories(name),
            difficulty_levels(name)
          )
        `
        )
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get feedback untuk student
   * @param {string} studentId - Student ID
   * @param {number} limit - Limit results
   * @returns {Promise<Object>} Student feedback
   */
  async getFeedback(studentId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(
          `
          *,
          users!tutor_id(first_name, last_name),
          quiz_attempts(
            score,
            categories(name),
            difficulty_levels(name)
          )
        `
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get feedback yang perlu diberikan tutor
   * @param {string} tutorId - Tutor ID
   * @returns {Promise<Object>} Pending feedback
   */
  async getPendingFeedback(tutorId) {
    try {
      // Get completed attempts yang belum ada feedback
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          categories(name),
          difficulty_levels(name),
          users(first_name, last_name),
          feedback(id)
        `
        )
        .eq("is_completed", true)
        .is("feedback.id", null)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update feedback
   * @param {number} feedbackId - Feedback ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated feedback
   */
  async updateFeedback(feedbackId, updateData) {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedbackId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

---

## 📁 File Upload APIs

```javascript
const fileService = {
  /**
   * Upload image file
   * @param {File} file - Image file
   * @param {string} folder - Storage folder (questions/avatars)
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(file, folder = "questions") {
    try {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("File size too large. Maximum 5MB allowed.");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from("quiz-files")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("quiz-files").getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: data.path,
          url: publicUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Upload audio file
   * @param {File} file - Audio file
   * @param {string} folder - Storage folder
   * @returns {Promise<Object>} Upload result
   */
  async uploadAudio(file, folder = "questions") {
    try {
      // Validate file type
      const allowedTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/mp4",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Only MP3, WAV, OGG, and M4A are allowed."
        );
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("File size too large. Maximum 10MB allowed.");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from("quiz-files")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("quiz-files").getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: data.path,
          url: publicUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Delete file from storage
   * @param {string} filePath - File path in storage
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from("quiz-files")
        .remove([filePath]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

---

## ⚠️ Error Handling

### Standard Error Response Format:

```javascript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE", // Optional
  details: {} // Optional additional details
}
```

### Common Error Codes:

- `AUTH_REQUIRED` - Authentication required
- `PERMISSION_DENIED` - Insufficient permissions
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ENTRY` - Duplicate data
- `FILE_TOO_LARGE` - File size exceeds limit
- `INVALID_FILE_TYPE` - Unsupported file type

### Error Handling Best Practices:

```javascript
// Always wrap API calls in try-catch
const handleApiCall = async () => {
  try {
    const result = await apiService.someMethod();

    if (!result.success) {
      // Handle API error
      toast.error(result.error);
      return;
    }

    // Handle success
    setData(result.data);
  } catch (error) {
    // Handle network/unexpected errors
    console.error("Unexpected error:", error);
    toast.error("An unexpected error occurred");
  }
};

// Check for specific error types
if (result.error?.includes("duplicate")) {
  toast.error("This item already exists");
} else if (result.error?.includes("permission")) {
  toast.error("You do not have permission to perform this action");
} else {
  toast.error(result.error || "An error occurred");
}
```

---

## 🚦 Rate Limiting

### Supabase Rate Limits:

- **API Requests**: 100 requests per second per IP
- **Auth Requests**: 30 requests per hour per IP
- **Storage Uploads**: 100 uploads per hour per user

### Frontend Rate Limiting:

```javascript
// Debounce search inputs
import { debounce } from "lodash";

const debouncedSearch = debounce(async (searchTerm) => {
  const result = await searchService.search(searchTerm);
  setResults(result.data);
}, 300);

// Throttle button clicks
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return;

  setIsSubmitting(true);
  try {
    await submitData();
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 🔍 Testing APIs

### Using Browser Console:

```javascript
// Test authentication
const testAuth = async () => {
  const result = await authService.login({
    username: "john_student",
    password: "password123",
  });
  console.log("Auth result:", result);
};

// Test quiz creation
const testQuiz = async () => {
  const questions = await questionsService.getQuizQuestions(1, 1, 5);
  console.log("Quiz questions:", questions);
};
```

### Using curl:

```bash
# Test Supabase API directly
curl -X GET 'https://your-project.supabase.co/rest/v1/users' \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-jwt-token"

# Test with filters
curl -X GET 'https://your-project.supabase.co/rest/v1/questions?category_id=eq.1' \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-jwt-token"
```

### API Testing Checklist:

- [ ] Test with valid data
- [ ] Test with invalid data
- [ ] Test authentication required endpoints
- [ ] Test permission-based access
- [ ] Test pagination
- [ ] Test filtering and sorting
- [ ] Test file uploads
- [ ] Test error scenarios
- [ ] Test rate limiting
- [ ] Test concurrent requests

---

## 📚 API Usage Examples

### Complete Quiz Flow:

```javascript
// 1. Get available quizzes
const quizzes = await categoriesService.getAvailableQuizzes();

// 2. Start quiz attempt
const attempt = await quizService.startQuizAttempt({
  student_id: user.id,
  category_id: 1,
  difficulty_id: 1,
  total_questions: 10,
});

// 3. Get quiz questions
const questions = await questionsService.getQuizQuestions(1, 1, 10);

// 4. Submit answers
const submission = await quizService.submitQuizAnswers({
  attempt_id: attempt.data.id,
  answers: userAnswers,
  time_taken: 1200,
});

// 5. Get detailed results
const results = await quizService.getQuizResultDetail(attempt.data.id);
```

### User Management Flow:

```javascript
// 1. Get all users
const users = await usersService.getUsers({
  role: "student",
  limit: 20,
  search: "john",
});

// 2. Create new user
const newUser = await authService.register({
  username: "new_student",
  password: "password123",
  firstName: "New",
  lastName: "Student",
  role: "student",
});

// 3. Update user
const updated = await usersService.updateUser(userId, {
  first_name: "Updated Name",
  is_active: true,
});
```

### Question Management Flow:

```javascript
// 1. Create question with options
const question = await questionsService.createQuestion({
  category_id: 1,
  difficulty_id: 2,
  question_text: 'What is the past tense of "go"?',
  explanation: 'The past tense of "go" is "went".',
  created_by: user.id,
  options: [
    { text: "goed", is_correct: false },
    { text: "went", is_correct: true },
    { text: "gone", is_correct: false },
    { text: "going", is_correct: false },
  ],
});

// 2. Upload image for question
const imageUpload = await fileService.uploadImage(imageFile, "questions");
if (imageUpload.success) {
  await questionsService.updateQuestion(question.data.id, {
    image_url: imageUpload.data.url,
  });
}
```

---

## 🔧 Debugging Tips

### Enable Debug Mode:

```javascript
// Add to supabase client
const supabase = createClient(url, key, {
  auth: {
    debug: true,
  },
  db: {
    schema: "public",
  },
});
```

### Log API Calls:

```javascript
// Wrapper untuk logging
const apiWrapper = (service, methodName) => {
  return async (...args) => {
    console.log(`🔄 API Call: ${methodName}`, args);
    const start = Date.now();

    try {
      const result = await service[methodName](...args);
      const duration = Date.now() - start;

      console.log(`✅ API Success: ${methodName} (${duration}ms)`, result);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ API Error: ${methodName} (${duration}ms)`, error);
      throw error;
    }
  };
};

// Usage
const debugAuthService = {
  login: apiWrapper(authService, "login"),
  register: apiWrapper(authService, "register"),
};
```

### Common Debug Scenarios:

```javascript
// Check RLS policies
const testRLS = async () => {
  const { data, error } = await supabase.from("users").select("*").limit(1);

  console.log("RLS Test:", { data, error });
};

// Check authentication state
const checkAuth = async () => {
  const session = await supabase.auth.getSession();
  const user = await supabase.auth.getUser();
  console.log("Auth State:", { session, user });
};

// Test specific query
const testQuery = async () => {
  const { data, error, status, statusText } = await supabase
    .from("questions")
    .select("*")
    .eq("id", 1);

  console.log("Query Test:", { data, error, status, statusText });
};
```

---

Dokumentasi API ini memberikan panduan lengkap untuk semua endpoint yang tersedia dalam sistem Quiz English. Setiap fungsi dilengkapi dengan parameter yang jelas, contoh penggunaan, dan penanganan error yang proper.

```

```
