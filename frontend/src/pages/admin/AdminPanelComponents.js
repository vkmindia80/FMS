import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  KeyIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import {
  createRole,
  updateRole,
  getUserRoles,
  assignRolesToUser,
  createUser,
  updateUser,
  createPlan,
  updatePlan
} from '../../services/rbac';

// ============================================================================
// USERS TAB
// ============================================================================

export const UsersTab = ({ users, viewMode, companies, onManageRoles, onEdit, onDelete, onToggleActive, onViewRole }) => {
  if (viewMode === 'list') {
    // List View (Table)
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>No users found</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" data-testid={`user-row-${user.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{user.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      user.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_system_user && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-semibold">
                        System
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onManageRoles(user)}
                        className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                        title="Manage Roles"
                        data-testid={`manage-roles-btn-${user.id}`}
                      >
                        <ShieldCheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400"
                        title="Edit"
                        data-testid={`edit-user-btn-${user.id}`}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onToggleActive(user)}
                        className={user.is_active ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                        title={user.is_active ? 'Disable' : 'Enable'}
                        data-testid={`toggle-user-btn-${user.id}`}
                      >
                        {user.is_active ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => onDelete(user)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                        title="Delete"
                        data-testid={`delete-user-btn-${user.id}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Card View (Original)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="users-list">
      {users.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">No users found</p>
        </div>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-all"
            data-testid={`user-card-${user.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {user.full_name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {user.is_system_user && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full font-semibold">
                    System
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Company:</span>
                <span className="font-medium text-gray-900 dark:text-white">{user.company_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Role:</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold capitalize">
                  {user.role || 'No role'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                  user.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onManageRoles(user)}
                className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                data-testid={`manage-roles-btn-${user.id}`}
              >
                Manage Roles
              </button>
              <button
                onClick={() => onEdit(user)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                title="Edit"
                data-testid={`edit-user-btn-${user.id}`}
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onToggleActive(user)}
                className={`p-2 rounded-lg transition-colors ${
                  user.is_active 
                    ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30' 
                    : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                }`}
                title={user.is_active ? 'Disable' : 'Enable'}
                data-testid={`toggle-user-btn-${user.id}`}
              >
                {user.is_active ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => onDelete(user)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Delete"
                data-testid={`delete-user-btn-${user.id}`}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ============================================================================
// ROLES TAB
// ============================================================================

export const RolesTab = ({ roles, viewMode, onEdit, onDelete, onView }) => {
  if (viewMode === 'list') {
    // List View (Table)
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {roles.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>No roles found</p>
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" data-testid={`role-row-${role.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {role.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onView(role)}
                      className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 text-sm font-medium flex items-center gap-1"
                    >
                      <EyeIcon className="w-4 h-4" />
                      {role.permissions?.length || 0} permissions
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {role.user_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {role.is_system && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full font-semibold">
                        System
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!role.is_system && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => window.location.href = `/admin/permission-template/${role.id}`}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                          title="Edit in Permission Template"
                          data-testid={`template-edit-btn-${role.id}`}
                        >
                          <ShieldCheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onEdit(role)}
                          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                          title="Quick Edit"
                          data-testid={`edit-role-btn-${role.id}`}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(role)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          title="Delete"
                          data-testid={`delete-role-btn-${role.id}`}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Card View (Original)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="roles-list">
      {roles.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">No roles found</p>
        </div>
      ) : (
        roles.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all"
            data-testid={`role-card-${role.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {role.name}
                  </h3>
                  {role.is_system && (
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full font-semibold">
                      System
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {role.description || 'No description'}
                </p>
              </div>
              
              {!role.is_system && (
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/admin/permission-template/${role.id}`}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    title="Edit in Permission Template"
                    data-testid={`template-edit-btn-${role.id}`}
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(role)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Quick Edit"
                    data-testid={`edit-role-btn-${role.id}`}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(role)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                    data-testid={`delete-role-btn-${role.id}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Permissions:</span>
                <button
                  onClick={() => onView(role)}
                  className="font-semibold text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 flex items-center gap-1"
                >
                  <EyeIcon className="w-4 h-4" />
                  {role.permissions?.length || 0}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Users:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {role.user_count || 0}
                </span>
              </div>
              
              {role.permissions && role.permissions.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sample Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <span
                        key={perm.id}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                      >
                        {perm.name}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Continue in next message due to length...