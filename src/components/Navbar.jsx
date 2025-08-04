import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LogOut, User, BookOpen, Users, Settings, BarChart3 } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];

    const baseLinks = [];

    switch (user.role) {
      case 'student':
        baseLinks.push(
          { to: '/student', label: 'Dashboard', icon: BarChart3 },
        );
        break;
      
      case 'tutor':
        baseLinks.push(
          { to: '/tutor', label: 'Dashboard', icon: BarChart3 },
          { to: '/questions', label: 'Questions', icon: BookOpen },
          { to: '/feedback', label: 'Feedback', icon: User },
        );
        break;
      
      case 'super_tutor':
        baseLinks.push(
          { to: '/admin', label: 'Dashboard', icon: BarChart3 },
          { to: '/questions', label: 'Questions', icon: BookOpen },
          { to: '/users', label: 'Users', icon: Users },
          { to: '/feedback', label: 'Feedback', icon: User },
        );
        break;
      
      default:
        break;
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            📚 English Quiz
          </Link>
          
          {user ? (
            <>
              <ul className="navbar-nav">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <li key={link.to}>
                      <Link to={link.to} className="flex items-center gap-2">
                        <IconComponent size={18} />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              
              <div className="user-info">
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <span>{user.firstName} {user.lastName}</span>
                </div>
                <span className="user-role">{user.role.replace('_', ' ')}</span>
                <button 
                  onClick={handleLogout}
                  className="btn btn-sm btn-outline flex items-center gap-2"
                  style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <ul className="navbar-nav">
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
