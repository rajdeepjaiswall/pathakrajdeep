import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getStoredUser, getStoredToken, logout as authLogout } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  authType: 'jwt' | 'session' | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  loginWithSession: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authType, setAuthType] = useState<'jwt' | 'session' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only check for session-based authentication
    checkSessionAuth();
  }, []);

  const checkSessionAuth = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated && data.user) {
          setUser(data.user);
          setAuthType('session');
          
          // Store in localStorage for UI consistency
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Log continuous session for Google OAuth users
          if (data.user.authProvider === 'google') {
            console.log('Google OAuth continuous session active:', {
              user: data.user.email,
              loginTime: data.user.loginTime,
              profileCompleted: data.user.profileCompleted,
              sessionType: 'persistent'
            });
          }
          
          // Check if Google OAuth user needs to complete profile
          if (data.user.authProvider === 'google' && !data.user.profileCompleted) {
            console.log('Google user needs to complete profile - maintaining session');
          }
        }
      }
    } catch (error) {
      console.log('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newUser: User) => {
    setUser(newUser);
    setToken(null);
    setAuthType('session');
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const loginWithSession = (newUser: User) => {
    setUser(newUser);
    setToken(null);
    setAuthType('session');
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    // Always use session-based logout
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
    } catch (error) {
      console.error('Session logout error:', error);
    }
    
    setUser(null);
    setToken(null);
    setAuthType(null);
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Log profile completion for Google OAuth users
    if (updatedUser.authProvider === 'google' && updatedUser.profileCompleted) {
      console.log('Google OAuth user profile completed - continuous session maintained');
    }
  };

  const value = {
    user,
    token,
    authType,
    isAuthenticated: !!user,
    login,
    loginWithSession,
    logout,
    updateUser,
    isLoading,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
