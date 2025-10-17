import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { rbacAPI } from '../../services/api';
import {
  ShieldCheckIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  TableCellsIcon,
  Squares2X2Icon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RolePermissionsPage = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'card' or 'table'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch roles
      const rolesData = await rbacAPI.getRoles();
      setRoles(rolesData);

      // Fetch permissions
      const permissionsData = await rbacAPI.getPermissions();
      setPermissions(permissionsData);

      // Group permissions by resource
      const grouped = {};
      permissionsData.forEach(permission => {
        if (!grouped[permission.resource]) {
          grouped[permission.resource] = [];
        }
        grouped[permission.resource].push(permission);
      });
      setGroupedPermissions(grouped);

      // Build role-permission mapping
      const mapping = {};
      for (const role of rolesData) {
        const roleDetail = await rbacAPI.getRole(role.id);
        mapping[role.id] = roleDetail.permission_ids || [];
      }
      setRolePermissions(mapping);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (roleId, permissionId) => {
    return rolePermissions[roleId]?.includes(permissionId) || false;
  };

  const togglePermission = async (roleId, permissionId, currentState) => {
    const role = roles.find(r => r.id === roleId);
    
    if (role?.is_system) {
      toast.error('Cannot modify system roles');
      return;
    }

    try {
      setSaving(true);
      
      // Get current permissions
      const currentPermissions = rolePermissions[roleId] || [];
      
      // Toggle the permission
      let newPermissions;
      if (currentState) {
        // Remove permission
        newPermissions = currentPermissions.filter(p => p !== permissionId);
      } else {
        // Add permission
        newPermissions = [...currentPermissions, permissionId];
      }

      // Update role
      await rbacAPI.updateRole(roleId, {
        permission_ids: newPermissions
      });

      // Update local state
      setRolePermissions(prev => ({
        ...prev,
        [roleId]: newPermissions
      }));

      toast.success('Permission updated successfully');
      
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    } finally {
      setSaving(false);
    }
  };

  const getResourceIcon = (resource) => {
    // Map resource to relevant icon or color
    const colors = {
      dashboard: 'text-blue-600 bg-blue-100',
      transactions: 'text-green-600 bg-green-100',
      accounts: 'text-purple-600 bg-purple-100',
      documents: 'text-yellow-600 bg-yellow-100',
      reports: 'text-indigo-600 bg-indigo-100',
      users: 'text-pink-600 bg-pink-100',
      settings: 'text-gray-600 bg-gray-100',
    };
    return colors[resource] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <ShieldCheckIcon className="h-8 w-8 mr-3 text-blue-600" />
            Role Permissions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage permissions for each role using the grid below
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">How to use:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check a box to grant a permission to a role</li>
              <li>Uncheck to revoke the permission</li>
              <li>System roles (marked with lock icon) cannot be modified</li>
              <li>Changes are saved automatically</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Permissions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-900 px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                  Permission / Resource
                </th>
                {roles.map(role => (
                  <th
                    key={role.id}
                    className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[120px]"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span>{role.display_name}</span>
                      {role.is_system && (
                        <span className="text-[10px] px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                          System
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body - Grouped by Resource */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <React.Fragment key={resource}>
                  {/* Resource Header Row */}
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <td
                      colSpan={roles.length + 1}
                      className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg ${getResourceIcon(resource)} flex items-center justify-center mr-3`}>
                          <span className="text-xs font-bold uppercase">{resource.slice(0, 2)}</span>
                        </div>
                        <span className="capitalize">{resource.replace('_', ' ')}</span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({perms.length} permission{perms.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Permission Rows */}
                  {perms.map((permission) => (
                    <tr
                      key={permission.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-6 py-4 border-r border-gray-200 dark:border-gray-700">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.name}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {permission.description}
                            </div>
                          )}
                        </div>
                      </td>
                      {roles.map(role => {
                        const isChecked = hasPermission(role.id, permission.id);
                        const isDisabled = role.is_system || saving;
                        
                        return (
                          <td key={`${role.id}-${permission.id}`} className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => togglePermission(role.id, permission.id, isChecked)}
                                className={`h-5 w-5 rounded border-gray-300 dark:border-gray-600 ${
                                  isDisabled
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'cursor-pointer text-blue-600 focus:ring-blue-500'
                                }`}
                                data-testid={`permission-${role.id}-${permission.id}`}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Roles</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{roles.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Permissions</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{permissions.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Permission Resources</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Object.keys(groupedPermissions).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsPage;
