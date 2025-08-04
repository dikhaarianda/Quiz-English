import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService, categoriesService } from '../services/supabaseService.js';
import { toast } from 'react-toastify';
import Loading from '../components/Loading.jsx';
import { Clock, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const QuizTaking = () => {
  const { studentId, categoryId, difficultyId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);

  useEffect(() => {
    startQuiz();
  }, [categoryId, difficultyId]);

  useEffect(() => {
    let timer;
    if (quizStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining]);

  const startQuiz = async () => {
    try {
      console.log('Starting quiz with params:', { categoryId, difficultyId });
      
      const response = await quizService.startQuiz({
        category_id: parseInt(categoryId),
        difficulty_id: parseInt(difficultyId),
        question_count: 10 // Default to 10 questions
      });

      console.log('Quiz start response:', response);

      if (!response.success) {
        toast.error(response.error || 'Failed to start quiz');
        navigate(`/student/${studentId}`);
        return;
      }

      const { attempt_id, questions, total_questions } = response.data;
      
      if (!questions || questions.length === 0) {
        toast.error('No questions available for this quiz');
        navigate(`/student/${studentId}`);
        return;
      }

      // Get category and difficulty names for display
      const [categoriesRes, difficultiesRes] = await Promise.allSettled([
        categoriesService.getCategories(),
        categoriesService.getDifficultyLevels()
      ]);

      let categoryName = 'Unknown Category';
      let difficultyName = 'Unknown Difficulty';

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success) {
        const category = categoriesRes.value.data.find(c => c.id === parseInt(categoryId));
        categoryName = category?.name || categoryName;
      }

      if (difficultiesRes.status === 'fulfilled' && difficultiesRes.value.success) {
        const difficulty = difficultiesRes.value.data.find(d => d.id === parseInt(difficultyId));
        difficultyName = difficulty?.name || difficultyName;
      }

      setQuiz({
        questions: questions,
        categoryName: categoryName,
        difficultyName: difficultyName,
        totalQuestions: total_questions
      });
      
      setAttemptId(attempt_id);
      setTimeRemaining(1800); // 30 minutes default
      setQuizStarted(true);
      
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz');
      navigate(`/student/${studentId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length === 0) {
      toast.error('Please answer at least one question before submitting');
      return;
    }

    if (!window.confirm('Are you sure you want to submit your quiz? This action cannot be undone.')) {
      return;
    }

    try {
      // Convert answers object to array format expected by backend
      const answersArray = Object.entries(answers).map(([questionId, optionId]) => ({
        question_id: parseInt(questionId),
        selected_option_id: parseInt(optionId)
      }));

      console.log('Submitting quiz with data:', { attemptId, answersArray });

      const response = await quizService.submitQuiz({
        attempt_id: attemptId,
        answers: answersArray
      });

      if (!response.success) {
        toast.error(response.error || 'Failed to submit quiz');
        return;
      }
      
      toast.success('Quiz submitted successfully!');
      navigate(`/student/${studentId}/quiz-results/${attemptId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) return <Loading message="Starting your quiz..." />;

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="card">
            <div className="card-body text-center">
              <h2 className="text-2xl font-bold mb-4 text-red-600">No Questions Available</h2>
              <p className="text-gray-600 mb-6">
                There are no questions available for this category and difficulty level.
              </p>
              <button
                onClick={() => navigate(`/student/${studentId}`)}
                className="btn btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <div className="container">
      <div className="main-content">
        {/* Quiz Header */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold">{quiz.categoryName} Quiz</h1>
                <p className="text-gray-600">{quiz.difficultyName} Level</p>
              </div>
              
              {/* Timer */}
              <div className="quiz-timer">
                <div className="flex items-center gap-2">
                  <Clock size={20} className={timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'} />
                  <span className={`font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                {timeRemaining < 300 && (
                  <p className="text-xs text-red-600 mt-1">Time running out!</p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-sm text-gray-600">
                  {getAnsweredCount()} answered
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Question Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[quiz.questions[index].id]
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Question */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Question {currentQuestionIndex + 1}: {currentQuestion.question_text}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options && currentQuestion.options.map(option => {
                const isSelected = answers[currentQuestion.id] === option.id;
                
                return (
                  <div
                    key={option.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-600' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="flex-1 text-gray-800">{option.option_text}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handlePreviousQuestion}
                disabled={isFirstQuestion}
                className={`btn flex items-center gap-2 ${
                  isFirstQuestion ? 'btn-disabled' : 'btn-outline'
                }`}
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              <div className="flex gap-3">
                {!isLastQuestion ? (
                  <button
                    onClick={handleNextQuestion}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    className="btn btn-success flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Submit Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Summary */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold mb-4">Quiz Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{quiz.questions.length}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{getAnsweredCount()}</div>
                <div className="text-sm text-gray-600">Answered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {quiz.questions.length - getAnsweredCount()}
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{formatTime(timeRemaining)}</div>
                <div className="text-sm text-gray-600">Time Left</div>
              </div>
            </div>

            {getAnsweredCount() < quiz.questions.length && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    You have {quiz.questions.length - getAnsweredCount()} unanswered questions.
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={handleSubmitQuiz}
                className="btn btn-success w-full flex items-center justify-center gap-2"
                disabled={getAnsweredCount() === 0}
              >
                <CheckCircle size={16} />
                Submit Quiz ({getAnsweredCount()}/{quiz.questions.length} answered)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;