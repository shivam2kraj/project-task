import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((response) => {
        setUser(response.data.user);
        localStorage.setItem('authUser', JSON.stringify(response.data.user));
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleAuthSuccess = useCallback((payload) => {
    if (payload?.token && payload?.user) {
      localStorage.setItem('authToken', payload.token);
      localStorage.setItem('authUser', JSON.stringify(payload.user));
      setUser(payload.user);
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (email, password, role = 'user') => {
      try {
        const response = await api.post('/auth/signup', { email, password, role });
        handleAuthSuccess(response.data);
        return { data: response.data, error: null };
      } catch (error) {
        const message =
          error.response?.data?.message || 'Failed to create account. Please try again.';
        return { data: null, error: { message } };
      }
    },
    [handleAuthSuccess]
  );

  const signIn = useCallback(
    async (email, password) => {
      try {
        const response = await api.post('/auth/signin', { email, password });
        handleAuthSuccess(response.data);
        return { data: response.data, error: null };
      } catch (error) {
        const message =
          error.response?.data?.message ||
          'Failed to sign in. Please check your credentials.';
        return { data: null, error: { message } };
      }
    },
    [handleAuthSuccess]
  );

  const signOut = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
    setLoading(false);
    return { error: null };
  }, []);

  const isAdmin = useCallback(() => user?.role === 'admin', [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signUp,
      signIn,
      signOut,
      isAdmin,
    }),
    [user, loading, signUp, signIn, signOut, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
