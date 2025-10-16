import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BuildingOfficeIcon, GlobeAltIcon, PhoneIcon } from '@heroicons/react/24/outline';

const CompanySettings = () => {
  const { getAccessToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [company, setCompany] = useState({
    name: '',
    type: '',
    industry: '',
    phone: '',
    website: '',
    tax_id: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    }
  });

  const [settings, setSettings] = useState({
    base_currency: 'USD',
    multi_currency_enabled: false,
    fiscal_year_start: 'January',
    date_format: 'MM/DD/YYYY',
    number_format: 'en-US',
    timezone: 'UTC',
    tax_rate: 0,
    tax_name: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  const isAdmin = user?.role === 'admin' || user?.role === 'business' || user?.role === 'corporate';

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/company`, {
        headers: { 'Authorization': `Bearer ${getAccessToken()}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCompany({
          name: data.name || '',
          type: data.type || '',
          industry: data.industry || '',
          phone: data.phone || '',
          website: data.website || '',
          tax_id: data.tax_id || '',
          address: data.address || { street: '', city: '', state: '', postal_code: '', country: '' }
        });
        setSettings({
          base_currency: data.settings?.base_currency || 'USD',
          multi_currency_enabled: data.settings?.multi_currency_enabled || false,
          fiscal_year_start: data.settings?.fiscal_year_start || 'January',
          date_format: data.settings?.date_format || 'MM/DD/YYYY',
          number_format: data.settings?.number_format || 'en-US',
          timezone: data.settings?.timezone || 'UTC',
          tax_rate: data.settings?.tax_rate || 0,
          tax_name: data.settings?.tax_name || ''
        });
      }
    } catch (error) {
      console.error('Error loading company info:', error);
      setMessage({ type: 'error', text: 'Failed to load company information' });
    } finally {
      setLoading(false);
    }
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setMessage({ type: 'error', text: 'Only admins can update company information' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/company/info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(company)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Company information updated successfully!' });
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update company info');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setMessage({ type: 'error', text: 'Only admins can update company settings' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/company/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Company settings updated successfully!' });
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading company information...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="company-settings">
      {!isAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ℹ️ Only company admins can update company settings. Contact your administrator to make changes.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Company Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Company Information</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Basic information about your company
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handleInfoSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Type
                </label>
                <select
                  value={company.type}
                  onChange={(e) => setCompany({ ...company, type: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                >
                  <option value="">Select type</option>
                  <option value="individual">Individual</option>
                  <option value="small_business">Small Business</option>
                  <option value="corporation">Corporation</option>
                  <option value="nonprofit">Nonprofit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={company.industry}
                  onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax ID / EIN
                </label>
                <input
                  type="text"
                  value={company.tax_id}
                  onChange={(e) => setCompany({ ...company, tax_id: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={company.website}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                  placeholder="https://"
                />
              </div>
            </div>

            {/* Address */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={company.address.street}
                    onChange={(e) => setCompany({ ...company, address: { ...company.address, street: e.target.value } })}
                    className="input"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    value={company.address.city}
                    onChange={(e) => setCompany({ ...company, address: { ...company.address, city: e.target.value } })}
                    className="input"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    value={company.address.state}
                    onChange={(e) => setCompany({ ...company, address: { ...company.address, state: e.target.value } })}
                    className="input"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={company.address.postal_code}
                    onChange={(e) => setCompany({ ...company, address: { ...company.address, postal_code: e.target.value } })}
                    className="input"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                  <input
                    type="text"
                    value={company.address.country}
                    onChange={(e) => setCompany({ ...company, address: { ...company.address, country: e.target.value } })}
                    className="input"
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={fetchCompanyInfo} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Information'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Company Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Company Settings</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure financial and operational settings
          </p>
        </div>

        <div className="card-body">
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base Currency
                </label>
                <select
                  value={settings.base_currency}
                  onChange={(e) => setSettings({ ...settings, base_currency: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fiscal Year Start
                </label>
                <select
                  value={settings.fiscal_year_start}
                  onChange={(e) => setSettings({ ...settings, fiscal_year_start: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Format
                </label>
                <select
                  value={settings.date_format}
                  onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax Name
                </label>
                <input
                  type="text"
                  value={settings.tax_name}
                  onChange={(e) => setSettings({ ...settings, tax_name: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                  placeholder="e.g., VAT, GST, Sales Tax"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.tax_rate}
                  onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="input"
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.multi_currency_enabled}
                  onChange={(e) => setSettings({ ...settings, multi_currency_enabled: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                  disabled={!isAdmin}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable multi-currency support</span>
              </label>
            </div>

            {isAdmin && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={fetchCompanyInfo} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
