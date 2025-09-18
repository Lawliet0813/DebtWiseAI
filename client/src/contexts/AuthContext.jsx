import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api';

// Initial state
const initialState = {
  user: null,
  tokens: null,
  loading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        tokens: null,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user data on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = getStoredTokens();
        if (!tokens?.accessToken) {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          return;
        }

        // Set API default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

        // Verify token and get user data
        const response = await api.get('/auth/me');
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            tokens,
          },
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens
        clearStoredTokens();
        delete api.defaults.headers.common['Authorization'];
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    let refreshInterval;

    if (state.tokens?.accessToken) {
      // Refresh token every 6 hours (tokens typically expire in 7 days)
      refreshInterval = setInterval(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
          logout();
        }
      }, 6 * 60 * 60 * 1000); // 6 hours
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.tokens]);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/login', { email, password });
      const { user, tokens } = response.data;

      // Store tokens
      storeTokens(tokens);

      // Set API default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, tokens },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/register', userData);
      const { user, tokens } = response.data;

      // Store tokens
      storeTokens(tokens);

      // Set API default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, tokens },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.tokens?.accessToken) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      clearStoredTokens();
      delete api.defaults.headers.common['Authorization'];
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const tokens = getStoredTokens();
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });

      const newTokens = response.data.tokens;
      storeTokens(newTokens);

      // Update API default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: state.user,
          tokens: newTokens,
        },
      });

      return newTokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData,
    });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Token storage functions
  const storeTokens = (tokens) => {
    localStorage.setItem('debtwise_tokens', JSON.stringify(tokens));
  };

  const getStoredTokens = () => {
    try {
      const stored = localStorage.getItem('debtwise_tokens');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const clearStoredTokens = () => {
    localStorage.removeItem('debtwise_tokens');
  };

  const value = {
    // State
    user: state.user,
    tokens: state.tokens,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};