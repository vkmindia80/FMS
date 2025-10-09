import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';

const Header = ({ onMobileMenuClick }) => {
  const { darkMode, toggleDarkMode, colorScheme, setColorScheme, colorSchemes } = useTheme();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const colorSchemeOptions = Object.entries(colorSchemes).map(([key, scheme]) => ({
    id: key,
    ...scheme,
  }));

  const handleColorSchemeChange = (schemeId) => {
    setColorScheme(schemeId);
    setShowColorMenu(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuClick}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
            data-testid="mobile-menu-button"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="hidden sm:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:w-64 lg:w-80"
                data-testid="search-input"
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Color scheme selector */}
          <div className="relative">
            <button
              onClick={() => setShowColorMenu(!showColorMenu)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-testid="color-scheme-button"
            >
              <PaintBrushIcon className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {showColorMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                >
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                      Color Scheme
                    </div>
                    {colorSchemeOptions.map((scheme) => (
                      <button
                        key={scheme.id}
                        onClick={() => handleColorSchemeChange(scheme.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          colorScheme === scheme.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          scheme.id === 'default' ? 'bg-blue-500' :
                          scheme.id === 'warm' ? 'bg-orange-500' :
                          scheme.id === 'cool' ? 'bg-cyan-500' :
                          'bg-gray-500'
                        }`} />
                        {scheme.name}
                        {colorScheme === scheme.id && (
                          <div className="ml-auto w-2 h-2 bg-current rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            data-testid="dark-mode-toggle"
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-testid="user-menu-button"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium">{user?.full_name || 'User'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Member'}</div>
              </div>
              <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${
                showUserMenu ? 'rotate-180' : ''
              }`} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.full_name || 'User'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                      <UserCircleIcon className="h-4 w-4 mr-3" />
                      Profile
                    </button>
                    <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                      <CogIcon className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                  </div>
                  
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={logout}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      data-testid="header-logout-button"
                    >
                      <PowerIcon className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;