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

  // Load user profile helper function
  const loadUserProfile = async (authUser) => {
    try {
      console.log('Loading profile for user:', authUser.id);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading user profile:', error);
      }

      // Merge auth user with profile data (or use auth data if no profile)
      const userData = {
        ...authUser,
        ...(profile || {}),
        // Ensure we always have basic auth data
        id: authUser.id,
        email: authUser.email,
      };
      
      console.log('User profile loaded successfully');
      return userData;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      // Fallback to auth user data
      return {
        id: authUser.id,
        email: authUser.email,
        ...authUser.user_metadata
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session and set up listener
    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        }

        // Set initial user state
        if (session?.user && mounted) {
          const userData = await loadUserProfile(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (!mounted) return;

            if (event === 'SIGNED_OUT' || !session?.user) {
              setUser(null);
            } else if (session?.user) {
              const userData = await loadUserProfile(session.user);
              setUser(userData);
            }
          }
        );

        // Set loading to false after everything is set up
        if (mounted) {
          setLoading(false);
        }

        // Return cleanup function
        return () => {
          subscription.unsubscribe();
        };

      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    let cleanup;
    initAuth().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []); // Empty dependency array - only run once

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
      
      // First, get the email associated with the username
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