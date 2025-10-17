import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  RectangleStackIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  getCompanies,
  assignPlanToCompany
} from '../../services/rbac';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PlansManagementPage = () => {
  const [plans, setPlans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    features: [],
    menu_access: [],
    max_users: null,
    max_companies: 1,
    storage_gb: 10,
    is_active: true
  });
  
  const [featureInput, setFeatureInput] = useState('');
  const [assignCompanyId, setAssignCompanyId] = useState('');

  // Available menu items
  const availableMenus = [
    { name: 'dashboard', path: '/dashboard', label: 'Dashboard' },
    { name: 'transactions', path: '/transactions', label: 'Transactions' },
    { name: 'accounts', path: '/accounts', label: 'Accounts' },
    { name: 'documents', path: '/documents', label: 'Documents' },
    { name: 'reports', path: '/reports', label: 'Reports' },
    { name: 'banking', path: '/banking', label: 'Banking' },
    { name: 'payments', path: '/payments', label: 'Payments' },
    { name: 'receivables', path: '/receivables', label: 'Receivables' },
    { name: 'reconciliation', path: '/reconciliation', label: 'Reconciliation' },
    { name: 'integrations', path: '/integrations', label: 'Integrations' },
    { name: 'admin', path: '/admin', label: 'Admin Panel' },
    { name: 'settings', path: '/settings', label: 'Settings' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, companiesData] = await Promise.all([
        getPlans(),
        getCompanies().catch(() => [])
      ]);
      setPlans(plansData);
      setCompanies(companiesData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      if (!formData.name || !formData.display_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      await createPlan(formData);
      toast.success('Plan created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create plan');
    }
  };

  const handleUpdatePlan = async () => {
    try {
      if (!formData.display_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      const updateData = {
        display_name: formData.display_name,
        description: formData.description,
        price_monthly: formData.price_monthly,
        price_yearly: formData.price_yearly,
        features: formData.features,
        menu_access: formData.menu_access,
        max_users: formData.max_users,
        max_companies: formData.max_companies,
        storage_gb: formData.storage_gb,
        is_active: formData.is_active
      };

      await updatePlan(selectedPlan.id, updateData);
      toast.success('Plan updated successfully');
      setIsEditModalOpen(false);
      setSelectedPlan(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      await deletePlan(planId);
      toast.success('Plan deleted successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete plan');
    }
  };

  const handleAssignPlan = async () => {
    try {
      if (!assignCompanyId || !selectedPlan) {
        toast.error('Please select a company');
        return;
      }

      await assignPlanToCompany(assignCompanyId, selectedPlan.id);
      toast.success('Plan assigned to company successfully');
      setIsAssignModalOpen(false);
      setAssignCompanyId('');
      setSelectedPlan(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign plan');
    }
  };

  const openEditModal = async (plan) => {
    try {
      const planDetails = await getPlan(plan.id);
      setSelectedPlan(planDetails);
      setFormData({
        name: planDetails.name,
        display_name: planDetails.display_name,
        description: planDetails.description || '',
        price_monthly: planDetails.price_monthly,
        price_yearly: planDetails.price_yearly,
        features: planDetails.features || [],
        menu_access: planDetails.menu_access || [],
        max_users: planDetails.max_users,
        max_companies: planDetails.max_companies,
        storage_gb: planDetails.storage_gb,
        is_active: planDetails.is_active
      });
      setIsEditModalOpen(true);
    } catch (error) {
      toast.error('Failed to load plan details');
    }
  };

  const openAssignModal = (plan) => {
    setSelectedPlan(plan);
    setIsAssignModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      features: [],
      menu_access: [],
      max_users: null,
      max_companies: 1,
      storage_gb: 10,
      is_active: true
    });
    setFeatureInput('');
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()]
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const toggleMenuAccess = (menu) => {
    const existing = formData.menu_access.find(m => m.menu_name === menu.name);
    if (existing) {
      setFormData({
        ...formData,
        menu_access: formData.menu_access.filter(m => m.menu_name !== menu.name)
      });
    } else {
      setFormData({
        ...formData,
        menu_access: [...formData.menu_access, {
          menu_name: menu.name,
          menu_path: menu.path,
          is_enabled: true
        }]
      });
    }
  };

  const isMenuSelected = (menuName) => {
    return formData.menu_access.some(m => m.menu_name === menuName);
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
            <RectangleStackIcon className="h-8 w-8 mr-3 text-blue-600" />
            Plans Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage subscription plans and feature access control
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          data-testid="create-plan-button"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
            data-testid={`plan-card-${plan.id}`}
          >
            {/* Plan Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold">{plan.display_name}</h3>
                {plan.is_active ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <XCircleIcon className="h-6 w-6" />
                )}
              </div>
              <p className="text-blue-100 text-sm mb-4">{plan.description || 'No description'}</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold">${plan.price_monthly}</span>
                <span className="text-blue-100">/month</span>
              </div>
              <div className="text-blue-100 text-sm mt-1">
                or ${plan.price_yearly}/year
              </div>
            </div>

            {/* Plan Body */}
            <div className="p-6 space-y-4">
              {/* Features */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Features</h4>
                <ul className="space-y-1">
                  {plan.features.slice(0, 5).map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-sm text-gray-500 dark:text-gray-500 italic">
                      +{plan.features.length - 5} more features
                    </li>
                  )}
                </ul>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Users</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.max_users || '∞'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Companies</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.company_count}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Storage</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.storage_gb ? `${plan.storage_gb}GB` : '∞'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Menus</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.menu_access.length}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => openAssignModal(plan)}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
                  data-testid={`assign-plan-${plan.id}`}
                >
                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  Assign
                </button>
                <button
                  onClick={() => openEditModal(plan)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  data-testid={`edit-plan-${plan.id}`}
                >
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center"
                  data-testid={`delete-plan-${plan.id}`}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Plans</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{plans.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Plans</div>
          <div className="text-2xl font-bold text-green-600">{plans.filter(p => p.is_active).length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Subscribers</div>
          <div className="text-2xl font-bold text-blue-600">
            {plans.reduce((sum, plan) => sum + plan.company_count, 0)}
          </div>
        </div>
      </div>

      {/* Create/Edit Plan Modal */}
      <PlanFormModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedPlan(null);
          resetForm();
        }}
        onSubmit={isCreateModalOpen ? handleCreatePlan : handleUpdatePlan}
        formData={formData}
        setFormData={setFormData}
        featureInput={featureInput}
        setFeatureInput={setFeatureInput}
        addFeature={addFeature}
        removeFeature={removeFeature}
        toggleMenuAccess={toggleMenuAccess}
        isMenuSelected={isMenuSelected}
        availableMenus={availableMenus}
        title={isCreateModalOpen ? 'Create New Plan' : 'Edit Plan'}
        submitText={isCreateModalOpen ? 'Create Plan' : 'Update Plan'}
        isEdit={isEditModalOpen}
      />

      {/* Assign Plan Modal */}
      <AssignPlanModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedPlan(null);
          setAssignCompanyId('');
        }}
        onSubmit={handleAssignPlan}
        selectedPlan={selectedPlan}
        companies={companies}
        assignCompanyId={assignCompanyId}
        setAssignCompanyId={setAssignCompanyId}
      />
    </div>
  );
};

// Plan Form Modal Component
const PlanFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  featureInput,
  setFeatureInput,
  addFeature,
  removeFeature,
  toggleMenuAccess,
  isMenuSelected,
  availableMenus,
  title,
  submitText,
  isEdit
}) => {
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
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
                        Plan Name * {isEdit && <span className="text-xs text-gray-500">(Cannot be changed)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="basic"
                        disabled={isEdit}
                        data-testid="plan-name-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Basic Plan"
                        data-testid="plan-display-name-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Plan description..."
                      data-testid="plan-description-input"
                    />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Monthly Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price_monthly}
                        onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="plan-price-monthly-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Yearly Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price_yearly}
                        onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="plan-price-yearly-input"
                      />
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Users (blank = unlimited)
                      </label>
                      <input
                        type="number"
                        value={formData.max_users || ''}
                        onChange={(e) => setFormData({ ...formData, max_users: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="plan-max-users-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Companies
                      </label>
                      <input
                        type="number"
                        value={formData.max_companies}
                        onChange={(e) => setFormData({ ...formData, max_companies: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="plan-max-companies-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Storage (GB) (blank = unlimited)
                      </label>
                      <input
                        type="number"
                        value={formData.storage_gb || ''}
                        onChange={(e) => setFormData({ ...formData, storage_gb: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="plan-storage-input"
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Features
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Add a feature..."
                        data-testid="plan-feature-input"
                      />
                      <button
                        onClick={addFeature}
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        data-testid="add-feature-button"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {formData.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded"
                        >
                          <span className="text-sm text-gray-900 dark:text-white">{feature}</span>
                          <button
                            onClick={() => removeFeature(index)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`remove-feature-${index}`}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Menu Access */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Menu Access (Select menus to enable)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableMenus.map((menu) => (
                        <label
                          key={menu.name}
                          className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={isMenuSelected(menu.name)}
                            onChange={() => toggleMenuAccess(menu)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            data-testid={`menu-checkbox-${menu.name}`}
                          />
                          <span className="text-sm text-gray-900 dark:text-white">{menu.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      data-testid="plan-active-checkbox"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Active Plan (Users can subscribe)
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      data-testid="cancel-plan-form-button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      data-testid="submit-plan-form-button"
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

// Assign Plan Modal Component
const AssignPlanModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedPlan,
  companies,
  assignCompanyId,
  setAssignCompanyId
}) => {
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
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                  Assign Plan to Company
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                {selectedPlan && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Selected Plan</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedPlan.display_name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ${selectedPlan.price_monthly}/month
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Company *
                      </label>
                      <select
                        value={assignCompanyId}
                        onChange={(e) => setAssignCompanyId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        data-testid="assign-company-select"
                      >
                        <option value="">Select a company...</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        data-testid="cancel-assign-button"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        data-testid="submit-assign-button"
                      >
                        Assign Plan
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PlansManagementPage;
