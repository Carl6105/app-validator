// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; username: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null);

  // Load user data from token on mount
  useEffect(() => {
    const token = localStorage.getItem('token'); // Updated key to 'token'
    if (token) {
      const fetchUserData = async () => {
        try {
          const response = await axios.get('/api/user/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          logout();
        }
      };
      fetchUserData();
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post('/api/register', { username, email, password });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      }
      throw new Error('Registration failed');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      const { token, user: userData } = response.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store auth token
      localStorage.setItem('token', token); // Updated key to 'token'
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token'); // Updated key to 'token'
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}