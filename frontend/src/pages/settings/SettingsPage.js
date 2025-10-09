import React from 'react';
import { Cog6ToothIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and company preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            <a href="#profile" className="bg-primary-50 text-primary-700 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <UserIcon className="text-primary-500 mr-3 h-6 w-6" />
              Profile
            </a>
            <a href="#company" className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <BuildingOfficeIcon className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6" />
              Company
            </a>
            <a href="#preferences" className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Cog6ToothIcon className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6" />
              Preferences
            </a>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
            </div>
            <div className="card-body">
              <div className="text-center py-12 text-gray-500">
                Settings interface coming soon...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;