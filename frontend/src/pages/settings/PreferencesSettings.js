import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon, BellIcon, GlobeAltIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
    // eslint-disable-next-line
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
        setTimeout(() => setMessage(null), 5000);
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Loading preferences...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="preferences-settings">
      {message && (
        <div className={`p-4 rounded-xl border-2 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
          <div className="flex items-center">
            {message.type === 'success' && <CheckCircleIcon className="h-5 w-5 mr-2" />}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <SunIcon className="h-6 w-6 mr-2" />
            Appearance
          </h2>
          <p className="mt-1 text-purple-100">Customize how the application looks and feels</p>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Theme Preference</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', icon: SunIcon, label: 'Light', color: 'from-yellow-400 to-orange-500', desc: 'Bright & clear' },
                  { value: 'dark', icon: MoonIcon, label: 'Dark', color: 'from-indigo-500 to-purple-600', desc: 'Easy on eyes' },
                  { value: 'auto', icon: ComputerDesktopIcon, label: 'Auto', color: 'from-gray-400 to-gray-600', desc: 'Follows system' }
                ].map((theme) => {
                  const Icon = theme.icon;
                  const isSelected = preferences.theme === theme.value;
                  return (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, theme: theme.value })}
                      className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${theme.color} shadow-lg mb-3`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">{theme.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{theme.desc}</span>
                      {isSelected && <div className="absolute top-2 right-2"><CheckCircleIcon className="h-6 w-6 text-primary-500" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <GlobeAltIcon className="h-4 w-4 inline mr-1" />Language
              </label>
              <select value={preferences.language} onChange={(e) => setPreferences({ ...preferences, language: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white">
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="zh">🇨🇳 中文</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center"><ClockIcon className="h-6 w-6 mr-2" />Regional Settings</h2>
          <p className="mt-1 text-blue-100">Configure date, time, and number formats</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
              <select value={preferences.timezone} onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
              <select value={preferences.date_format} onChange={(e) => setPreferences({ ...preferences, date_format: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD MMM YYYY">DD MMM YYYY</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time Format</label>
              <select value={preferences.time_format} onChange={(e) => setPreferences({ ...preferences, time_format: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white">
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Number Format</label>
              <select value={preferences.number_format} onChange={(e) => setPreferences({ ...preferences, number_format: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white">
                <option value="en-US">1,234.56</option>
                <option value="de-DE">1.234,56</option>
                <option value="fr-FR">1 234,56</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Currency Display</label>
              <select value={preferences.currency_display} onChange={(e) => setPreferences({ ...preferences, currency_display: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white">
                <option value="symbol">Symbol</option>
                <option value="code">Code</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center"><BellIcon className="h-6 w-6 mr-2" />Notifications</h2>
          <p className="mt-1 text-green-100">Manage how you receive notifications</p>
        </div>
        <div className="p-8">
          <div className="space-y-4">
            {[
              { key: 'notifications_enabled', label: 'Enable Notifications', desc: 'Receive notifications about important updates', icon: '🔔' },
              { key: 'email_notifications', label: 'Email Notifications', desc: 'Get notified via email', icon: '📧', disabled: !preferences.notifications_enabled },
              { key: 'desktop_notifications', label: 'Desktop Notifications', desc: 'Show desktop notifications', icon: '💻', disabled: !preferences.notifications_enabled },
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start space-x-4">
                  <span className="text-3xl">{setting.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{setting.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{setting.desc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={preferences[setting.key]} onChange={(e) => setPreferences({ ...preferences, [setting.key]: e.target.checked })} className="sr-only peer" disabled={setting.disabled} />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={fetchPreferences} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all transform hover:scale-105" disabled={saving}>Reset</button>
        <button onClick={handleSubmit} className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-105 shadow-lg shadow-primary-500/50 disabled:opacity-50" disabled={saving} data-testid="btn-save-preferences">
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default PreferencesSettings;
