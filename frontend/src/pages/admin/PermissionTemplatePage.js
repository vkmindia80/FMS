import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { rbacAPI } from '../../services/api';
import {
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PermissionTemplatePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    applicable_on: 'admin_users',
    permission_ids: []
  });
  
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group permissions by resource and action type
  const [systemPermissions, setSystemPermissions] = useState([]);
  const [resourcePermissions, setResourcePermissions] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch all permissions
      const permsData = await rbacAPI.getPermissions();
      setPermissions(permsData);
      
      // Separate system-level and resource-level permissions
      const systemPerms = permsData.filter(p => 
        ['settings', 'users', 'roles', 'integrations', 'company', 'audit_logs', 'dashboard'].includes(p.resource)
      );
      
      const resourcePerms = permsData.filter(p => 
        ['transactions', 'accounts', 'documents', 'reports', 'invoices', 'payments', 'bank_connections', 'reconciliation'].includes(p.resource)
      );
      
      setSystemPermissions(systemPerms);
      
      // Group resource permissions by resource
      const grouped = {};
      resourcePerms.forEach(perm => {
        if (!grouped[perm.resource]) {
          grouped[perm.resource] = {};
        }
        grouped[perm.resource][perm.action] = perm;
      });
      setResourcePermissions(grouped);
      
      // If editing, load role data
      if (isEditMode) {
        const roleData = await rbacAPI.getRole(id);
        setFormData({
          name: roleData.name || '',
          description: roleData.description || '',
          applicable_on: roleData.applicable_on || 'admin_users',
          permission_ids: roleData.permissions.map(p => p.id) || []
        });
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    
    setSaving(true);
    try {
      if (isEditMode) {
        await rbacAPI.updateRole(id, formData);
        toast.success('Permission template updated successfully');
      } else {
        await rbacAPI.createRole(formData);
        toast.success('Permission template created successfully');
      }
      navigate('/admin');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.detail || 'Failed to save permission template');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter(id => id !== permissionId)
        : [...prev.permission_ids, permissionId]
    }));
  };

  const hasPermission = (permissionId) => {
    return formData.permission_ids.includes(permissionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  const resources = Object.keys(resourcePermissions);
  const actions = ['view', 'create', 'edit', 'delete', 'export', 'import'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              data-testid="back-button"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                {isEditMode ? 'Edit' : 'Create'} Permission Template
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Define role-based access control with granular permissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter template name"
                  data-testid="template-name-input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Describe this template..."
                  data-testid="template-description-input"
                />
              </div>

              {/* Applicable On */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Applicable On
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="applicable_on"
                      value="non_admin_users"
                      checked={formData.applicable_on === 'non_admin_users'}
                      onChange={(e) => setFormData({ ...formData, applicable_on: e.target.value })}
                      className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      data-testid="applicable-non-admin"
                    />
                    <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Non Admin Users
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="applicable_on"
                      value="admin_users"
                      checked={formData.applicable_on === 'admin_users'}
                      onChange={(e) => setFormData({ ...formData, applicable_on: e.target.value })}
                      className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      data-testid="applicable-admin"
                    />
                    <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Admin Users
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>

          {/* System Access Restrictions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Restrict Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemPermissions.map((perm) => {
                const isEnabled = hasPermission(perm.id);
                return (
                  <div key={perm.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        {perm.description || perm.name.replace('_', ' ')}
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePermission(perm.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isEnabled
                          ? 'bg-blue-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      data-testid={`toggle-${perm.resource}-${perm.action}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {isEnabled && (
                      <span className="ml-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Allowed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Permission Matrix */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Assign Permissions
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {/* Empty header for resource names */}
                    </th>
                    {actions.map((action) => (
                      <th
                        key={action}
                        className="py-3 px-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize"
                      >
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr
                      key={resource}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {resource.replace(/_/g, ' ')}
                      </td>
                      {actions.map((action) => {
                        const permission = resourcePermissions[resource]?.[action];
                        if (!permission) {
                          return (
                            <td key={action} className="py-4 px-4 text-center">
                              <div className="inline-flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" title="Not Applicable" />
                              </div>
                            </td>
                          );
                        }
                        
                        const isEnabled = hasPermission(permission.id);
                        return (
                          <td key={action} className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => togglePermission(permission.id)}
                              className="inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                              data-testid={`matrix-${resource}-${action}`}
                            >
                              {isEnabled ? (
                                <CheckCircleIcon className="w-6 h-6 text-green-500" title="Allowed" />
                              ) : (
                                <XCircleIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" title="Not Allowed" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-gray-600 dark:text-gray-400">Not Allowed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">Allowed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-gray-600 dark:text-gray-400">Not Applicable</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end gap-4"
          >
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              data-testid="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              data-testid="save-button"
            >
              {saving && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              )}
              {isEditMode ? 'Update Template' : 'Create Template'}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default PermissionTemplatePage;
