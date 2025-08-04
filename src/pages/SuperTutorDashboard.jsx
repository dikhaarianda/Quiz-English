import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService, usersService } from '../services/supabaseService.js';
import { toast } from 'react-toastify';
import Loading from '../components/Loading.jsx';
import { Users, BookOpen, Award, TrendingUp, Settings, UserPlus, MessageSquare, BarChart3 } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, BarElement, ArcElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, BarElement, ArcElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const SuperTutorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    averageScore: 0,
    newUsersThisWeek: 0,
    newQuestionsThisWeek: 0,
    newAttemptsThisWeek: 0,
    scoreChange: 0,
    userGrowth: [],
    usersByRole: [],
    questionsByCategory: [],
    recentUsers: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Use Promise.allSettled to handle partial failures gracefully
      const [analyticsRes, recentUsersRes] = await Promise.allSettled([
        analyticsService.getSystemAnalytics(),
        usersService.getUsers({ limit: 10 })
      ]);

      let dashboardStats = {
        totalUsers: 0,
        totalQuestions: 0,
        totalAttempts: 0,
        averageScore: 0,
        newUsersThisWeek: 0,
        newQuestionsThisWeek: 0,
        newAttemptsThisWeek: 0,
        scoreChange: 0,
        userGrowth: [],
        usersByRole: [],
        questionsByCategory: [],
        recentUsers: []
      };

      // Handle analytics response
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
        const data = analyticsRes.value.data || {};
        console.log('Analytics data received:', data);
        
        dashboardStats = {
          ...dashboardStats,
          totalUsers: data.totalUsers || 0,
          totalQuestions: data.totalQuestions || 0,
          totalAttempts: data.totalQuizzes || 0,
          averageScore: data.averageScore || 0,
          newUsersThisWeek: data.newUsersThisWeek || 0,
          newQuestionsThisWeek: data.newQuestionsThisWeek || 0,
          newAttemptsThisWeek: data.newAttemptsThisWeek || 0,
          scoreChange: data.scoreChange || 0,
          userGrowth: data.userGrowth || [],
          questionsByCategory: data.questionsByCategory || [],
          // Convert userStats object to array for chart
          usersByRole: data.userStats ? Object.entries(data.userStats).map(([role, count]) => ({
            role,
            count
          })) : []
        };
      } else {
        console.log('Analytics error:', analyticsRes.reason);
      }

      // Handle recent users response
      if (recentUsersRes.status === 'fulfilled' && recentUsersRes.value.success) {
        const usersData = recentUsersRes.value.data || {};
        dashboardStats.recentUsers = Array.isArray(usersData.users) ? usersData.users.slice(0, 10) : [];
      } else {
        console.log('Recent users error:', recentUsersRes.reason);
      }

      setDashboardData(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Set empty values on error - no dummy data
      setDashboardData({
        totalUsers: 0,
        totalQuestions: 0,
        totalAttempts: 0,
        averageScore: 0,
        newUsersThisWeek: 0,
        newQuestionsThisWeek: 0,
        newAttemptsThisWeek: 0,
        scoreChange: 0,
        userGrowth: [],
        usersByRole: [],
        questionsByCategory: [],
        recentUsers: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading admin dashboard..." />;

  // Prepare chart data with safety checks
  const userGrowthData = dashboardData.userGrowth.length > 0 ? {
    labels: dashboardData.userGrowth.map(item => item.date || 'Unknown'),
    datasets: [
      {
        label: 'New Users',
        data: dashboardData.userGrowth.map(item => item.count || 0),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  } : null;

  const userRoleData = dashboardData.usersByRole.length > 0 ? {
    labels: dashboardData.usersByRole.map(item => (item.role || 'unknown').replace('_', ' ')),
    datasets: [
      {
        data: dashboardData.usersByRole.map(item => item.count || 0),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ]
      }
    ]
  } : null;

  const categoryData = dashboardData.questionsByCategory.length > 0 ? {
    labels: dashboardData.questionsByCategory.map(cat => cat.category_name || 'Unknown'),
    datasets: [
      {
        label: 'Questions',
        data: dashboardData.questionsByCategory.map(cat => cat.count || 0),
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
        beginAtZero: true
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
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Platform overview and management</p>
          </div>
          <div className="flex gap-3">
            <Link to="/users" className="btn btn-primary">
              <UserPlus size={16} />
              Manage Users
            </Link>
            <Link to="/questions" className="btn btn-outline">
              <Settings size={16} />
              Platform Settings
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <Users size={32} className="text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData.totalUsers}</h3>
              <p className="text-gray-600">Total Users</p>
              <p className="text-xs text-gray-500 mt-1">
                +{dashboardData.newUsersThisWeek} this week
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <BookOpen size={32} className="text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData.totalQuestions}</h3>
              <p className="text-gray-600">Total Questions</p>
              <p className="text-xs text-gray-500 mt-1">
                +{dashboardData.newQuestionsThisWeek} this week
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <Award size={32} className="text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData.totalAttempts}</h3>
              <p className="text-gray-600">Quiz Attempts</p>
              <p className="text-xs text-gray-500 mt-1">
                +{dashboardData.newAttemptsThisWeek} this week
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <TrendingUp size={32} className="text-orange-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{dashboardData.averageScore}%</h3>
              <p className="text-gray-600">Platform Avg Score</p>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.scoreChange > 0 ? '+' : ''}{dashboardData.scoreChange}% vs last week
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">User Growth</h2>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                {userGrowthData ? (
                  <Line data={userGrowthData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No user growth data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Users by Role */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Users by Role</h2>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                {userRoleData ? (
                  <Doughnut data={userRoleData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No user role data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Questions by Category */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">Questions by Category</h2>
          </div>
          <div className="card-body">
            <div style={{ height: '400px' }}>
              {categoryData ? (
                <Bar data={categoryData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No question data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Users</h2>
            </div>
            <div className="card-body">
              {dashboardData.recentUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentUsers.map(user => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">
                          {user.first_name} {user.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          @{user.username} • {user.role.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        <span className={`badge ${
                          user.is_active ? 'badge-success' : 'badge-error'
                        } text-xs`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">System Health</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-green-800">Database</h4>
                    <p className="text-sm text-green-600">Connected</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-green-800">API Server</h4>
                    <p className="text-sm text-green-600">Running</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-blue-800">Storage</h4>
                    <p className="text-sm text-blue-600">85% Available</p>
                  </div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-yellow-800">Backup</h4>
                    <p className="text-sm text-yellow-600">Last: 2 hours ago</p>
                  </div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link to="/users" className="p-4 border rounded-lg hover:shadow-md transition-shadow text-center">
                <Users size={32} className="text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Manage Users</h3>
                <p className="text-sm text-gray-600">Create, edit, and manage user accounts</p>
              </Link>

              <Link to="/questions" className="p-4 border rounded-lg hover:shadow-md transition-shadow text-center">
                <BookOpen size={32} className="text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Question Bank</h3>
                <p className="text-sm text-gray-600">Oversee all quiz questions</p>
              </Link>

              <Link to="/feedback" className="p-4 border rounded-lg hover:shadow-md transition-shadow text-center">
                <MessageSquare size={32} className="text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Feedback System</h3>
                <p className="text-sm text-gray-600">Monitor tutor-student communication</p>
              </Link>

              <div className="p-4 border rounded-lg text-center opacity-75">
                <BarChart3 size={32} className="text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Advanced Analytics</h3>
                <p className="text-sm text-gray-600">Detailed platform insights (Coming Soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperTutorDashboard;