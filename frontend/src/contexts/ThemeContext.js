import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  darkMode: false,
  sidebarCollapsed: false,
  colorScheme: 'default', // default, warm, cool, monochrome
};

// Action types
const ActionTypes = {
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  SET_DARK_MODE: 'SET_DARK_MODE',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR_COLLAPSED: 'SET_SIDEBAR_COLLAPSED',
  SET_COLOR_SCHEME: 'SET_COLOR_SCHEME',
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_DARK_MODE:
      return {
        ...state,
        darkMode: !state.darkMode,
      };
    case ActionTypes.SET_DARK_MODE:
      return {
        ...state,
        darkMode: action.payload,
      };
    case ActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };
    case ActionTypes.SET_SIDEBAR_COLLAPSED:
      return {
        ...state,
        sidebarCollapsed: action.payload,
      };
    case ActionTypes.SET_COLOR_SCHEME:
      return {
        ...state,
        colorScheme: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Storage keys
const THEME_STORAGE_KEY = 'afms_theme_preferences';

// Get stored preferences
const getStoredPreferences = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading theme preferences:', error);
    return {};
  }
};

// Store preferences
const storePreferences = (preferences) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error storing theme preferences:', error);
  }
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, () => {
    const stored = getStoredPreferences();
    return {
      ...initialState,
      darkMode: stored.darkMode ?? (window.matchMedia('(prefers-color-scheme: dark)').matches),
      sidebarCollapsed: stored.sidebarCollapsed ?? false,
      colorScheme: stored.colorScheme ?? 'default',
    };
  });

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (state.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply color scheme class
    root.classList.remove('theme-default', 'theme-warm', 'theme-cool', 'theme-monochrome');
    root.classList.add(`theme-${state.colorScheme}`);
    
    // Store preferences
    storePreferences({
      darkMode: state.darkMode,
      sidebarCollapsed: state.sidebarCollapsed,
      colorScheme: state.colorScheme,
    });
  }, [state.darkMode, state.sidebarCollapsed, state.colorScheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set preference
      const stored = getStoredPreferences();
      if (stored.darkMode === undefined) {
        dispatch({ type: ActionTypes.SET_DARK_MODE, payload: e.matches });
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Actions
  const toggleDarkMode = () => {
    dispatch({ type: ActionTypes.TOGGLE_DARK_MODE });
  };

  const setDarkMode = (enabled) => {
    dispatch({ type: ActionTypes.SET_DARK_MODE, payload: enabled });
  };

  const toggleSidebar = () => {
    dispatch({ type: ActionTypes.TOGGLE_SIDEBAR });
  };

  const setSidebarCollapsed = (collapsed) => {
    dispatch({ type: ActionTypes.SET_SIDEBAR_COLLAPSED, payload: collapsed });
  };

  const setColorScheme = (scheme) => {
    dispatch({ type: ActionTypes.SET_COLOR_SCHEME, payload: scheme });
  };

  // Get theme classes helper
  const getThemeClasses = (baseClasses = '') => {
    const themeClasses = {
      default: '',
      warm: 'theme-warm',
      cool: 'theme-cool',
      monochrome: 'theme-monochrome',
    };
    
    return `${baseClasses} ${themeClasses[state.colorScheme] || ''} ${state.darkMode ? 'dark' : ''}`.trim();
  };

  // Color scheme configurations
  const colorSchemes = {
    default: {
      name: 'Default',
      primary: 'blue',
      secondary: 'indigo',
      accent: 'purple',
    },
    warm: {
      name: 'Warm',
      primary: 'orange',
      secondary: 'red',
      accent: 'yellow',
    },
    cool: {
      name: 'Cool',
      primary: 'cyan',
      secondary: 'teal',
      accent: 'emerald',
    },
    monochrome: {
      name: 'Monochrome',
      primary: 'gray',
      secondary: 'slate',
      accent: 'zinc',
    },
  };

  // Context value
  const value = {
    // State
    darkMode: state.darkMode,
    sidebarCollapsed: state.sidebarCollapsed,
    colorScheme: state.colorScheme,
    
    // Actions
    toggleDarkMode,
    setDarkMode,
    toggleSidebar,
    setSidebarCollapsed,
    setColorScheme,
    
    // Utilities
    getThemeClasses,
    colorSchemes,
    currentScheme: colorSchemes[state.colorScheme],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;