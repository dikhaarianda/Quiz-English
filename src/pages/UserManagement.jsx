import React, { useState, useEffect } from 'react';
import { usersService } from '../services/supabaseService.js';
import { toast } from 'react-toastify';
import Loading from '../components/Loading.jsx';
import { Plus, Edit, Trash2, Search, Users, UserPlus, Save, X, Eye, EyeOff } from 'lucide-react';

const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    role: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async (page = 1) => {
    try {
      const result = await usersService.getUsers({
        page,
        limit: 10,
        ...filters
      });

      if (result.success) {
        setUsers(result.data.users);
        setPagination(result.data.pagination);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
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
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'student',
      isActive: true
    });
    setEditingUser(null);
  };

  const handleCreateUser = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't populate password for editing
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active
    });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      const result = await usersService.deactivateUser(userId);
      if (result.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return false;
    }

    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }

    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const submitData = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        isActive: formData.isActive
      };

      // Only include password if it's provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      let result;
      if (editingUser) {
        result = await usersService.updateUser(editingUser.id, submitData);
      } else {
        result = await usersService.createUser(submitData);
      }

      if (result.success) {
        setShowModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'super_tutor': return 'badge-info';
      case 'tutor': return 'badge-warning';
      case 'student': return 'badge-success';
      default: return 'badge-info';
    }
  };

  if (loading) return <Loading message="Loading users..." />;

  return (
    <div className="container">
      <div className="main-content">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <button onClick={handleCreateUser} className="btn btn-primary">
            <Plus size={16} />
            Add User
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
                    placeholder="Search users..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="form-control form-select"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="tutor">Tutors</option>
                  <option value="super_tutor">Super Tutors</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <button
                  onClick={() => setFilters({ role: 'all', search: '' })}
                  className="btn btn-outline w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="card">
          <div className="card-body">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Users Found</h3>
                <p className="text-gray-500 mb-4">
                  {Object.values(filters).some(f => f && f !== 'all') 
                    ? 'Try adjusting your filters or create a new user.'
                    : 'Get started by creating your first user.'
                  }
                </p>
                <button onClick={handleCreateUser} className="btn btn-primary">
                  <Plus size={16} />
                  Add User
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Joined</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <h4 className="font-semibold">
                              {user.first_name} {user.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              @{user.username} • {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {user.is_active ? (
                              <Eye size={16} className="text-green-600" />
                            ) : (
                              <EyeOff size={16} className="text-red-600" />
                            )}
                            <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="btn btn-sm btn-outline"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="btn btn-sm btn-danger"
                              disabled={!user.is_active}
                            >
                              <Trash2 size={14} />
                              Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => fetchUsers(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="btn btn-outline"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchUsers(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="btn btn-outline"
            >
              Next
            </button>
          </div>
        )}

        {/* User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingUser ? 'Edit User' : 'Create New User'}
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
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleFormChange}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleFormChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleFormChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Password {editingUser ? '(leave blank to keep current)' : '*'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      className="form-control"
                      required={!editingUser}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      className="form-control form-select"
                      required
                    >
                      <option value="student">Student</option>
                      <option value="tutor">Tutor</option>
                      {/* <option value="super_tutor">Super Tutor</option> */}
                    </select>
                  </div>

                  {editingUser && (
                    <div className="form-group">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleFormChange}
                        />
                        <span className="form-label mb-0">Active User</span>
                      </label>
                    </div>
                  )}

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
                      {editingUser ? 'Update User' : 'Create User'}
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

export default UserManagement;