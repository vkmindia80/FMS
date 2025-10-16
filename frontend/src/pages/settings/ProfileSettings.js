import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, BriefcaseIcon, CheckCircleIcon, CameraIcon } from '@heroicons/react/24/outline';

const ProfileSettings = () => {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/profile`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          job_title: data.job_title || '',
          department: data.department || ''
        });
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile information' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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
              <span className="text-gray-600 dark:text-gray-400 font-medium">Loading your profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="profile-settings">
      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 rounded-xl border-2 animate-slide-down ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
          data-testid="profile-message"
        >
          <div className="flex items-center">
            {message.type === 'success' && <CheckCircleIcon className="h-5 w-5 mr-2" />}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Profile Information</h2>
          <p className="mt-1 text-primary-100">
            Update your personal information and contact details
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Photo Section */}
            <div className="flex items-center space-x-6 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-4 ring-primary-100 dark:ring-primary-900/30 shadow-lg">
                  <UserCircleIcon className="h-20 w-20 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer">
                  <CameraIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Photo</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload a professional photo that represents you</p>
                <button
                  type="button"
                  className="mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled
                >
                  Change Photo (Coming Soon)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  data-testid="input-full-name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  required
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    data-testid="input-email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    required
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    data-testid="input-phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label htmlFor="job_title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Job Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="job_title"
                    name="job_title"
                    data-testid="input-job-title"
                    value={profile.job_title}
                    onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    placeholder="e.g., Chief Financial Officer"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  data-testid="input-department"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="e.g., Finance & Accounting"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={fetchProfile}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all transform hover:scale-105"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="btn-save-profile"
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-105 shadow-lg shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
