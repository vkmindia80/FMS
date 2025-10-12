import React, { useState, useEffect } from 'react';
import {
  CreditCardIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const GATEWAY_TYPES = [
  { value: 'stripe', label: 'Stripe', description: 'Popular payment processor' },
  { value: 'paypal', label: 'PayPal', description: 'PayPal checkout integration' },
  { value: 'square', label: 'Square', description: 'Square payment processing' },
  { value: 'custom', label: 'Custom Gateway', description: 'Your own payment gateway' },
];

const GATEWAY_FIELD_TEMPLATES = {
  stripe: [
    { name: 'api_key', label: 'API Key', type: 'password', placeholder: 'sk_test_...', required: true },
    { name: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', required: false },
    { name: 'publishable_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_test_...', required: false },
  ],
  paypal: [
    { name: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Your PayPal Client ID', required: true },
    { name: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Your PayPal Secret', required: true },
    { name: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'], required: true },
  ],
  square: [
    { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Your Square Access Token', required: true },
    { name: 'location_id', label: 'Location ID', type: 'text', placeholder: 'Square Location ID', required: false },
    { name: 'environment', label: 'Environment', type: 'select', options: ['sandbox', 'production'], required: true },
  ],
  custom: [],
};

const PaymentGatewayManagement = ({ integrationStatus, onUpdate }) => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [testingGateway, setTestingGateway] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});

  const [gatewayForm, setGatewayForm] = useState({
    gateway_name: '',
    gateway_type: 'stripe',
    enabled: false,
    description: '',
    configuration: {},
    customFields: [],
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.ENV?.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/integrations/payment/gateways`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch gateways');

      const data = await response.json();
      setGateways(Array.isArray(data.gateways) ? data.gateways : []);
    } catch (err) {
      console.error('Error fetching gateways:', err);
      setGateways([]);
      toast.error('Failed to load payment gateways');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGateway = () => {
    setEditingGateway(null);
    setGatewayForm({
      gateway_name: '',
      gateway_type: 'stripe',
      enabled: false,
      description: '',
      configuration: {},
      customFields: [],
    });
    setShowModal(true);
  };

  const handleEditGateway = (gateway) => {
    setEditingGateway(gateway);
    setGatewayForm({
      gateway_name: gateway.gateway_name,
      gateway_type: gateway.gateway_type,
      enabled: gateway.enabled,
      description: gateway.description || '',
      configuration: gateway.configuration || {},
      customFields: gateway.gateway_type === 'custom' ? 
        Object.entries(gateway.configuration || {}).map(([key, value]) => ({ key, value })) : [],
    });
    setShowModal(true);
  };

  const handleDeleteGateway = async (gatewayId) => {
    if (!window.confirm('Are you sure you want to delete this gateway?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/payment/gateways/${gatewayId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete gateway');

      toast.success('Gateway deleted successfully');
      fetchGateways();
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to delete gateway');
    }
  };

  const handleToggleGateway = async (gatewayId, currentStatus) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/payment/gateways/${gatewayId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        },
        body: JSON.stringify({ enabled: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to toggle gateway');

      toast.success(`Gateway ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      fetchGateways();
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to toggle gateway');
    }
  };

  const handleTestConnection = async (gatewayId) => {
    try {
      setTestingGateway(gatewayId);
      const response = await fetch(`${BACKEND_URL}/api/integrations/payment/gateways/${gatewayId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Connection test successful');
      } else {
        toast.error(data.message || 'Connection test failed');
      }
    } catch (err) {
      toast.error('Failed to test connection');
    } finally {
      setTestingGateway(null);
    }
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build configuration from form
      let configuration = {};
      
      if (gatewayForm.gateway_type === 'custom') {
        // For custom gateways, use custom fields
        gatewayForm.customFields.forEach(field => {
          if (field.key && field.value) {
            configuration[field.key] = field.value;
          }
        });
      } else {
        // For predefined gateways, use configuration from form
        configuration = gatewayForm.configuration;
      }

      const payload = {
        gateway_name: gatewayForm.gateway_name,
        gateway_type: gatewayForm.gateway_type,
        enabled: gatewayForm.enabled,
        description: gatewayForm.description,
        configuration: configuration,
      };

      const url = editingGateway
        ? `${BACKEND_URL}/api/integrations/payment/gateways/${editingGateway.gateway_id}`
        : `${BACKEND_URL}/api/integrations/payment/gateways`;

      const method = editingGateway ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to save gateway');
      }

      toast.success(editingGateway ? 'Gateway updated successfully' : 'Gateway created successfully');
      setShowModal(false);
      fetchGateways();
      onUpdate?.();
    } catch (err) {
      toast.error(err.message || 'Failed to save gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (fieldName, value) => {
    setGatewayForm(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [fieldName]: value
      }
    }));
  };

  const addCustomField = () => {
    setGatewayForm(prev => ({
      ...prev,
      customFields: [...prev.customFields, { key: '', value: '' }]
    }));
  };

  const updateCustomField = (index, field, value) => {
    setGatewayForm(prev => ({
      ...prev,
      customFields: prev.customFields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }));
  };

  const removeCustomField = (index) => {
    setGatewayForm(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const renderConfigurationFields = () => {
    const fields = GATEWAY_FIELD_TEMPLATES[gatewayForm.gateway_type] || [];

    if (gatewayForm.gateway_type === 'custom') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Configuration Fields
            </label>
            <button
              type="button"
              onClick={addCustomField}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              + Add Field
            </button>
          </div>
          {gatewayForm.customFields.map((field, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="Field name (e.g., api_key)"
                value={field.key}
                onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Value"
                value={field.value}
                onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeCustomField(index)}
                className="px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
          {gatewayForm.customFields.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No fields added yet. Click "+ Add Field" to add configuration fields.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                value={gatewayForm.configuration[field.name] || field.options[0]}
                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required={field.required}
              >
                {field.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <input
                  type={field.type === 'password' && !showPasswords[field.name] ? 'password' : 'text'}
                  value={gatewayForm.configuration[field.name] || ''}
                  onChange={(e) => handleConfigChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                  required={field.required}
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.name)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showPasswords[field.name] ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Gateway Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure and manage payment gateways with API credentials
          </p>
        </div>
        <button
          onClick={handleCreateGateway}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-testid="add-gateway-button"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Gateway
        </button>
      </div>

      {/* Gateways List */}
      {loading && gateways.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      ) : gateways.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payment gateways configured</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding your first payment gateway.
          </p>
          <button
            onClick={handleCreateGateway}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Gateway
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateways.map((gateway) => (
            <div
              key={gateway.gateway_id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-shadow"
              data-testid={`gateway-card-${gateway.gateway_id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    gateway.enabled ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {gateway.enabled ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{gateway.gateway_name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{gateway.gateway_type}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gateway.enabled}
                    onChange={() => handleToggleGateway(gateway.gateway_id, gateway.enabled)}
                    className="sr-only peer"
                    data-testid={`gateway-toggle-${gateway.gateway_id}`}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {gateway.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{gateway.description}</p>
              )}

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleTestConnection(gateway.gateway_id)}
                  disabled={testingGateway === gateway.gateway_id || !gateway.enabled}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid={`gateway-test-${gateway.gateway_id}`}
                >
                  {testingGateway === gateway.gateway_id ? 'Testing...' : 'Test'}
                </button>
                <button
                  onClick={() => handleEditGateway(gateway)}
                  className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  data-testid={`gateway-edit-${gateway.gateway_id}`}
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteGateway(gateway.gateway_id)}
                  className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400"
                  data-testid={`gateway-delete-${gateway.gateway_id}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gateway Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
            </h3>
            <form onSubmit={handleSaveGateway}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gateway Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={gatewayForm.gateway_name}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, gateway_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., My Stripe Account"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gateway Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gatewayForm.gateway_type}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, gateway_type: e.target.value, configuration: {} })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={!!editingGateway}
                  >
                    {GATEWAY_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={gatewayForm.description}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Optional description..."
                    rows="2"
                  />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">API Configuration</h4>
                  {renderConfigurationFields()}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableGateway"
                    checked={gatewayForm.enabled}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="enableGateway" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                    Enable this gateway immediately
                  </label>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <CogIcon className="w-4 h-4 inline mr-1" />
                    Credentials are stored securely. Sensitive fields will be masked after saving.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  data-testid="save-gateway-button"
                >
                  {loading ? 'Saving...' : (editingGateway ? 'Update Gateway' : 'Create Gateway')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentGatewayManagement;
