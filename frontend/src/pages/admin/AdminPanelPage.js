import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  RectangleStackIcon,
  ArrowRightIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const AdminPanelPage = () => {
  const navigate = useNavigate();

  const adminSections = [
    {
      id: 'tenants',
      name: 'Tenant Management',
      description: 'Create and manage companies and individual tenants',
      icon: BuildingOfficeIcon,
      color: 'orange',
      href: '/admin/tenants',
      features: ['Create tenants', 'Company or Individual', 'Auto-setup accounts', 'Admin user creation']
    },
    {
      id: 'users',
      name: 'User Management',
      description: 'Create, edit, and manage user accounts across your organization',
      icon: UserGroupIcon,
      color: 'blue',
      href: '/admin/users',
      features: ['Create users', 'Assign roles', 'System users', 'Card & Table views']
    },
    {
      id: 'roles',
      name: 'Roles & Permissions',
      description: 'Configure role-based access control and permission management',
      icon: ShieldCheckIcon,
      color: 'purple',
      href: '/admin/roles',
      features: ['Create roles', 'Edit roles', 'Delete roles', 'Assign permissions']
    },
    {
      id: 'plans',
      name: 'Plans Management',
      description: 'Manage subscription plans and feature access control',
      icon: RectangleStackIcon,
      color: 'green',
      href: '/admin/plans',
      features: ['Create plans', 'Menu access', 'Assign to companies', 'Pricing management']
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      orange: {
        gradient: 'from-orange-500 to-orange-600',
        icon: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      },
      blue: {
        gradient: 'from-blue-500 to-blue-600',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      },
      purple: {
        gradient: 'from-purple-500 to-purple-600',
        icon: 'text-purple-600',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      },
      green: {
        gradient: 'from-green-500 to-green-600',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Administration Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage users, roles, permissions, and subscription plans
        </p>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const colorClasses = getColorClasses(section.color);
          const Icon = section.icon;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate(section.href)}
              data-testid={`admin-section-${section.id}`}
            >
              {/* Card Header with Gradient */}
              <div className={`bg-gradient-to-r ${colorClasses.gradient} p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {section.name}
                </h3>
                <p className="text-white/90 text-sm">
                  {section.description}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Key Features:
                  </h4>
                  {section.features.map((feature, index) => (
                    <div 
                      key={index} 
                      className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${colorClasses.icon} mr-2`} />
                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  className={`mt-4 w-full px-4 py-2 ${colorClasses.badge} rounded-lg font-medium hover:opacity-80 transition-opacity flex items-center justify-center`}
                  data-testid={`open-${section.id}-button`}
                >
                  Open {section.name}
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Admin Panel Access
            </h3>
            <div className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <p>
                • <strong>User Management:</strong> Full control over user accounts, including creating system users with multi-company access
              </p>
              <p>
                • <strong>Roles & Permissions:</strong> Configure granular access control with permission-based role management
              </p>
              <p>
                • <strong>Plans Management:</strong> Define subscription plans and control feature availability per company
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                User Management
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-lg p-3">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                RBAC System
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Configured
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-lg p-3">
              <RectangleStackIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Plans System
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Operational
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;
