import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import CurrencySelector from '../common/CurrencySelector';

const AccountModal = ({ isOpen, onClose, onSave, account, accountTypes }) => {
  const [formData, setFormData] = useState({
    name: '',
    account_type: '',
    account_number: '',
    description: '',
    opening_balance: '0',
    currency_code: 'USD',
    is_active: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      // Edit mode - populate form with existing account data
      setFormData({
        name: account.name || '',
        account_type: account.account_type || '',
        account_number: account.account_number || '',
        description: account.description || '',
        opening_balance: account.opening_balance?.toString() || '0',
        currency_code: account.currency_code || 'USD',
        is_active: account.is_active !== undefined ? account.is_active : true
      });
    } else {
      // Create mode - reset form
      setFormData({
        name: '',
        account_type: '',
        account_number: '',
        description: '',
        opening_balance: '0',
        currency_code: 'USD',
        is_active: true
      });
    }
    setErrors({});
  }, [account, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Account name is required';
    }

    if (!formData.account_type) {
      newErrors.account_type = 'Account type is required';
    }

    if (formData.opening_balance && isNaN(parseFloat(formData.opening_balance))) {
      newErrors.opening_balance = 'Opening balance must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance) || 0
      };

      await onSave(submitData);
      onClose();
    } catch (error) {
      setErrors({
        submit: error.response?.data?.detail || 'Failed to save account'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {account ? 'Edit Account' : 'Create New Account'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., Office Supplies"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label htmlFor="account_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type *
                </label>
                <select
                  id="account_type"
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.account_type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select account type...</option>
                  {Object.entries(accountTypes).map(([category, types]) => (
                    <optgroup key={category} label={category}>
                      {types.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.account_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.account_type}</p>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  id="account_number"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000"
                />
              </div>

              {/* Opening Balance - Only for new accounts */}
              {!account && (
                <div>
                  <label htmlFor="opening_balance" className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="opening_balance"
                      name="opening_balance"
                      value={formData.opening_balance}
                      onChange={handleChange}
                      step="0.01"
                      className={`w-full pl-7 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.opening_balance ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.opening_balance && (
                    <p className="mt-1 text-sm text-red-600">{errors.opening_balance}</p>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description..."
                />
              </div>

              {/* Active Status - Only for edit mode */}
              {account && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Account is active
                  </label>
                </div>
              )}

              {/* Submit Error */}
              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{errors.submit}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (account ? 'Update Account' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
