import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { quizService } from '../services/supabaseService.js';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext.jsx';
import Loading from '../components/Loading.jsx';
import { ArrowLeft, CheckCircle, XCircle, Award, Clock, BookOpen, TrendingUp } from 'lucide-react';

const QuizResults = () => {
  const { attemptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [showExplanations, setShowExplanations] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      const response = await quizService.getQuizResults(attemptId);
      
      if (!response.success) {
        toast.error(response.error || 'Failed to load quiz results');
        setResults(null);
        return;
      }
      
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      toast.error('Failed to load quiz results');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate back link based on user role
  const getBackLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'student':
        return `/student/${user.id}`;
      case 'tutor':
        return '/tutor';
      case 'super_tutor':
        return '/admin';
      default:
        return '/';
    }
  };

  // Get appropriate back text based on user role
  const getBackText = () => {
    if (!user) return 'Back';
    
    switch (user.role) {
      case 'student':
        return 'Back to Dashboard';
      case 'tutor':
        return 'Back to Tutor Dashboard';
      case 'super_tutor':
        return 'Back to Admin Dashboard';
      default:
        return 'Back';
    }
  };

  // Check if current user can retake quiz (only students)
  const canRetakeQuiz = () => {
    return user && user.role === 'student' && results && results.attempt;
  };

  if (loading) return <Loading message="Loading your results..." />;

  if (!results) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="card">
            <div className="card-body text-center">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Results Not Found</h2>
              <p className="text-gray-600 mb-6">
                The quiz results you're looking for could not be found.
              </p>
              <Link to={getBackLink()} className="btn btn-primary">
                {getBackText()}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { attempt, questions } = results;
  const correctAnswers = questions.filter(q => q.is_correct).length;
  const totalQuestions = questions.length;
  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'badge-success';
    if (score >= 60) return 'badge-warning';
    return 'badge-error';
  };

  const getPerformanceMessage = (score) => {
    if (score >= 90) return 'Excellent work! Outstanding performance!';
    if (score >= 80) return 'Great job! You have a strong understanding.';
    if (score >= 70) return 'Good work! Keep practicing to improve.';
    if (score >= 60) return 'Fair performance. Focus on areas that need improvement.';
    return 'Keep studying and practicing. You can do better!';
  };

  return (
    <div className="container">
      <div className="main-content">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={getBackLink()} className="btn btn-outline">
            <ArrowLeft size={16} />
            {getBackText()}
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Quiz Results</h1>
            <p className="text-gray-600">
              {attempt.category_name} • {attempt.difficulty_name} Level
            </p>
            {/* Show student name if viewing as tutor/super_tutor */}
            {user && ['tutor', 'super_tutor'].includes(user.role) && attempt.student_name && (
              <p className="text-sm text-blue-600">
                Student: {attempt.student_name}
              </p>
            )}
          </div>
        </div>

        {/* Score Overview */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(scorePercentage)}`}>
                {scorePercentage}%
              </div>
              <div className="flex justify-center mb-4">
                <span className={`badge ${getScoreBadge(scorePercentage)} text-lg px-4 py-2`}>
                  {correctAnswers} out of {totalQuestions} correct
                </span>
              </div>
              <p className="text-lg text-gray-600 mb-4">
                {getPerformanceMessage(scorePercentage)}
              </p>
              <div className="flex justify-center">
                {scorePercentage >= 80 ? (
                  <Award size={48} className="text-yellow-500" />
                ) : scorePercentage >= 60 ? (
                  <TrendingUp size={48} className="text-blue-500" />
                ) : (
                  <BookOpen size={48} className="text-gray-500" />
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BookOpen size={24} className="text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle size={24} className="text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
                <div className="text-sm text-gray-600">Incorrect Answers</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock size={24} className="text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {attempt.time_taken ? Math.round(attempt.time_taken / 60) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Minutes Taken</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Question Review</h2>
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="btn btn-outline"
          >
            {showExplanations ? 'Hide' : 'Show'} Explanations
          </button>
        </div>

        {/* Questions Review */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="card">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    question.is_correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {question.is_correct ? (
                      <CheckCircle size={16} />
                    ) : (
                      <XCircle size={16} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">
                        Question {index + 1}
                      </h3>
                      <span className={`badge ${question.is_correct ? 'badge-success' : 'badge-error'}`}>
                        {question.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 mb-4">{question.question_text}</p>
                    
                    <div className="space-y-2">
                      {question.options.map(option => {
                        const isSelected = option.id === question.selected_option_id;
                        const isCorrect = option.is_correct;
                        
                        let optionClass = 'p-3 rounded-lg border ';
                        if (isCorrect) {
                          optionClass += 'border-green-500 bg-green-50 text-green-800';
                        } else if (isSelected && !isCorrect) {
                          optionClass += 'border-red-500 bg-red-50 text-red-800';
                        } else {
                          optionClass += 'border-gray-200 bg-gray-50 text-gray-700';
                        }
                        
                        return (
                          <div key={option.id} className={optionClass}>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {isCorrect && <CheckCircle size={16} className="text-green-600" />}
                                {isSelected && !isCorrect && <XCircle size={16} className="text-red-600" />}
                              </div>
                              <span className="flex-1">{option.option_text}</span>
                              <div className="flex gap-2">
                                {isSelected && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                    Your Answer
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {showExplanations && question.explanation && (
                      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Explanation:</h4>
                        <p className="text-blue-700">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Link to={getBackLink()} className="btn btn-primary">
            {getBackText()}
          </Link>
          
          {/* Only show retake button for students */}
          {canRetakeQuiz() && (
            <Link 
              to={`/student/${user.id}/quiz/${attempt.category_id}/${attempt.difficulty_id}`} 
              className="btn btn-outline"
            >
              Retake Quiz
            </Link>
          )}

          {/* Add feedback button for tutors */}
          {user && ['tutor', 'super_tutor'].includes(user.role) && (
            <button
              onClick={() => navigate(`/feedback?attempt_id=${attemptId}`)}
              className="btn btn-secondary"
            >
              Add Feedback
            </button>
          )}
        </div>

        {/* Performance Tips - Show different tips based on user role */}
        <div className="card mt-8">
          <div className="card-header">
            <h3 className="card-title">
              {user && ['tutor', 'super_tutor'].includes(user.role) ? 'Teaching Notes' : 'Study Tips'}
            </h3>
          </div>
          <div className="card-body">
            {user && ['tutor', 'super_tutor'].includes(user.role) ? (
              // Tips for tutors
              <div className="text-blue-700">
                <p className="mb-2">📊 Student Performance Analysis:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Score: {scorePercentage}% ({correctAnswers}/{totalQuestions} correct)</li>
                  <li>Time taken: {attempt.time_taken ? Math.round(attempt.time_taken / 60) : 'N/A'} minutes</li>
                  <li>Category: {attempt.category_name}</li>
                  <li>Difficulty: {attempt.difficulty_name}</li>
                  {scorePercentage < 60 && <li className="text-red-600">⚠️ Student may need additional support in this area</li>}
                  {scorePercentage >= 80 && <li className="text-green-600">✅ Student shows strong understanding</li>}
                </ul>
              </div>
            ) : (
              // Tips for students
              <>
                {scorePercentage >= 80 ? (
                  <div className="text-green-700">
                    <p className="mb-2">🎉 Excellent performance! You've mastered this topic.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Consider trying a higher difficulty level</li>
                      <li>Help other students with this topic</li>
                      <li>Move on to related advanced topics</li>
                    </ul>
                  </div>
                ) : scorePercentage >= 60 ? (
                  <div className="text-yellow-700">
                    <p className="mb-2">👍 Good effort! You're on the right track.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Review the questions you got wrong</li>
                      <li>Practice similar questions</li>
                      <li>Ask your tutor for additional resources</li>
                    </ul>
                  </div>
                ) : (
                  <div className="text-red-700">
                    <p className="mb-2">📚 Keep studying! You can improve with practice.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Review the fundamental concepts</li>
                      <li>Practice with easier questions first</li>
                      <li>Seek help from your tutor</li>
                      <li>Take your time to understand each topic</li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quiz Metadata (for tutors) */}
        {user && ['tutor', 'super_tutor'].includes(user.role) && (
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="card-title">Quiz Details</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Started:</strong> {new Date(attempt.started_at).toLocaleString()}
                </div>
                <div>
                  <strong>Completed:</strong> {new Date(attempt.completed_at).toLocaleString()}
                </div>
                <div>
                  <strong>Category:</strong> {attempt.category_name}
                </div>
                <div>
                  <strong>Difficulty:</strong> {attempt.difficulty_name}
                </div>
                <div>
                  <strong>Total Questions:</strong> {totalQuestions}
                </div>
                <div>
                  <strong>Time Taken:</strong> {attempt.time_taken ? Math.round(attempt.time_taken / 60) : 'N/A'} minutes
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResults;