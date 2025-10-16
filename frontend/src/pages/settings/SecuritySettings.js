import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { KeyIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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

    // Validate passwords match
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
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
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
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Account deleted successfully. You will be logged out shortly.' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
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

      {/* Change Password */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <KeyIcon className="h-5 w-5 mr-2 text-primary-500" />
            Change Password
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update your password to keep your account secure
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password *
              </label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="input"
                required
                data-testid="input-current-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password *
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="input"
                required
                minLength="8"
                data-testid="input-new-password"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="input"
                required
                data-testid="input-confirm-password"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                data-testid="btn-change-password"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-primary-500" />
            Two-Factor Authentication
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">2FA Status</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Two-factor authentication is currently disabled</p>
            </div>
            <button className="btn-secondary" disabled>
              Enable 2FA (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage devices where you're currently logged in
          </p>
        </div>

        <div className="card-body">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Current Session</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Browser - {new Date().toLocaleString()}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Export</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Download a copy of your data
          </p>
        </div>

        <div className="card-body">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Request a copy of all your data including profile information, transactions, and documents.
          </p>
          <button
            className="btn-secondary"
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
      <div className="card border-red-200 dark:border-red-800">
        <div className="card-header bg-red-50 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            Delete Account
          </h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            Permanently delete your account and all associated data
          </p>
        </div>

        <div className="card-body">
          {!showDeleteConfirm ? (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                className="btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
                data-testid="btn-delete-account"
              >
                Delete My Account
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Are you absolutely sure? This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="input"
                  placeholder="Your password"
                  data-testid="input-delete-password"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
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
