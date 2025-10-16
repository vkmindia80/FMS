import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon, BellIcon } from '@heroicons/react/24/outline';

const PreferencesSettings = () => {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    number_format: 'en-US',
    currency_display: 'symbol',
    notifications_enabled: true,
    email_notifications: true,
    desktop_notifications: false
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/preferences`, {
        headers: { 'Authorization': `Bearer ${getAccessToken()}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences updated successfully!' });
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update preferences');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading preferences...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="preferences-settings">
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Appearance */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Customize how the application looks and feels
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                    preferences.theme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <SunIcon className="h-6 w-6 text-yellow-500 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                    preferences.theme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <MoonIcon className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, theme: 'auto' })}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                    preferences.theme === 'auto'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <ComputerDesktopIcon className="h-6 w-6 text-gray-500 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Auto</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="input"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </form>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Regional Settings</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure date, time, and number formats
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="input"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Format
                </label>
                <select
                  value={preferences.date_format}
                  onChange={(e) => setPreferences({ ...preferences, date_format: e.target.value })}
                  className="input"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                  <option value="DD MMM YYYY">DD MMM YYYY (31 Dec 2024)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Format
                </label>
                <select
                  value={preferences.time_format}
                  onChange={(e) => setPreferences({ ...preferences, time_format: e.target.value })}
                  className="input"
                >
                  <option value="12h">12-hour (2:30 PM)</option>
                  <option value="24h">24-hour (14:30)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number Format
                </label>
                <select
                  value={preferences.number_format}
                  onChange={(e) => setPreferences({ ...preferences, number_format: e.target.value })}
                  className="input"
                >
                  <option value="en-US">1,234.56 (US)</option>
                  <option value="de-DE">1.234,56 (EU)</option>
                  <option value="fr-FR">1 234,56 (FR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency Display
                </label>
                <select
                  value={preferences.currency_display}
                  onChange={(e) => setPreferences({ ...preferences, currency_display: e.target.value })}
                  className="input"
                >
                  <option value="symbol">Symbol ($, €, £)</option>
                  <option value="code">Code (USD, EUR, GBP)</option>
                  <option value="name">Name (US Dollar)</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage how you receive notifications
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start">
                <BellIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about important updates</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notifications_enabled}
                  onChange={(e) => setPreferences({ ...preferences, notifications_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                  className="sr-only peer"
                  disabled={!preferences.notifications_enabled}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Desktop Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Show desktop notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.desktop_notifications}
                  onChange={(e) => setPreferences({ ...preferences, desktop_notifications: e.target.checked })}
                  className="sr-only peer"
                  disabled={!preferences.notifications_enabled}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </form>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={fetchPreferences}
          className="btn-secondary"
          disabled={saving}
        >
          Reset
        </button>
        <button
          onClick={handleSubmit}
          className="btn-primary"
          disabled={saving}
          data-testid="btn-save-preferences"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default PreferencesSettings;
