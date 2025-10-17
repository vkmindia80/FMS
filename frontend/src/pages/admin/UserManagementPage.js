import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  Squares2X2Icon,
  XMarkIcon,
  EyeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  getCompanies,
  getRoles,
  assignRolesToUser,
  getUserRoles
} from '../../services/rbac';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'individual',
    company_id: '',
    is_system_user: false,
    company_ids: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, companiesData, rolesData] = await Promise.all([
        getUsers(),
        getCompanies().catch(() => []),
        getRoles()
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
      setRoles(rolesData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.email || !formData.password || !formData.full_name || !formData.company_id) {
        toast.error('Please fill in all required fields');
        return;
      }

      const userData = {
        ...formData,
        company_ids: formData.is_system_user ? formData.company_ids : []
      };

      await createUser(userData);
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (!formData.email || !formData.full_name || !formData.company_id) {
        toast.error('Please fill in all required fields');
        return;
      }

      const userData = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        company_id: formData.company_id,
        is_system_user: formData.is_system_user,
        company_ids: formData.is_system_user ? formData.company_ids : []
      };

      await updateUser(selectedUser.id, userData);
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to disable this user?')) {
      return;
    }

    try {
      await deactivateUser(userId);
      toast.success('User disabled successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to disable user');
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      if (user.is_active) {
        await deactivateUser(user.id);
        toast.success('User deactivated');
      } else {
        await activateUser(user.id);
        toast.success('User activated');
      }
      loadData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      company_id: user.company_id,
      is_system_user: user.is_system_user || false,
      company_ids: user.company_ids || []
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'individual',
      company_id: '',
      is_system_user: false,
      company_ids: []
    });
  };

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesStatus;
  });

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
            <UserGroupIcon className="h-8 w-8 mr-3 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage users, roles, and permissions across your organization
          </p>
        </div>
        <button
          onClick={() => {
            console.log('Create User button clicked');
            setIsCreateModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          data-testid="create-user-button"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create User
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                data-testid="user-search-input"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="status-filter"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

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
      </div>

      {/* Users Display */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              data-testid={`user-card-${user.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user.full_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="flex items-center">
                  {user.is_active ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500" title="Active" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-500" title="Inactive" />
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{user.company_name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                    {user.role}
                  </span>
                  {user.is_system_user && (
                    <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-medium">
                      System User
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => openViewModal(user)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  data-testid={`view-user-${user.id}`}
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => openEditModal(user)}
                  className="text-sm text-gray-600 hover:text-gray-700 flex items-center"
                  data-testid={`edit-user-${user.id}`}
                >
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleUserStatus(user)}
                  className={`text-sm flex items-center ${user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                  data-testid={`toggle-status-${user.id}`}
                >
                  {user.is_active ? (
                    <>
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Enable
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="users-table">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    data-testid={`user-row-${user.id}`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {user.company_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                          {user.role}
                        </span>
                        {user.is_system_user && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-medium">
                            System
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => openViewModal(user)}
                        className="text-blue-600 hover:text-blue-700"
                        data-testid={`view-user-table-${user.id}`}
                      >
                        <EyeIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-gray-600 hover:text-gray-700"
                        data-testid={`edit-user-table-${user.id}`}
                      >
                        <PencilSquareIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        className={user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        data-testid={`toggle-status-table-${user.id}`}
                      >
                        {user.is_active ? (
                          <XCircleIcon className="h-5 w-5 inline" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 inline" />
                        )}
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
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
          <div className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Inactive Users</div>
          <div className="text-2xl font-bold text-red-600">{users.filter(u => !u.is_active).length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">System Users</div>
          <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.is_system_user).length}</div>
        </div>
      </div>

      {/* Create User Modal */}
      <UserFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        onSubmit={handleCreateUser}
        formData={formData}
        setFormData={setFormData}
        companies={companies}
        roles={roles}
        title="Create New User"
        submitText="Create User"
        isEdit={false}
      />

      {/* Edit User Modal */}
      <UserFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          resetForm();
        }}
        onSubmit={handleUpdateUser}
        formData={formData}
        setFormData={setFormData}
        companies={companies}
        roles={roles}
        title="Edit User"
        submitText="Update User"
        isEdit={true}
      />

      {/* View User Modal */}
      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        companies={companies}
      />
    </div>
  );
};

// User Form Modal Component
const UserFormModal = ({ isOpen, onClose, onSubmit, formData, setFormData, companies, roles, title, submitText, isEdit }) => {
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                  {title}
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="John Doe"
                        data-testid="user-full-name-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="john@company.com"
                        data-testid="user-email-input"
                      />
                    </div>
                  </div>

                  {!isEdit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="••••••••"
                        data-testid="user-password-input"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role *
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="user-role-select"
                      >
                        <option value="individual">Individual</option>
                        <option value="business">Business</option>
                        <option value="corporate">Corporate</option>
                        <option value="auditor">Auditor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Primary Company *
                      </label>
                      <select
                        value={formData.company_id}
                        onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="user-company-select"
                      >
                        <option value="">Select Company</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="is_system_user"
                        checked={formData.is_system_user}
                        onChange={(e) => setFormData({ ...formData, is_system_user: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        data-testid="system-user-checkbox"
                      />
                      <label htmlFor="is_system_user" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        System User (Can access multiple companies)
                      </label>
                    </div>

                    {formData.is_system_user && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Additional Companies
                        </label>
                        <select
                          multiple
                          value={formData.company_ids}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            setFormData({ ...formData, company_ids: selected });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          size="5"
                          data-testid="additional-companies-select"
                        >
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Hold Ctrl/Cmd to select multiple companies
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      data-testid="cancel-user-form-button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      data-testid="submit-user-form-button"
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

// View User Modal Component
const ViewUserModal = ({ isOpen, onClose, user, companies }) => {
  if (!user) return null;

  const company = companies.find(c => c.id === user.company_id);

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                  User Details
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                      <p className="text-gray-900 dark:text-white">{user.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                      <p className="text-gray-900 dark:text-white capitalize">{user.role}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                      <p className="text-gray-900 dark:text-white">
                        {user.is_active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Company</label>
                      <p className="text-gray-900 dark:text-white">{user.company_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User Type</label>
                      <p className="text-gray-900 dark:text-white">
                        {user.is_system_user ? 'System User' : 'Regular User'}
                      </p>
                    </div>
                  </div>

                  {user.is_system_user && user.company_ids && user.company_ids.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Additional Companies</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.company_ids.map((companyId) => {
                          const comp = companies.find(c => c.id === companyId);
                          return comp ? (
                            <span
                              key={companyId}
                              className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                            >
                              {comp.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500 dark:text-gray-400">Created At</label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {user.last_login && (
                        <div>
                          <label className="text-gray-500 dark:text-gray-400">Last Login</label>
                          <p className="text-gray-900 dark:text-white">
                            {new Date(user.last_login).toLocaleDateString()}
                          </p>
                        </div>
                      )}
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

export default UserManagementPage;
