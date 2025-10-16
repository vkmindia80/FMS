import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { KeyIcon, ShieldCheckIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const SecuritySettings = () => {
  const { getAccessToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/profile/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to change password');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password to confirm' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/account?password=${encodeURIComponent(deletePassword)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken()}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Account deleted successfully. You will be logged out shortly.' });
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete account');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="security-settings">
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

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <KeyIcon className="h-6 w-6 mr-2" />
            Change Password
          </h2>
          <p className="mt-1 text-blue-100">Update your password to keep your account secure</p>
        </div>

        <div className="p-8">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Password *</label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                required
                data-testid="input-current-password"
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">New Password *</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                required
                minLength="8"
                data-testid="input-new-password"
                placeholder="Enter new password (min. 8 characters)"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                🔒 Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Confirm New Password *</label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                required
                data-testid="input-confirm-password"
                placeholder="Re-enter new password"
              />
            </div>

            <div className="flex justify-end pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-105 shadow-lg shadow-primary-500/50 disabled:opacity-50"
                disabled={saving}
                data-testid="btn-change-password"
              >
                {saving ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ShieldCheckIcon className="h-6 w-6 mr-2" />
            Two-Factor Authentication
          </h2>
          <p className="mt-1 text-green-100">Add an extra layer of security to your account</p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">2FA Status</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Two-factor authentication is currently disabled</p>
            </div>
            <button className="px-5 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed" disabled>
              Enable 2FA (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ClockIcon className="h-6 w-6 mr-2" />
            Active Sessions
          </h2>
          <p className="mt-1 text-purple-100">Manage devices where you're currently logged in</p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">Current Session</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">🌐 Browser - {new Date().toLocaleString()}</p>
            </div>
            <span className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold">
              ✓ Active
            </span>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ArrowDownTrayIcon className="h-6 w-6 mr-2" />
            Data Export
          </h2>
          <p className="mt-1 text-cyan-100">Download a copy of your data</p>
        </div>

        <div className="p-8">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
            Request a copy of all your data including profile information, transactions, and documents. This helps you maintain control of your information.
          </p>
          <button
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-105 shadow-lg shadow-primary-500/50"
            onClick={async () => {
              try {
                const response = await fetch(`${BACKEND_URL}/api/settings/export-data`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${getAccessToken()}` }
                });
                if (response.ok) {
                  setMessage({ type: 'success', text: 'Data export requested. You will receive an email when ready.' });
                }
              } catch (error) {
                setMessage({ type: 'error', text: 'Failed to request data export' });
              }
            }}
          >
            Request Data Export
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-red-300 dark:border-red-800 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
            Delete Account
          </h2>
          <p className="mt-1 text-red-100">Permanently delete your account and all associated data</p>
        </div>

        <div className="p-8">
          {!showDeleteConfirm ? (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                <p className="text-sm text-red-900 dark:text-red-200 font-medium">
                  ⚠️ Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
              <button
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
                onClick={() => setShowDeleteConfirm(true)}
                data-testid="btn-delete-account"
              >
                Delete My Account
              </button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  ⚠️ Are you absolutely sure? This action cannot be undone.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Enter your password to confirm</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                  placeholder="Your password"
                  data-testid="input-delete-password"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                  onClick={handleDeleteAccount}
                  disabled={saving || !deletePassword}
                  data-testid="btn-confirm-delete"
                >
                  {saving ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
