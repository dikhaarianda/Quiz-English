import React, { useState, useEffect } from 'react';
import { feedbackService, usersService } from '../services/supabaseService.js';
import { toast } from 'react-toastify';
import Loading from '../components/Loading.jsx';
import { MessageSquare, Plus, Edit, Trash2, Search, Send, X, Save, Star } from 'lucide-react';

const FeedbackManagement = () => {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({
    student_id: '',
    search: ''
  });
  const [pagination, setPagination] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    feedback_text: '',
    recommendations: '',
    attempt_id: '',
    rating: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const studentsRes = await usersService.getStudents();

      if (studentsRes.success) {
        setStudents(studentsRes.data?.users || []);
      } else {
        toast.error('Failed to load students');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
      setStudents([]);
    }
  };

  const fetchFeedback = async (page = 1) => {
    try {
      const queryParams = {
        page: page,
        limit: 10,
        ...filters
      };

      const response = await feedbackService.getTutorFeedback(queryParams);
      
      if (!response.success) {
        toast.error(response.error || 'Failed to load feedback');
        setFeedback([]);
        setPagination({});
        return;
      }
      
      const responseData = response.data || {};
      setFeedback(responseData.feedback || responseData || []);
      setPagination(responseData.pagination || {});
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
      setFeedback([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      feedback_text: '',
      recommendations: '',
      attempt_id: '',
      rating: 0
    });
    setEditingFeedback(null);
  };

  const handleCreateFeedback = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditFeedback = (feedbackItem) => {
    setFormData({
      student_id: feedbackItem.student_id,
      feedback_text: feedbackItem.feedback_text,
      recommendations: feedbackItem.recommendations || '',
      attempt_id: feedbackItem.attempt_id || '',
      rating: feedbackItem.rating || 0
    });
    setEditingFeedback(feedbackItem);
    setShowModal(true);
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const response = await feedbackService.deleteFeedback(feedbackId);
      
      if (!response.success) {
        toast.error(response.error || 'Failed to delete feedback');
        return;
      }
      
      toast.success('Feedback deleted successfully');
      fetchFeedback();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  const handleFormChange = (e) => {
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
    if (!formData.student_id) {
      toast.error('Please select a student');
      return false;
    }

    if (!formData.feedback_text.trim()) {
      toast.error('Feedback text is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        student_id: parseInt(formData.student_id),
        feedback_text: formData.feedback_text,
        recommendations: formData.recommendations || null,
        attempt_id: formData.attempt_id ? parseInt(formData.attempt_id) : null,
        rating: formData.rating > 0 ? formData.rating : null
      };

      let response;
      if (editingFeedback) {
        response = await feedbackService.updateFeedback(editingFeedback.id, submitData);
        if (response.success) {
          toast.success('Feedback updated successfully');
        } else {
          toast.error(response.error || 'Failed to update feedback');
          return;
        }
      } else {
        response = await feedbackService.createFeedback(submitData);
        if (response.success) {
          toast.success('Feedback created successfully');
        } else {
          toast.error(response.error || 'Failed to create feedback');
          return;
        }
      }
      
      setShowModal(false);
      resetForm();
      fetchFeedback();
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
    }
  };

  if (loading) return <Loading message="Loading feedback..." />;

  return (
    <div className="container">
      <div className="main-content">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Feedback Management</h1>
          <button onClick={handleCreateFeedback} className="btn btn-primary">
            <Plus size={16} />
            Give Feedback
          </button>
        </div>


        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Search</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="form-control pl-10"
                    placeholder="Search feedback..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Student</label>
                <select
                  name="student_id"
                  value={filters.student_id}
                  onChange={handleFilterChange}
                  className="form-control form-select"
                >
                  <option value="">All Students</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <button
                  onClick={() => setFilters({ student_id: '', search: '' })}
                  className="btn btn-outline w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Feedback Found</h3>
                <p className="text-gray-500 mb-4">
                  {Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters or create new feedback.'
                    : 'Start providing feedback to help your students improve.'
                  }
                </p>
                <button onClick={handleCreateFeedback} className="btn btn-primary">
                  <Plus size={16} />
                  Give Feedback
                </button>
              </div>
            </div>
          ) : (
            feedback.map(item => (
              <div key={item.id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-lg">
                          To: {item.student?.first_name} {item.student?.last_name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {item.quiz_attempts && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="badge badge-info">
                            {item.quiz_attempts.categories?.name}
                          </span>
                          <span className="badge badge-warning">
                            {item.quiz_attempts.difficulty_levels?.name}
                          </span>
                          {item.quiz_attempts.score !== null && (
                            <span className={`badge ${
                              item.quiz_attempts.score >= 80 ? 'badge-success' : 
                              item.quiz_attempts.score >= 60 ? 'badge-warning' : 'badge-error'
                            }`}>
                              Score: {item.quiz_attempts.score}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      {item.rating && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-gray-600">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= item.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">
                              ({item.rating}/5)
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-blue-50 p-4 rounded-lg mb-3">
                        <h4 className="font-medium text-blue-800 mb-2">Feedback:</h4>
                        <p className="text-blue-700">{item.feedback_text}</p>
                      </div>
                      
                      {item.recommendations && (
                        <div className="bg-green-50 p-4 rounded-lg mb-3">
                          <h4 className="font-medium text-green-800 mb-2">Recommendations:</h4>
                          <p className="text-green-700">{item.recommendations}</p>
                        </div>
                      )}
                      
                      {item.student_feedback && (
                        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                          <h4 className="font-medium text-purple-800 mb-2">Feedback from Student:</h4>
                          <p className="text-purple-700 mb-2">{item.student_feedback.feedback_text}</p>
                          {item.student_feedback.rating && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-purple-600">Student Rating:</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={14}
                                    className={star <= item.student_feedback.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                                  />
                                ))}
                                <span className="text-sm text-purple-600 ml-1">
                                  ({item.student_feedback.rating}/5)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditFeedback(item)}
                        className="btn btn-sm btn-outline"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFeedback(item.id)}
                        className="btn btn-sm btn-danger"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => fetchFeedback(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="btn btn-outline"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchFeedback(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="btn btn-outline"
            >
              Next
            </button>
          </div>
        )}

        {/* Feedback Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingFeedback ? 'Edit Feedback' : 'Give Feedback'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Student *</label>
                    <select
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleFormChange}
                      className="form-control form-select"
                      required
                      disabled={editingFeedback} // Don't allow changing student when editing
                    >
                      <option value="">Select Student</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.first_name} {student.last_name} (@{student.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quiz Attempt ID (Optional)</label>
                    <input
                      type="number"
                      name="attempt_id"
                      value={formData.attempt_id}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter quiz attempt ID if this feedback is for a specific quiz"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Leave blank for general feedback not tied to a specific quiz
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Feedback *</label>
                    <textarea
                      name="feedback_text"
                      value={formData.feedback_text}
                      onChange={handleFormChange}
                      className="form-control"
                      rows="4"
                      placeholder="Provide detailed feedback to help the student improve..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rating (Optional)</label>
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(star)}
                          className={`p-1 rounded transition-colors ${
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

                  <div className="form-group">
                    <label className="form-label">Recommendations (Optional)</label>
                    <textarea
                      name="recommendations"
                      value={formData.recommendations}
                      onChange={handleFormChange}
                      className="form-control"
                      rows="3"
                      placeholder="Suggest specific actions, resources, or study methods..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Send size={16} />
                      {editingFeedback ? 'Update Feedback' : 'Send Feedback'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;
