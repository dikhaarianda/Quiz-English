import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { quizService, analyticsService, feedbackService, categoriesService } from '../services/supabaseService.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-toastify';
import Loading from '../components/Loading.jsx';
import { BookOpen, Clock, Award, TrendingUp, Play, MessageSquare } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, ArcElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, ArcElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const StudentDashboard = () => {
  const { studentId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const currentStudentId = studentId || user?.id;
      
      const [quizzesRes, resultsRes, feedbackRes, progressRes] = await Promise.allSettled([
        categoriesService.getAvailableQuizzes(),
        quizService.getQuizResults({ student_id: currentStudentId }),
        feedbackService.getStudentFeedback(currentStudentId),
        analyticsService.getStudentProgress(currentStudentId)
      ]);

      // Handle available quizzes
      let quizzes = [];
      console.log('Quizzes response:', quizzesRes);
      
      if (quizzesRes.status === 'fulfilled') {
        // Check if it's the new RPC function format
        if (quizzesRes.value && quizzesRes.value.success && quizzesRes.value.data) {
          const data = quizzesRes.value.data;
          console.log('Quiz data from RPC:', data);
          
          if (Array.isArray(data)) {
            // Transform categories with difficulties into flat quiz list
            data.forEach(category => {
              if (category.difficulties && Array.isArray(category.difficulties)) {
                category.difficulties.forEach(difficulty => {
                  if (difficulty.question_count > 0) { // Only show if there are questions
                    quizzes.push({
                      category_id: category.id,
                      category_name: category.name,
                      description: category.description,
                      difficulty_id: difficulty.id,
                      difficulty_name: difficulty.name,
                      question_count: difficulty.question_count
                    });
                  }
                });
              }
            });
          }
        }
        // Check if it's direct RPC response format
        else if (quizzesRes.value && quizzesRes.value.data && Array.isArray(quizzesRes.value.data)) {
          const data = quizzesRes.value.data;
          console.log('Direct RPC data:', data);
          
          data.forEach(category => {
            if (category.difficulties && Array.isArray(category.difficulties)) {
              category.difficulties.forEach(difficulty => {
                if (difficulty.question_count > 0) {
                  quizzes.push({
                    category_id: category.id,
                    category_name: category.name,
                    description: category.description,
                    difficulty_id: difficulty.id,
                    difficulty_name: difficulty.name,
                    question_count: difficulty.question_count
                  });
                }
              });
            }
          });
        }
        // Fallback: try to get categories and difficulties separately
        else {
          console.log('Fallback: getting categories and difficulties separately');
          try {
            const [categoriesRes, difficultiesRes] = await Promise.allSettled([
              categoriesService.getCategories(),
              categoriesService.getDifficultyLevels()
            ]);
            
            if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success &&
                difficultiesRes.status === 'fulfilled' && difficultiesRes.value.success) {
              
              const categories = categoriesRes.value.data || [];
              const difficulties = difficultiesRes.value.data || [];
              
              // Create combinations of categories and difficulties
              categories.forEach(category => {
                difficulties.forEach(difficulty => {
                  quizzes.push({
                    category_id: category.id,
                    category_name: category.name,
                    description: category.description,
                    difficulty_id: difficulty.id,
                    difficulty_name: difficulty.name,
                    question_count: 10 // Default count
                  });
                });
              });
            }
          } catch (fallbackError) {
            console.error('Fallback error:', fallbackError);
          }
        }
      } else {
        console.log('Available quizzes error:', quizzesRes.reason);
      }
      
      // Handle quiz results first to filter completed quizzes
      let results = [];
      if (resultsRes.status === 'fulfilled' && resultsRes.value.success) {
        results = resultsRes.value.data || [];
      } else {
        console.log('Quiz results error:', resultsRes.reason);
      }
      
      // Create a set of completed quiz combinations for this student
      const completedQuizzes = new Set();
      results.forEach(result => {
        if (result.is_completed) {
          completedQuizzes.add(`${result.category_id}-${result.difficulty_id}`);
        }
      });
      
      // Filter out completed quizzes from available quizzes
      const availableQuizzes = quizzes.filter(quiz => {
        const quizKey = `${quiz.category_id}-${quiz.difficulty_id}`;
        return !completedQuizzes.has(quizKey);
      });
      
      console.log('Completed quizzes:', Array.from(completedQuizzes));
      console.log('Filtered available quizzes:', availableQuizzes);
      setAvailableQuizzes(availableQuizzes);
      setRecentResults(Array.isArray(results) ? results.slice(0, 5) : []);

      // Handle feedback
      let feedbackData = [];
      if (feedbackRes.status === 'fulfilled' && feedbackRes.value.success) {
        feedbackData = feedbackRes.value.data || [];
      } else {
        console.log('Feedback error:', feedbackRes.reason);
      }
      setFeedback(Array.isArray(feedbackData) ? feedbackData.slice(0, 5) : []);

      // Handle progress data
      let dashboardStats = {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        completedQuizzes: 0,
        categoryProgress: []
      };

      if (progressRes.status === 'fulfilled' && progressRes.value.success) {
        const data = progressRes.value.data;
        dashboardStats = {
          totalAttempts: data.totalAttempts || 0,
          averageScore: data.averageScore || 0,
          bestScore: data.bestScore || data.averageScore || 0,
          completedQuizzes: data.totalAttempts || 0,
          categoryProgress: data.categoryStats ? Object.entries(data.categoryStats).map(([name, stats]) => ({
            category_name: name,
            attempts: stats.attempts || 0,
            average_score: stats.averageScore || 0
          })) : []
        };
      } else {
        console.log('Progress error:', progressRes.reason);
        // Fallback: use recent results to calculate basic stats
        if (results.length > 0) {
          const scores = results.map(r => r.score);
          dashboardStats = {
            totalAttempts: results.length,
            averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
            bestScore: Math.max(...scores),
            completedQuizzes: results.length,
            categoryProgress: []
          };
        }
      }
      setDashboardData(dashboardStats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');

      // Set empty arrays on error
      setAvailableQuizzes([]);
      setRecentResults([]);
      setFeedback([]);
      setDashboardData({
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        completedQuizzes: 0,
        categoryProgress: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading your dashboard..." />;

  // Prepare chart data with null checks
  const performanceData = {
    labels: (recentResults || []).map((result, index) =>
      result.completed_at ? new Date(result.completed_at).toLocaleDateString() : `Quiz ${index + 1}`
    ).reverse(),
    datasets: [
      {
        label: 'Quiz Scores',
        data: (recentResults || []).map(result => result.score || 0).reverse(),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const categoryData = dashboardData?.categoryProgress && dashboardData.categoryProgress.length > 0 ? {
    labels: dashboardData.categoryProgress.map(cat => cat.category_name || 'Unknown Category'),
    datasets: [
      {
        data: dashboardData.categoryProgress.map(cat => cat.attempts || 0),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ]
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  const currentStudentId = studentId || user?.id;

  return (
    <div className="container">
      <div className="main-content">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-gray-600">Track your English learning progress</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <BookOpen size={32} className="text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData?.totalAttempts || 0}</h3>
              <p className="text-gray-600">Quizzes Taken</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <Award size={32} className="text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">
                {dashboardData?.averageScore || 0}%
              </h3>
              <p className="text-gray-600">Average Score</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <TrendingUp size={32} className="text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">
                {dashboardData?.bestScore || 0}%
              </h3>
              <p className="text-gray-600">Best Score</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <Clock size={32} className="text-orange-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData?.completedQuizzes || 0}</h3>
              <p className="text-gray-600">Completed</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Performance</h2>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                {recentResults && recentResults.length > 0 ? (
                  <Line data={performanceData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No quiz results yet. Take your first quiz!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quiz Categories</h2>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                {categoryData ? (
                  <Doughnut data={categoryData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No category data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Available Quizzes */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">Available Quizzes</h2>
          </div>
          <div className="card-body">
            {!availableQuizzes || availableQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Quizzes Available</h3>
                <p className="text-gray-500">Check back later for new quizzes from your tutors.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableQuizzes.map((quiz, index) => (
                  <div key={`${quiz.category_id}-${quiz.difficulty_id}-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">{quiz.category_name}</h3>
                      <span className={`badge ${
                        quiz.difficulty_name === 'Beginner' ? 'badge-success' :
                        quiz.difficulty_name === 'Intermediate' ? 'badge-warning' : 'badge-error'
                      }`}>
                        {quiz.difficulty_name}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>

                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span>{quiz.question_count} questions</span>
                      <span>~{Math.ceil(quiz.question_count * 1.5)} min</span>
                    </div>

                    <Link
                      to={`/student/${currentStudentId}/quiz-detail/${quiz.category_id}/${quiz.difficulty_id}`}
                      className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Play size={16} />
                      View Quiz
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Results */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Quiz Results</h2>
            </div>
            <div className="card-body">
              {!recentResults || recentResults.length === 0 ? (
                <div className="text-center py-8">
                  <Award size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No quiz results yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentResults.map(result => (
                    <div key={result.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">{result.category_name || result.categories?.name || 'Quiz'}</h4>
                        <p className="text-sm text-gray-600">
                          {result.difficulty_name || result.difficulty_levels?.name || 'Unknown'} • {result.completed_at ? new Date(result.completed_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          result.score >= 80 ? 'text-green-600' :
                          result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {result.score || 0}%
                        </div>
                        <div className="flex flex-col gap-1">
                          <Link
                            to={`/student/${currentStudentId}/quiz-results/${result.id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Details
                          </Link>
                          <Link
                            to={`/student/${currentStudentId}/feedback/${result.id}`}
                            className="text-sm text-green-600 hover:underline"
                          >
                            Give Feedback
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Feedback */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2">
                <MessageSquare size={20} />
                My Recent Feedback
              </h2>
            </div>
            <div className="card-body">
              {!feedback || feedback.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No feedback given yet</p>
                  <p className="text-sm text-gray-400 mt-2">Complete quizzes and give feedback to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map(item => (
                    <div key={item.id} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-green-800">
                          Your Feedback
                        </h4>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}
                          </span>
                          {item.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-gray-500">Rating:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span
                                    key={star}
                                    className={`text-xs ${star <= item.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {item.quiz_attempts && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge badge-info text-xs">
                            {item.quiz_attempts.categories?.name || 'Quiz'}
                          </span>
                          {item.quiz_attempts.score && (
                            <span className="badge badge-success text-xs">
                              Score: {item.quiz_attempts.score}%
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-green-700 text-sm">{item.feedback_text}</p>

                      <div className="mt-2 flex justify-end">
                        <Link
                          to={`/student/${currentStudentId}/feedback/${item.attempt_id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit Feedback
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;