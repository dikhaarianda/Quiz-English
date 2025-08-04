import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analyticsService, feedbackService, usersService } from '../services/supabaseService.js';
import Loading from '../components/Loading.jsx';
import { ArrowLeft, TrendingUp, Award, BookOpen, Clock, MessageSquare } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, BarElement, ArcElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, BarElement, ArcElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const StudentProgress = () => {
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentProgress = async () => {
      try {
        const [progressRes, feedbackRes, userRes] = await Promise.all([
          analyticsService.getStudentProgress(studentId),
          feedbackService.getFeedback(studentId),
          usersService.getUserProfile(studentId)
        ]);

        // Build progress data structure from supabase responses
        let progressData = {
          student: { first_name: '', last_name: '' },
          overall_stats: {
            total_attempts: 0,
            completed_attempts: 0,
            average_score: 0,
            best_score: 0
          },
          recent_attempts: [],
          category_progress: [],
          difficulty_progress: []
        };

        // Handle user profile
        if (userRes.success && userRes.data) {
          progressData.student = {
            first_name: userRes.data.first_name || '',
            last_name: userRes.data.last_name || ''
          };
        }

        // Handle analytics data
        if (progressRes.success && progressRes.data) {
          const data = progressRes.data;
          progressData.overall_stats = {
            total_attempts: data.totalAttempts || 0,
            completed_attempts: data.totalAttempts || 0,
            average_score: data.averageScore || 0,
            best_score: data.averageScore || 0 // Using average as best for now
          };
          
          progressData.recent_attempts = data.recentAttempts || [];
          
          // Convert categoryStats to expected format
          if (data.categoryStats) {
            progressData.category_progress = Object.entries(data.categoryStats).map(([name, stats]) => ({
              category_name: name,
              average_score: stats.averageScore || 0,
              attempts: stats.attempts || 0,
              best_score: stats.averageScore || 0
            }));
          }
        }

        setProgress(progressData);
        
        // Handle feedback
        if (feedbackRes.success && feedbackRes.data) {
          setFeedback(feedbackRes.data);
        } else {
          setFeedback([]);
        }
      } catch (error) {
        console.error('Error fetching student progress:', error);
        setError('Failed to load student progress');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProgress();
  }, [studentId]);

  if (loading) return <Loading message="Loading student progress..." />;

  if (error) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="card">
            <div className="card-body text-center">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link to="/tutor" className="btn btn-primary">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) return null;

  // Prepare chart data
  const recentAttemptsData = {
    labels: progress.recent_attempts.map(attempt =>
      new Date(attempt.completed_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Quiz Scores',
        data: progress.recent_attempts.map(attempt => attempt.score),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const categoryData = {
    labels: progress.category_progress.map(cat => cat.category_name),
    datasets: [
      {
        label: 'Average Score',
        data: progress.category_progress.map(cat => cat.average_score),
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
  };

  const difficultyData = {
    labels: progress.difficulty_progress.map(diff => diff.difficulty_name),
    datasets: [
      {
        data: progress.difficulty_progress.map(diff => diff.attempts),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

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

  return (
    <div className="container">
      <div className="main-content">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/tutor" className="btn btn-outline">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {progress.student.first_name} {progress.student.last_name}
            </h1>
            <p className="text-gray-600">Student Progress Report</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <BookOpen size={32} className="text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{progress.overall_stats.total_attempts}</h3>
              <p className="text-gray-600">Total Attempts</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <Award size={32} className="text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{progress.overall_stats.completed_attempts}</h3>
              <p className="text-gray-600">Completed Quizzes</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <TrendingUp size={32} className="text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{progress.overall_stats.average_score || 0}%</h3>
              <p className="text-gray-600">Average Score</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <Clock size={32} className="text-orange-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{progress.overall_stats.best_score || 0}%</h3>
              <p className="text-gray-600">Best Score</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Over Time */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Performance Over Time</h2>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                {progress.recent_attempts.length > 0 ? (
                  <Line data={recentAttemptsData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No quiz attempts yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Performance by Category</h2>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                {progress.category_progress.length > 0 ? (
                  <Bar data={categoryData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No category data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Difficulty Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Difficulty Distribution</h2>
            </div>
            <div className="card-body">
              <div style={{ height: '250px' }}>
                {progress.difficulty_progress.length > 0 ? (
                  <Doughnut data={difficultyData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No difficulty data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card lg:col-span-2">
            <div className="card-header">
              <h2 className="card-title">Detailed Category Performance</h2>
            </div>
            <div className="card-body">
              {progress.category_progress.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No category performance data available</p>
              ) : (
                <div className="space-y-4">
                  {progress.category_progress.map(category => (
                    <div key={category.category_name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">{category.category_name}</h4>
                        <p className="text-sm text-gray-600">
                          {category.attempts} attempts • Best: {category.best_score}%
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {category.average_score}%
                        </div>
                        <div className="text-sm text-gray-500">Average</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Quiz Attempts */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">Recent Quiz Attempts</h2>
          </div>
          <div className="card-body">
            {progress.recent_attempts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent quiz attempts</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">Difficulty</th>
                      <th className="text-left py-3 px-4">Score</th>
                      <th className="text-left py-3 px-4">Questions</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.recent_attempts.map(attempt => (
                      <tr key={attempt.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="badge badge-info">
                            {attempt.category_name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="badge badge-warning">
                            {attempt.difficulty_name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${
                            attempt.score >= 80 ? 'text-green-600' : 
                            attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {attempt.score}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {attempt.total_questions}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link 
                            to={`/student/${studentId}/quiz-results/${attempt.id}`}
                            className="btn btn-sm btn-outline"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Feedback History */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h2 className="card-title flex items-center gap-2">
                <MessageSquare size={20} />
                Feedback History
              </h2>
              <Link 
                to="/feedback" 
                className="btn btn-sm btn-primary"
              >
                Give New Feedback
              </Link>
            </div>
          </div>
          <div className="card-body">
            {feedback.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No feedback given yet</p>
                <Link to="/feedback" className="btn btn-primary">
                  Give First Feedback
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {feedback.map(item => (
                  <div key={item.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-blue-800">
                        From: {item.tutor_first_name} {item.tutor_last_name}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {item.category_name && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-info text-xs">
                          {item.category_name}
                        </span>
                        <span className="badge badge-warning text-xs">
                          {item.difficulty_name}
                        </span>
                        {item.score && (
                          <span className="badge badge-success text-xs">
                            Score: {item.score}%
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-blue-700 mb-2">{item.feedback_text}</p>
                    
                    {item.recommendations && (
                      <div className="mt-2 p-2 bg-white rounded border-l-4 border-green-500">
                        <strong className="text-green-700">Recommendations:</strong>
                        <p className="text-green-700">{item.recommendations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;
