import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersService, questionsService, analyticsService } from '../services/supabaseService.js';
import { toast } from 'react-toastify';
import Loading from '../components/Loading.jsx';
import { Users, BookOpen, MessageSquare, TrendingUp, Plus, Eye, Award } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const TutorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    averageScore: 0,
    categoryStats: [],
    studentPerformance: []
  });
  const [students, setStudents] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const [tutorAnalyticsRes, studentsRes, questionsRes] = await Promise.allSettled([
        analyticsService.getTutorAnalytics(),
        usersService.getUsers({ role: 'student', limit: 5 }),
        questionsService.getQuestions({ limit: 5 })
      ]);

      // Handle tutor analytics response
      if (tutorAnalyticsRes.status === 'fulfilled' && tutorAnalyticsRes.value.success) {
        const analyticsData = tutorAnalyticsRes.value.data || {};
        
        // Get system stats for total students count
        const systemStatsRes = await analyticsService.getSystemAnalytics();
        const systemStats = systemStatsRes.success ? systemStatsRes.data : {};
        
        setDashboardData({
          totalStudents: systemStats.userStats?.student || 0,
          totalQuestions: systemStats.totalQuestions || 0,
          totalAttempts: analyticsData.totalAttempts || 0,
          averageScore: analyticsData.averageScore || 0,
          categoryStats: analyticsData.categoryStats || [],
          studentPerformance: analyticsData.studentPerformance || []
        });
      } else {
        console.log('Tutor analytics error:', tutorAnalyticsRes.reason);
        setDashboardData({
          totalStudents: 0,
          totalQuestions: 0,
          totalAttempts: 0,
          averageScore: 0,
          categoryStats: [],
          studentPerformance: []
        });
      }

      // Handle students response
      if (studentsRes.status === 'fulfilled' && studentsRes.value.success) {
        const studentsData = studentsRes.value.data || {};
        setStudents(Array.isArray(studentsData.users) ? studentsData.users.slice(0, 5) : []);
      } else {
        console.log('Students error:', studentsRes.reason);
        setStudents([]);
      }

      // Handle questions response
      if (questionsRes.status === 'fulfilled' && questionsRes.value.success) {
        const questionsData = questionsRes.value.data || {};
        const questions = questionsData.questions || questionsData;
        setRecentQuestions(Array.isArray(questions) ? questions.slice(0, 5) : []);
      } else {
        console.log('Questions error:', questionsRes.reason);
        setRecentQuestions([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Some dashboard data could not be loaded');
      
      // Set empty values on error
      setDashboardData({
        totalStudents: 0,
        totalQuestions: 0,
        totalAttempts: 0,
        averageScore: 0,
        categoryStats: [],
        studentPerformance: []
      });
      setStudents([]);
      setRecentQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading tutor dashboard..." />;

  // Prepare chart data with safety checks
  const categoryData = dashboardData.categoryStats?.length > 0 ? {
    labels: dashboardData.categoryStats.map(cat => cat.category_name || 'Unknown'),
    datasets: [
      {
        label: 'Questions Created',
        data: dashboardData.categoryStats.map(cat => cat.question_count || 0),
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

  const studentPerformanceData = dashboardData.studentPerformance?.length > 0 ? {
    labels: dashboardData.studentPerformance.map(student => 
      `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'
    ),
    datasets: [
      {
        label: 'Average Score',
        data: dashboardData.studentPerformance.map(student => student.average_score || 0),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1
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

  return (
    <div className="container">
      <div className="main-content">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tutor Dashboard</h1>
            <p className="text-gray-600">Manage your students and questions</p>
          </div>
          <div className="flex gap-3">
            <Link to="/questions" className="btn btn-primary">
              <Plus size={16} />
              Create Question
            </Link>
            <Link to="/feedback" className="btn btn-outline">
              <MessageSquare size={16} />
              Give Feedback
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <Users size={32} className="text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData.totalStudents}</h3>
              <p className="text-gray-600">Total Students</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <BookOpen size={32} className="text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData.totalQuestions}</h3>
              <p className="text-gray-600">Questions Created</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <Award size={32} className="text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData.totalAttempts}</h3>
              <p className="text-gray-600">Quiz Attempts</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <TrendingUp size={32} className="text-orange-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData.averageScore}%</h3>
              <p className="text-gray-600">Avg Student Score</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Questions by Category */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Questions by Category</h2>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                {categoryData ? (
                  <Doughnut data={categoryData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No questions created yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Performance */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Student Performance</h2>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                {studentPerformanceData ? (
                  <Bar data={studentPerformanceData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No student performance data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Students */}
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h2 className="card-title">Recent Students</h2>
                <Link to="/users" className="text-blue-600 hover:underline text-sm">
                  View All
                </Link>
              </div>
            </div>
            <div className="card-body">
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No students yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map(student => (
                    <div key={student.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">
                          {student.first_name} {student.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          @{student.username} • {student.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(student.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/student-progress/${student.id}`}
                          className="btn btn-sm btn-outline"
                        >
                          <Eye size={14} />
                          View Progress
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Questions */}
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h2 className="card-title">Recent Questions</h2>
                <Link to="/questions" className="text-blue-600 hover:underline text-sm">
                  View All
                </Link>
              </div>
            </div>
            <div className="card-body">
              {recentQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No questions created yet</p>
                  <Link to="/questions" className="btn btn-primary">
                    <Plus size={16} />
                    Create First Question
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentQuestions.map(question => (
                    <div key={question.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">
                          {question.question_text.substring(0, 80)}
                          {question.question_text.length > 80 ? '...' : ''}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-info text-xs">
                          {question.categories?.name || question.category_name || 'Unknown Category'}
                        </span>
                        <span className="badge badge-warning text-xs">
                          {question.difficulty_levels?.name || question.difficulty_name || 'Unknown Difficulty'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Created {new Date(question.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-8">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/questions" className="p-4 border rounded-lg hover:shadow-md transition-shadow text-center">
                <BookOpen size={32} className="text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Manage Questions</h3>
                <p className="text-sm text-gray-600">Create, edit, and organize quiz questions</p>
              </Link>

              <Link to="/feedback" className="p-4 border rounded-lg hover:shadow-md transition-shadow text-center">
                <MessageSquare size={32} className="text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Give Feedback</h3>
                <p className="text-sm text-gray-600">Provide personalized feedback to students</p>
              </Link>

              <div className="p-4 border rounded-lg text-center opacity-75">
                <TrendingUp size={32} className="text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">View Analytics</h3>
                <p className="text-sm text-gray-600">Detailed performance analytics (Coming Soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;