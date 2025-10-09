import React from 'react';
import { UsersIcon, BuildingOfficeIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const AdminPage = () => {
  const { user } = useAuth();

  const adminSections = [
    {
      name: 'User Management',
      description: 'Manage users and permissions',
      icon: UsersIcon,
      color: 'bg-primary-500',
    },
    {
      name: 'Company Settings',
      description: 'Configure company-wide settings',
      icon: BuildingOfficeIcon,
      color: 'bg-success-500',
    },
    {
      name: 'Audit Logs',
      description: 'View system audit trail',
      icon: ClipboardDocumentListIcon,
      color: 'bg-warning-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        <p className="mt-2 text-gray-600">
          Manage users, settings, and system configuration
        </p>
        <div className="mt-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
            {user?.role} Access
          </span>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => (
          <div key={section.name} className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`rounded-lg p-3 ${section.color}`}>
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">{section.name}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-12 text-gray-500">
            Administrative interface coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;