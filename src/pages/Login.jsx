import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '', // Can be username or email
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('username'); // 'username' or 'email'

  const { login, loginWithUsername } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      // Determine if input is email or username
      const isEmail = formData.identifier.includes('@');
      
      if (isEmail) {
        // Login with email
        result = await login(formData.identifier, formData.password);
      } else {
        // Login with username
        result = await loginWithUsername(formData.identifier, formData.password);
      }

      if (result.success) {
        // Small delay to ensure auth state is updated
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">
            <LogIn size={32} />
            Welcome Back
          </h1>
          <p className="auth-subtitle">Sign in to your English Quiz account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="identifier" className="form-label">
              Username or Email
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter your username or email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-sm"></div>
                Signing In...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up here
            </Link>
          </p>
        </div>

        <div className="demo-accounts">
          <h3>Demo Accounts</h3>
          <div className="demo-grid">
            <div className="demo-account">
              <strong>Super Tutor</strong>
              <p>Username: admin</p>
              <p>Email: admin@englishquiz.com</p>
              <p>Password: admin123</p>
            </div>
            <div className="demo-account">
              <strong>Tutor</strong>
              <p>Username: tutor1</p>
              <p>Email: tutor1@englishquiz.com</p>
              <p>Password: password123</p>
            </div>
            <div className="demo-account">
              <strong>Student</strong>
              <p>Username: student1</p>
              <p>Email: student1@englishquiz.com</p>
              <p>Password: password123</p>
            </div>
            <div className="demo-account">
              <strong>Petunjuk Penggunaan</strong>
              <p>Pelajari cara menggunakan platform ini</p>
              <button
                type="button"
                onClick={() => window.open('/user-guide.html', '_blank')}
                className="btn btn-sm btn-outline mt-2"
                style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
              >
                Buka Panduan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
