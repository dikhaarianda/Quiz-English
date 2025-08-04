import React, { useState, useEffect } from 'react';
import { questionsService, categoriesService } from '../services/supabaseService.js';
import { toast } from 'react-toastify';
import Loading from '../components/Loading.jsx';
import { Plus, Edit, Trash2, Search, BookOpen, Save, X } from 'lucide-react';

const QuestionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [filters, setFilters] = useState({
    category_id: '',
    difficulty_id: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    difficulty_id: '',
    question_text: '',
    explanation: '',
    options: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, difficultyRes] = await Promise.all([
        categoriesService.getCategories(),
        categoriesService.getDifficultyLevels()
      ]);
      
      // Add safety checks for response data
      const categoriesData = categoriesRes.success ? categoriesRes.data : [];
      const difficultyData = difficultyRes.success ? difficultyRes.data : [];
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setDifficultyLevels(Array.isArray(difficultyData) ? difficultyData : []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load categories and difficulty levels');
      // Set empty arrays as fallback
      setCategories([]);
      setDifficultyLevels([]);
    }
  };

  const fetchQuestions = async (page = 1) => {
    try {
      const queryParams = {
        page: page,
        limit: 10,
        ...filters
      };

      const response = await questionsService.getQuestions(queryParams);
      
      if (!response.success) {
        toast.error(response.error || 'Failed to load questions');
        setQuestions([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        });
        return;
      }
      
      // Add safety checks for response data
      const responseData = response.data || {};
      const questionsData = responseData.questions || responseData || [];
      const paginationData = responseData.pagination || {};
      
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
      setPagination({
        currentPage: paginationData.currentPage || page,
        totalPages: paginationData.totalPages || 1,
        totalCount: paginationData.totalCount || questionsData.length,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
      // Set empty data as fallback
      setQuestions([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false
      });
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
      category_id: '',
      difficulty_id: '',
      question_text: '',
      explanation: '',
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    });
    setEditingQuestion(null);
  };

  const handleCreateQuestion = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditQuestion = (question) => {
    // Add safety checks for question data
    const questionOptions = question.options || [];
    const normalizedOptions = [];
    
    // Ensure we have exactly 4 options
    for (let i = 0; i < 4; i++) {
      if (questionOptions[i]) {
        normalizedOptions.push({
          text: questionOptions[i].option_text || '',
          is_correct: questionOptions[i].is_correct || false
        });
      } else {
        normalizedOptions.push({
          text: '',
          is_correct: false
        });
      }
    }

    setFormData({
      category_id: question.category_id || '',
      difficulty_id: question.difficulty_id || '',
      question_text: question.question_text || '',
      explanation: question.explanation || '',
      options: normalizedOptions
    });
    setEditingQuestion(question);
    setShowModal(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await questionsService.deleteQuestion(questionId);
      
      if (!response.success) {
        toast.error(response.error || 'Failed to delete question');
        return;
      }
      
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => ({
        ...option,
        is_correct: i === index
      }))
    }));
  };

  const validateForm = () => {
    if (!formData.category_id) {
      toast.error('Please select a category');
      return false;
    }

    if (!formData.difficulty_id) {
      toast.error('Please select a difficulty level');
      return false;
    }

    if (!formData.question_text.trim()) {
      toast.error('Question text is required');
      return false;
    }

    const hasEmptyOption = formData.options.some(opt => !opt.text.trim());
    if (hasEmptyOption) {
      toast.error('All answer options must be filled');
      return false;
    }

    const hasCorrectAnswer = formData.options.some(opt => opt.is_correct);
    if (!hasCorrectAnswer) {
      toast.error('Please select the correct answer');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        category_id: parseInt(formData.category_id),
        difficulty_id: parseInt(formData.difficulty_id),
        question_text: formData.question_text,
        explanation: formData.explanation || null,
        options: formData.options.map(option => ({
          option_text: option.text,
          is_correct: option.is_correct
        }))
      };

      let response;
      if (editingQuestion) {
        response = await questionsService.updateQuestion(editingQuestion.id, submitData);
        if (response.success) {
          toast.success('Question updated successfully');
        } else {
          toast.error(response.error || 'Failed to update question');
          return;
        }
      } else {
        response = await questionsService.createQuestion(submitData);
        if (response.success) {
          toast.success('Question created successfully');
        } else {
          toast.error(response.error || 'Failed to create question');
          return;
        }
      }
      
      setShowModal(false);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  if (loading) return <Loading message="Loading questions..." />;

  return (
    <div className="container">
      <div className="main-content">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Question Management</h1>
          <button onClick={handleCreateQuestion} className="btn btn-primary">
            <Plus size={16} />
            Add Question
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    placeholder="Search questions..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  name="category_id"
                  value={filters.category_id}
                  onChange={handleFilterChange}
                  className="form-control form-select"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select
                  name="difficulty_id"
                  value={filters.difficulty_id}
                  onChange={handleFilterChange}
                  className="form-control form-select"
                >
                  <option value="">All Levels</option>
                  {difficultyLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <button
                  onClick={() => setFilters({ category_id: '', difficulty_id: '', search: '' })}
                  className="btn btn-outline w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <BookOpen size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Found</h3>
                <p className="text-gray-500 mb-4">
                  {Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters or create a new question.'
                    : 'Get started by creating your first question.'
                  }
                </p>
                <button onClick={handleCreateQuestion} className="btn btn-primary">
                  <Plus size={16} />
                  Add Question
                </button>
              </div>
            </div>
          ) : (
            questions.map(question => {
              // Add safety checks for question data
              const questionOptions = question.options || [];
              const categoryName = question.categories?.name || question.category_name || 'Unknown Category';
              const difficultyName = question.difficulty_levels?.name || question.difficulty_name || 'Unknown Difficulty';
              const creatorName = question.users ? 
                `${question.users.first_name || ''} ${question.users.last_name || ''}`.trim() || 'Unknown' :
                question.creator_name || 'Unknown';

              return (
                <div key={question.id} className="card">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="badge badge-info">
                            {categoryName}
                          </span>
                          <span className="badge badge-warning">
                            {difficultyName}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold mb-3">
                          {question.question_text}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          {questionOptions.map((option, index) => (
                            <div 
                              key={option.id || index} 
                              className={`p-2 rounded border text-sm ${
                                option.is_correct 
                                  ? 'border-green-500 bg-green-50 text-green-800' 
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {option.is_correct && (
                                  <span className="text-green-600 font-bold">✓</span>
                                )}
                                <span>{String.fromCharCode(65 + index)}. {option.option_text}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {question.explanation && (
                          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                            <p className="text-sm text-blue-700">
                              <strong>Explanation:</strong> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="btn btn-sm btn-outline"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="btn btn-sm btn-danger"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 border-t pt-2">
                      Created by {creatorName} on {new Date(question.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => fetchQuestions(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="btn btn-outline"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchQuestions(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="btn btn-outline"
            >
              Next
            </button>
          </div>
        )}

        {/* Question Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingQuestion ? 'Edit Question' : 'Create New Question'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleFormChange}
                        className="form-control form-select"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Difficulty *</label>
                      <select
                        name="difficulty_id"
                        value={formData.difficulty_id}
                        onChange={handleFormChange}
                        className="form-control form-select"
                        required
                      >
                        <option value="">Select Difficulty</option>
                        {difficultyLevels.map(level => (
                          <option key={level.id} value={level.id}>
                            {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Question Text *</label>
                    <textarea
                      name="question_text"
                      value={formData.question_text}
                      onChange={handleFormChange}
                      className="form-control"
                      rows="3"
                      placeholder="Enter your question here..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Answer Options *</label>
                    <p className="text-sm text-gray-600 mb-3">
                      Enter four answer options and select the correct one:
                    </p>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3 mb-2">
                        <input
                          type="radio"
                          name="correct_answer"
                          checked={option.is_correct}
                          onChange={() => handleCorrectAnswerChange(index)}
                          className="w-4 h-4"
                        />
                        <span className="w-6 text-sm font-medium">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          className="form-control flex-1"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Explanation (Optional)</label>
                    <textarea
                      name="explanation"
                      value={formData.explanation}
                      onChange={handleFormChange}
                      className="form-control"
                      rows="2"
                      placeholder="Explain why this is the correct answer..."
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
                      <Save size={16} />
                      {editingQuestion ? 'Update Question' : 'Create Question'}
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

export default QuestionManagement;