import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

// Action types
const ActionTypes = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        isAuthenticated: true,
        error: null,
      };
    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        user: null,
        isAuthenticated: false,
        error: action.payload,
      };
    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case ActionTypes.UPDATE_USER:
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

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Token management
const TOKEN_KEY = 'afms_access_token';
const REFRESH_TOKEN_KEY = 'afms_refresh_token';
const USER_KEY = 'afms_user';

const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  };
};

const setStoredTokens = (accessToken, refreshToken, user) => {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearStoredTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      try {
        const { accessToken, refreshToken, user } = getStoredTokens();

        if (accessToken && refreshToken && user) {
          // Verify token is still valid by fetching user info
          try {
            const currentUser = await authAPI.getCurrentUser();
            dispatch({
              type: ActionTypes.LOGIN_SUCCESS,
              payload: { user: currentUser },
            });
          } catch (error) {
            // Token might be expired, try to refresh
            try {
              const refreshResponse = await authAPI.refreshToken(refreshToken);
              setStoredTokens(refreshResponse.access_token, refreshToken, user);
              
              const currentUser = await authAPI.getCurrentUser();
              dispatch({
                type: ActionTypes.LOGIN_SUCCESS,
                payload: { user: currentUser },
              });
            } catch (refreshError) {
              // Refresh failed, clear tokens and logout
              clearStoredTokens();
              dispatch({ type: ActionTypes.LOGOUT });
            }
          }
        } else {
          dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearStoredTokens();
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: ActionTypes.LOGIN_START });

    try {
      const response = await authAPI.login(email, password);
      
      setStoredTokens(
        response.access_token,
        response.refresh_token,
        response.user
      );

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: { user: response.user },
      });

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: ActionTypes.LOGIN_START });

    try {
      const response = await authAPI.register(userData);
      
      setStoredTokens(
        response.access_token,
        response.refresh_token,
        response.user
      );

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: { user: response.user },
      });

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearStoredTokens();
      dispatch({ type: ActionTypes.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update user function
  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    dispatch({
      type: ActionTypes.UPDATE_USER,
      payload: userData,
    });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const { refreshToken: storedRefreshToken } = getStoredTokens();
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(storedRefreshToken);
      setStoredTokens(response.access_token, storedRefreshToken, state.user);
      
      return response.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  // Get current access token
  const getAccessToken = () => {
    return localStorage.getItem(TOKEN_KEY);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };

  // Context value
  const value = {
    // State
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,

    // Actions
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshToken,
    getAccessToken,

    // Utilities
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};