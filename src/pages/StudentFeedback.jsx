import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { feedbackService, quizService } from '../services/supabaseService.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-toastify';
import Loading from '../components/Loading.jsx';
import { MessageSquare, Send, Star, ArrowLeft, Edit } from 'lucide-react';

const StudentFeedback = () => {
  const { studentId, attemptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    feedback_text: '',
    rating: 0,
    tutor_id: null
  });

  useEffect(() => {
    if (attemptId) {
      fetchQuizAttempt();
    } else {
      setLoading(false);
    }
  }, [attemptId]);

  const fetchQuizAttempt = async () => {
    try {
      const [quizResponse, feedbackResponse] = await Promise.allSettled([
        quizService.getQuizResults({ student_id: user?.id }),
        feedbackService.getStudentFeedbackByAttempt(parseInt(attemptId))
      ]);
      
      // Handle quiz attempt data
      if (quizResponse.status === 'fulfilled' && quizResponse.value.success && quizResponse.value.data) {
        const attempt = quizResponse.value.data.find(a => a.id === parseInt(attemptId));
        if (attempt) {
          setQuizAttempt(attempt);
          // Set tutor_id if available from quiz attempt data
          if (attempt.tutor_id) {
            setFormData(prev => ({
              ...prev,
              tutor_id: attempt.tutor_id
            }));
          }
        } else {
          toast.error('Quiz attempt not found');
          navigate(-1);
          return;
        }
      } else {
        toast.error('Failed to load quiz details');
        navigate(-1);
        return;
      }

      // Handle existing feedback data
      if (feedbackResponse.status === 'fulfilled' && feedbackResponse.value.success && feedbackResponse.value.data) {
        const feedback = feedbackResponse.value.data;
        setExistingFeedback(feedback);
        setFormData({
          feedback_text: feedback.feedback_text || '',
          rating: feedback.rating || 0,
          tutor_id: feedback.tutor_id || null
        });
        setIsEditing(false); // Start in view mode if feedback exists
      } else {
        // No existing feedback, start in edit mode
        setExistingFeedback(null);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error fetching quiz attempt:', error);
      toast.error('Failed to load quiz details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const validateForm = () => {
    if (!formData.feedback_text.trim()) {
      toast.error('Please provide your feedback');
      return false;
    }

    if (formData.rating === 0) {
      toast.error('Please provide a rating');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = {
        attempt_id: attemptId ? parseInt(attemptId) : null,
        tutor_id: formData.tutor_id,
        feedback_text: formData.feedback_text,
        rating: formData.rating
      };

      let response;
      if (existingFeedback) {
        // Update existing feedback
        response = await feedbackService.updateStudentFeedback(existingFeedback.id, submitData);
      } else {
        // Create new feedback
        response = await feedbackService.createStudentFeedback(submitData);
      }
      
      if (response.success) {
        toast.success(existingFeedback ? 'Feedback updated successfully!' : 'Feedback submitted successfully!');
        if (existingFeedback) {
          // Update local state and exit edit mode
          setExistingFeedback({ ...existingFeedback, ...submitData, updated_at: new Date().toISOString() });
          setIsEditing(false);
        } else {
          navigate(-1);
        }
      } else {
        toast.error(response.error || `Failed to ${existingFeedback ? 'update' : 'submit'} feedback`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(`Failed to ${existingFeedback ? 'update' : 'submit'} feedback`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading feedback form..." />;

  const currentStudentId = studentId || user?.id;

  return (
    <div className="container">
      <div className="main-content">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold">Give Feedback</h1>
            <p className="text-gray-600">Share your experience and help improve the learning process</p>
          </div>
        </div>

        {/* Quiz Information */}
        {quizAttempt && (
          <div className="card mb-6">
            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4">Quiz Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-semibold">{quizAttempt.categories?.name || quizAttempt.category_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className="font-semibold">{quizAttempt.difficulty_levels?.name || quizAttempt.difficulty_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Score</p>
                  <p className={`font-semibold text-lg ${
                    quizAttempt.score >= 80 ? 'text-green-600' :
                    quizAttempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {quizAttempt.score}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        <div className="card">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {existingFeedback ? 'Your Feedback' : 'Give Feedback'}
              </h2>
              {existingFeedback && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline btn-sm"
                >
                  <Edit size={16} />
                  Edit Feedback
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Rating */}
              <div className="form-group">
                <label className="form-label">Rating *</label>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => isEditing ? handleRatingChange(star) : null}
                      disabled={!isEditing}
                      className={`p-1 rounded transition-colors ${
                        !isEditing ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        star <= formData.rating
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Star
                        size={24}
                        fill={star <= formData.rating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {formData.rating > 0 && (
                      <>
                        {formData.rating} out of 5 stars
                        {formData.rating === 1 && ' - Poor'}
                        {formData.rating === 2 && ' - Fair'}
                        {formData.rating === 3 && ' - Good'}
                        {formData.rating === 4 && ' - Very Good'}
                        {formData.rating === 5 && ' - Excellent'}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Feedback Text */}
              <div className="form-group">
                <label className="form-label">Your Feedback *</label>
                <textarea
                  name="feedback_text"
                  value={formData.feedback_text}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`form-control ${!isEditing ? 'bg-gray-50 cursor-default' : ''}`}
                  rows="6"
                  placeholder="Share your thoughts about the quiz, teaching methods, or suggestions for improvement..."
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Your feedback helps tutors improve their teaching methods and create better learning experiences.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing && existingFeedback) {
                      // Cancel editing, restore original data
                      setFormData({
                        feedback_text: existingFeedback.feedback_text || '',
                        rating: existingFeedback.rating || 0,
                        tutor_id: existingFeedback.tutor_id || null
                      });
                      setIsEditing(false);
                    } else {
                      navigate(-1);
                    }
                  }}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  {isEditing && existingFeedback ? 'Cancel' : 'Back'}
                </button>
                
                {isEditing && (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Existing Feedback Info */}
            {existingFeedback && !isEditing && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ You have already submitted feedback for this quiz on {new Date(existingFeedback.created_at).toLocaleDateString()}. 
                  You can edit your feedback using the "Edit Feedback" button above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <div className="card mt-6">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquare size={20} />
              Feedback Guidelines
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Be specific about what worked well and what could be improved</p>
              <p>• Provide constructive suggestions for better learning experiences</p>
              <p>• Mention any technical issues you encountered during the quiz</p>
              <p>• Share your thoughts on question difficulty and clarity</p>
              <p>• Your feedback is anonymous and helps improve the overall learning platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFeedback;
