import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingOfficeIcon,
  UserIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TenantManagementPage = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'company',
    base_currency: 'USD',
    fiscal_year_start: '01-01',
    date_format: 'MM/DD/YYYY',
    number_format: 'US',
    timezone: 'UTC',
    admin_email: '',
    admin_full_name: '',
    admin_password: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllCompanies();
      setTenants(data);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Tenant name is required';
    }

    if (formData.admin_email || formData.admin_password) {
      if (!formData.admin_email) {
        errors.admin_email = 'Admin email is required when creating admin user';
      } else if (!/\S+@\S+\.\S+/.test(formData.admin_email)) {
        errors.admin_email = 'Invalid email address';
      }

      if (!formData.admin_password) {
        errors.admin_password = 'Admin password is required when creating admin user';
      } else if (formData.admin_password.length < 8) {
        errors.admin_password = 'Password must be at least 8 characters';
      }

      if (!formData.admin_full_name && formData.admin_email) {
        errors.admin_full_name = 'Admin name is required when creating admin user';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      const result = await adminAPI.createTenant(formData);
      
      toast.success(
        <div>
          <div className="font-semibold">Tenant created successfully!</div>
          {result.admin_email && (
            <div className="text-sm mt-1">Admin user: {result.admin_email}</div>
          )}
        </div>
      );

      // Reset form and reload tenants
      setFormData({
        name: '',
        type: 'company',
        base_currency: 'USD',
        fiscal_year_start: '01-01',
        date_format: 'MM/DD/YYYY',
        number_format: 'US',
        timezone: 'UTC',
        admin_email: '',
        admin_full_name: '',
        admin_password: '',
      });
      setShowCreateModal(false);
      loadTenants();
    } catch (error) {
      console.error('Failed to create tenant:', error);
      toast.error(error.response?.data?.detail || 'Failed to create tenant');
    } finally {
      setCreating(false);
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && tenant.is_active) ||
      (filterActive === 'inactive' && !tenant.is_active);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tenant-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tenant Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage companies and individual tenants
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
          data-testid="create-tenant-button"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Tenant
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="search-tenants-input"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="filter-tenants-select"
            >
              <option value="all">All Tenants</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <motion.div
            key={tenant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6"
            data-testid={`tenant-card-${tenant.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  {tenant.type === 'individual' ? (
                    <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {tenant.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {tenant.type}
                  </span>
                </div>
              </div>
              {tenant.is_active ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                  Inactive
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Users:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tenant.user_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Currency:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tenant.settings.base_currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Created:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No tenants found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'Create your first tenant to get started'}
          </p>
        </div>
      )}

      {/* Create Tenant Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              {/* Background overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                onClick={() => setShowCreateModal(false)}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl"
                data-testid="create-tenant-modal"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">
                      Create New Tenant
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateTenant} className="space-y-6">
                  {/* Tenant Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tenant Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'company' })}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          formData.type === 'company'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                        data-testid="tenant-type-company"
                      >
                        <BuildingOfficeIcon className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                        <div className="font-medium text-gray-900 dark:text-white">Company</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Business organization
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'individual' })}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          formData.type === 'individual'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                        data-testid="tenant-type-individual"
                      >
                        <UserIcon className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                        <div className="font-medium text-gray-900 dark:text-white">Individual</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Personal account
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Tenant Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {formData.type === 'individual' ? 'Full Name' : 'Company Name'} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={formData.type === 'individual' ? 'John Doe' : 'Acme Corporation'}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      data-testid="tenant-name-input"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Settings Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Base Currency
                      </label>
                      <select
                        name="base_currency"
                        value={formData.base_currency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="base-currency-select"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Timezone
                      </label>
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="timezone-select"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                      </select>
                    </div>
                  </div>

                  {/* Admin User Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Admin User (Optional)
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Create an admin user for this tenant. Leave empty to skip.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Admin Email
                        </label>
                        <input
                          type="email"
                          name="admin_email"
                          value={formData.admin_email}
                          onChange={handleInputChange}
                          placeholder="admin@example.com"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                            formErrors.admin_email
                              ? 'border-red-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          data-testid="admin-email-input"
                        />
                        {formErrors.admin_email && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.admin_email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Admin Full Name
                        </label>
                        <input
                          type="text"
                          name="admin_full_name"
                          value={formData.admin_full_name}
                          onChange={handleInputChange}
                          placeholder="Admin Name"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                            formErrors.admin_full_name
                              ? 'border-red-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          data-testid="admin-fullname-input"
                        />
                        {formErrors.admin_full_name && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.admin_full_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Admin Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="admin_password"
                            value={formData.admin_password}
                            onChange={handleInputChange}
                            placeholder="Minimum 8 characters"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-10 ${
                              formErrors.admin_password
                                ? 'border-red-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                            data-testid="admin-password-input"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {formErrors.admin_password && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.admin_password}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="submit-create-tenant"
                    >
                      {creating ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        'Create Tenant'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TenantManagementPage;
