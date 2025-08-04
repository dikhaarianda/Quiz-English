import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { categoriesService, quizService } from '../services/supabaseService.js';
import { toast } from 'react-toastify';
import Loading from '../components/Loading.jsx';
import { BookOpen, Clock, Award, Users, Play, ArrowLeft, Info, Target, BarChart3 } from 'lucide-react';

const QuizDetail = () => {
  const { studentId, categoryId, difficultyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizDetail, setQuizDetail] = useState(null);
  const [previousAttempts, setPreviousAttempts] = useState([]);

  useEffect(() => {
    fetchQuizDetail();
  }, [categoryId, difficultyId]);

  const fetchQuizDetail = async () => {
    try {
      // Get available quizzes and quiz results using supabaseService
      const [quizzesRes, resultsRes] = await Promise.allSettled([
        categoriesService.getAvailableQuizzes(),
        quizService.getQuizResults({ limit: 50 })
      ]);

      // Find the specific quiz from available quizzes
      let foundQuiz = null;
      
      if (quizzesRes.status === 'fulfilled' && quizzesRes.value.success) {
        const data = quizzesRes.value.data;
        if (Array.isArray(data)) {
          // Handle nested structure from categories with difficulties
          data.forEach(category => {
            if (category.id == categoryId && category.difficulties) {
              const difficulty = category.difficulties.find(d => d.id == difficultyId);
              if (difficulty) {
                foundQuiz = {
                  category_name: category.name,
                  category_description: category.description,
                  difficulty_name: difficulty.name,
                  difficulty_description: difficulty.description,
                  question_count: difficulty.question_count || 10,
                  estimated_time: Math.ceil((difficulty.question_count || 10) * 1.5)
                };
              }
            }
          });
        }
      }

      if (!foundQuiz) {
        setQuizDetail(null);
        setLoading(false);
        return;
      }

      setQuizDetail(foundQuiz);

      // Filter previous attempts for this specific category and difficulty
      let filteredAttempts = [];
      if (resultsRes.status === 'fulfilled' && resultsRes.value.success) {
        const results = resultsRes.value.data || [];
        filteredAttempts = Array.isArray(results) ? 
          results.filter(result => {
            // Handle different possible data structures
            const resultCategoryId = result.category_id || result.categories?.id;
            const resultDifficultyId = result.difficulty_id || result.difficulty_levels?.id;
            return resultCategoryId == categoryId && resultDifficultyId == difficultyId;
          }).slice(0, 5) : [];
      }
      
      setPreviousAttempts(filteredAttempts);

    } catch (error) {
      console.error('Error fetching quiz detail:', error);
      toast.error('Failed to load quiz details');
      navigate(`/student/${studentId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (!quizDetail || quizDetail.question_count === 0) {
      toast.error('No questions available for this quiz');
      return;
    }
    
    // Navigate to quiz taking page
    navigate(`/student/${studentId}/quiz/${categoryId}/${difficultyId}`);
  };

  if (loading) return <Loading message="Loading quiz details..." />;

  if (!quizDetail) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="card">
            <div className="card-body text-center py-12">
              <BookOpen size={64} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-600 mb-2">Quiz Not Found</h2>
              <p className="text-gray-500 mb-6">The requested quiz could not be found or is not available.</p>
              <Link to={`/student/${studentId}`} className="btn btn-primary">
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bestScore = previousAttempts.length > 0 
    ? Math.max(...previousAttempts.map(attempt => attempt.score))
    : 0;

  const averageScore = previousAttempts.length > 0
    ? Math.round(previousAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / previousAttempts.length)
    : 0;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container">
      <div className="main-content">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to={`/student/${studentId}`}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{quizDetail.category_name}</h1>
            <p className="text-gray-600">Quiz Details & Information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quiz Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz Overview */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center gap-2">
                  <Info size={20} />
                  Quiz Overview
                </h2>
              </div>
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{quizDetail.category_name}</h3>
                    <p className="text-gray-600 mb-4">
                      {quizDetail.category_description || 'Test your knowledge in this category.'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(quizDetail.difficulty_name)}`}>
                    {quizDetail.difficulty_name}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <BookOpen size={24} className="text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Questions</p>
                      <p className="font-semibold">{quizDetail.question_count}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Clock size={24} className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Est. Time</p>
                      <p className="font-semibold">~{quizDetail.estimated_time || Math.ceil(quizDetail.question_count * 1.5)} min</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Target size={24} className="text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Difficulty</p>
                      <p className="font-semibold">{quizDetail.difficulty_name}</p>
                    </div>
                  </div>
                </div>

                {quizDetail.difficulty_description && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">About This Difficulty Level:</h4>
                    <p className="text-gray-700">{quizDetail.difficulty_description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Quiz Instructions</h2>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                    <p>Read each question carefully before selecting your answer.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                    <p>You can only select one answer per question.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                    <p>Once you submit an answer, you cannot change it.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                    <p>Your results will be available immediately after completion.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">5</div>
                    <p>Take your time - there's no strict time limit, but aim to complete within the estimated time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Start Quiz Card */}
            <div className="card">
              <div className="card-body text-center">
                <div className="mb-4">
                  <Award size={48} className="text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Test your knowledge with {quizDetail.question_count} carefully selected questions.
                  </p>
                </div>

                {quizDetail.question_count > 0 ? (
                  <button
                    onClick={handleStartQuiz}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    Start Quiz
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 mb-3">No questions available</p>
                    <button className="btn btn-disabled w-full" disabled>
                      Quiz Unavailable
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Stats */}
            {previousAttempts.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title flex items-center gap-2">
                    <BarChart3 size={18} />
                    Your Performance
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Attempts:</span>
                      <span className="font-semibold">{previousAttempts.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Best Score:</span>
                      <span className={`font-semibold ${getScoreColor(bestScore)}`}>
                        {bestScore}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average:</span>
                      <span className={`font-semibold ${getScoreColor(averageScore)}`}>
                        {averageScore}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Attempts */}
            {previousAttempts.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Attempts</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {previousAttempts.slice(0, 3).map((attempt, index) => (
                      <div key={attempt.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">
                            Attempt #{previousAttempts.length - index}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(attempt.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getScoreColor(attempt.score)}`}>
                            {attempt.score}%
                          </p>
                          <Link
                            to={`/student/${studentId}/quiz-results/${attempt.id}`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* First Time Taking */}
            {previousAttempts.length === 0 && (
              <div className="card">
                <div className="card-body text-center">
                  <Users size={32} className="text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-800 mb-2">First Attempt!</h3>
                  <p className="text-sm text-green-700">
                    This will be your first time taking this quiz. Good luck!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetail;
