import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { toast } from 'react-toastify';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session with better error handling
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user && mounted) {
          await loadUserProfile(session.user);
        } else if (mounted) {
          setUser(null);
        }

        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        try {
          if (session?.user) {
            await loadUserProfile(session.user);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setUser(null);
        }

        if (initialized) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  const loadUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // If profile doesn't exist, use auth user data
        setUser({
          id: authUser.id,
          email: authUser.email,
          ...authUser.user_metadata
        });
        return;
      }

      setUser({
        ...authUser,
        ...profile
      });
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      // Fallback to auth user data
      setUser({
        id: authUser.id,
        email: authUser.email,
        ...authUser.user_metadata
      });
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role || 'student'
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Registration successful! Please check your email to confirm your account.');
        return { success: true, needsConfirmation: true };
      }

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success('Login successful!');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithUsername = async (username, password) => {
    try {
      setLoading(true);
      
      // First, get the email associated with the username using our database function
      const { data, error } = await supabase.rpc('get_email_from_username', {
        p_username: username
      });

      if (error || !data?.success) {
        const errorMessage = data?.error || error?.message || 'Username not found';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Now login with the retrieved email
      const email = data.data?.email;
      if (!email) {
        toast.error('Username not found');
        return { success: false, error: 'Username not found' };
      }

      return await login(email, password);
    } catch (error) {
      console.error('Username login error:', error);
      toast.error('Login failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed');
        return { success: false, error: error.message };
      }

      setUser(null);
      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('No user logged in');
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        toast.error('Failed to update profile');
        return { success: false, error: error.message };
      }

      setUser(prev => ({ ...prev, ...data }));
      toast.success('Profile updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success('Password reset email sent!');
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send password reset email');
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success('Password updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      toast.error('Failed to update password');
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    initialized,
    register,
    login,
    loginWithUsername,
    logout,
    updateProfile,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;