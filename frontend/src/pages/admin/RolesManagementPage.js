import React, { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  Squares2X2Icon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions
} from '../../services/rbac';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RolesManagementPage = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permission_ids: [],
    applicable_on: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        getRoles(),
        getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!formData.name) {
        toast.error('Please enter a role name');
        return;
      }

      await createRole(formData);
      toast.success('Role created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    try {
      if (!formData.name) {
        toast.error('Please enter a role name');
        return;
      }

      await updateRole(selectedRole.id, formData);
      toast.success('Role updated successfully');
      setIsEditModalOpen(false);
      setSelectedRole(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleDeleteRole = async () => {
    try {
      await deleteRole(selectedRole.id);
      toast.success('Role deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete role');
    }
  };

  const openEditModal = async (role) => {
    try {
      const roleDetail = await getRole(role.id);
      setSelectedRole(roleDetail);
      setFormData({
        name: roleDetail.name,
        description: roleDetail.description || '',
        permission_ids: roleDetail.permissions.map(p => p.id),
        applicable_on: roleDetail.applicable_on || 'all'
      });
      setIsEditModalOpen(true);
    } catch (error) {
      toast.error('Failed to load role details');
    }
  };

  const openViewModal = async (role) => {
    try {
      const roleDetail = await getRole(role.id);
      setSelectedRole(roleDetail);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load role details');
    }
  };

  const openDeleteModal = (role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permission_ids: [],
      applicable_on: 'all'
    });
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter(id => id !== permissionId)
        : [...prev.permission_ids, permissionId]
    }));
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {});

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            Roles Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage user roles and their permissions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          data-testid="create-role-button"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Role
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                data-testid="role-search-input"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded ${viewMode === 'card' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              data-testid="card-view-button"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              data-testid="table-view-button"
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Roles Display */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              data-testid={`role-card-${role.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {role.name}
                  </h3>
                  {role.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {role.description}
                    </p>
                  )}
                </div>
                {role.is_system && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs font-medium">
                    System
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <ShieldCheckIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {role.permissions?.length || 0} permissions
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {role.user_count} users
                  </span>
                </div>
                {role.applicable_on && (
                  <div className="flex items-center text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      role.applicable_on === 'admin_users' 
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : role.applicable_on === 'non_admin_users'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {role.applicable_on === 'admin_users' ? 'Admin Only' : 
                       role.applicable_on === 'non_admin_users' ? 'Non-Admin Only' : 'All Users'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => openViewModal(role)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  data-testid={`view-role-${role.id}`}
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => openEditModal(role)}
                  className="text-sm text-gray-600 hover:text-gray-700 flex items-center"
                  data-testid={`edit-role-${role.id}`}
                  disabled={role.is_system}
                >
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(role)}
                  className={`text-sm flex items-center ${
                    role.is_system 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:text-red-700'
                  }`}
                  data-testid={`delete-role-${role.id}`}
                  disabled={role.is_system}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="roles-table">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    data-testid={`role-row-${role.id}`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {role.name}
                        </div>
                        {role.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {role.permissions?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {role.user_count}
                    </td>
                    <td className="px-6 py-4">
                      {role.is_system ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          System
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Custom
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => openViewModal(role)}
                        className="text-blue-600 hover:text-blue-700"
                        data-testid={`view-role-table-${role.id}`}
                      >
                        <EyeIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => openEditModal(role)}
                        className={role.is_system ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-700'}
                        data-testid={`edit-role-table-${role.id}`}
                        disabled={role.is_system}
                      >
                        <PencilSquareIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(role)}
                        className={role.is_system ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}
                        data-testid={`delete-role-table-${role.id}`}
                        disabled={role.is_system}
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Roles</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{roles.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">System Roles</div>
          <div className="text-2xl font-bold text-yellow-600">{roles.filter(r => r.is_system).length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Custom Roles</div>
          <div className="text-2xl font-bold text-green-600">{roles.filter(r => !r.is_system).length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Permissions</div>
          <div className="text-2xl font-bold text-blue-600">{permissions.length}</div>
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      <RoleFormModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedRole(null);
          resetForm();
        }}
        onSubmit={isCreateModalOpen ? handleCreateRole : handleUpdateRole}
        formData={formData}
        setFormData={setFormData}
        permissions={permissions}
        groupedPermissions={groupedPermissions}
        togglePermission={togglePermission}
        title={isCreateModalOpen ? 'Create New Role' : 'Edit Role'}
        submitText={isCreateModalOpen ? 'Create Role' : 'Update Role'}
      />

      {/* View Role Modal */}
      <ViewRoleModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRole(null);
        }}
        role={selectedRole}
        groupedPermissions={groupedPermissions}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedRole(null);
        }}
        onConfirm={handleDeleteRole}
        role={selectedRole}
      />
    </div>
  );
};

// Role Form Modal Component
const RoleFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  permissions,
  groupedPermissions,
  togglePermission,
  title, 
  submitText 
}) => {
  const [searchPermission, setSearchPermission] = useState('');

  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce((acc, [resource, perms]) => {
    const filtered = perms.filter(p => 
      p.name.toLowerCase().includes(searchPermission.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchPermission.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[resource] = filtered;
    }
    return acc;
  }, {});

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                  {title}
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., Accountant"
                        data-testid="role-name-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Applicable To
                      </label>
                      <select
                        value={formData.applicable_on}
                        onChange={(e) => setFormData({ ...formData, applicable_on: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="role-applicable-select"
                      >
                        <option value="all">All Users</option>
                        <option value="admin_users">Admin Users Only</option>
                        <option value="non_admin_users">Non-Admin Users Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Brief description of this role"
                      data-testid="role-description-input"
                    />
                  </div>

                  {/* Permissions Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Permissions ({formData.permission_ids.length} selected)
                      </label>
                      <input
                        type="text"
                        placeholder="Search permissions..."
                        value={searchPermission}
                        onChange={(e) => setSearchPermission(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      {Object.entries(filteredGroupedPermissions).map(([resource, perms]) => (
                        <div key={resource} className="mb-4 last:mb-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                            {resource.replace('_', ' ')}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                            {perms.map((permission) => (
                              <label
                                key={permission.id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.permission_ids.includes(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {permission.action}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      data-testid="cancel-role-form-button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      data-testid="submit-role-form-button"
                    >
                      {submitText}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// View Role Modal Component
const ViewRoleModal = ({ isOpen, onClose, role, groupedPermissions }) => {
  if (!role) return null;

  const rolePermissionIds = role.permissions?.map(p => p.id) || [];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                  Role Details
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role Name</label>
                      <p className="text-gray-900 dark:text-white font-semibold">{role.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                      <p>
                        {role.is_system ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            System Role
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Custom Role
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Users with this role</label>
                      <p className="text-gray-900 dark:text-white font-semibold">{role.user_count}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Permissions</label>
                      <p className="text-gray-900 dark:text-white font-semibold">{role.permissions?.length || 0}</p>
                    </div>
                  </div>

                  {role.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                      <p className="text-gray-900 dark:text-white">{role.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Permissions</label>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      {Object.entries(groupedPermissions).map(([resource, perms]) => {
                        const rolePerms = perms.filter(p => rolePermissionIds.includes(p.id));
                        if (rolePerms.length === 0) return null;

                        return (
                          <div key={resource} className="mb-3 last:mb-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                              {resource.replace('_', ' ')}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 pl-4">
                              {rolePerms.map((perm) => (
                                <div key={perm.id} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                  <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                                  {perm.action}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      data-testid="close-view-modal-button"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, role }) => {
  if (!role) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <Dialog.Title className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
                    Delete Role
                  </Dialog.Title>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete the role <strong className="text-gray-900 dark:text-white">"{role.name}"</strong>?
                  </p>
                  {role.user_count > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      Warning: This role is currently assigned to {role.user_count} user(s).
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    This action cannot be undone.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    data-testid="cancel-delete-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    data-testid="confirm-delete-button"
                  >
                    Delete Role
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default RolesManagementPage;
