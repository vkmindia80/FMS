import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BuildingOfficeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
    // eslint-disable-next-line
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
        setTimeout(() => setMessage(null), 5000);
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
        setTimeout(() => setMessage(null), 5000);
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Loading company information...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="company-settings">
      {!isAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            ℹ️ Only company admins can update company settings. Contact your administrator to make changes.
          </p>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl border-2 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
          <div className="flex items-center">
            {message.type === 'success' && <CheckCircleIcon className="h-5 w-5 mr-2" />}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Company Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BuildingOfficeIcon className="h-6 w-6 mr-2" />
            Company Information
          </h2>
          <p className="mt-1 text-blue-100">Basic information about your company</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleInfoSubmit} className="space-y-8">
            {/* Company Name - Full Width */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Company Name *</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                disabled={!isAdmin}
                required
                placeholder="Enter company name"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Company Type</label>
                <select
                  value={company.type}
                  onChange={(e) => setCompany({ ...company, type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tax ID / EIN</label>
                <input
                  type="text"
                  value={company.tax_id}
                  onChange={(e) => setCompany({ ...company, tax_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  disabled={!isAdmin}
                  placeholder="XX-XXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Industry</label>
                <input
                  type="text"
                  value={company.industry}
                  onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  disabled={!isAdmin}
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Phone</label>
                <input
                  type="tel"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  disabled={!isAdmin}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Website</label>
                <input
                  type="url"
                  value={company.website}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  disabled={!isAdmin}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Address</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Street Address</label>
                  <input
                    type="text"
                    value={company.address.street}
                    onChange={(e) => setCompany({ ...company, address: { ...company.address, street: e.target.value } })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    disabled={!isAdmin}
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">City</label>
                    <input
                      type="text"
                      value={company.address.city}
                      onChange={(e) => setCompany({ ...company, address: { ...company.address, city: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                      disabled={!isAdmin}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">State / Province</label>
                    <input
                      type="text"
                      value={company.address.state}
                      onChange={(e) => setCompany({ ...company, address: { ...company.address, state: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                      disabled={!isAdmin}
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Postal Code</label>
                    <input
                      type="text"
                      value={company.address.postal_code}
                      onChange={(e) => setCompany({ ...company, address: { ...company.address, postal_code: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                      disabled={!isAdmin}
                      placeholder="94102"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Country</label>
                    <input
                      type="text"
                      value={company.address.country}
                      onChange={(e) => setCompany({ ...company, address: { ...company.address, country: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
                      disabled={!isAdmin}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end space-x-3 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                <button type="button" onClick={fetchCompanyInfo} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all transform hover:scale-105" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-105 shadow-lg shadow-primary-500/50 disabled:opacity-50" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Information'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Company Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Company Settings</h2>
          <p className="mt-1 text-indigo-100">Configure financial and operational settings</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSettingsSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Base Currency</label>
                <select value={settings.base_currency} onChange={(e) => setSettings({ ...settings, base_currency: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" disabled={!isAdmin}>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Fiscal Year Start</label>
                <select value={settings.fiscal_year_start} onChange={(e) => setSettings({ ...settings, fiscal_year_start: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" disabled={!isAdmin}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Date Format</label>
                <select value={settings.date_format} onChange={(e) => setSettings({ ...settings, date_format: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" disabled={!isAdmin}>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Timezone</label>
                <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" disabled={!isAdmin}>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tax Name</label>
                <input type="text" value={settings.tax_name} onChange={(e) => setSettings({ ...settings, tax_name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400" disabled={!isAdmin} placeholder="e.g., VAT, GST, Sales Tax" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Default Tax Rate (%)</label>
                <input type="number" step="0.01" min="0" max="100" value={settings.tax_rate} onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" disabled={!isAdmin} />
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <input type="checkbox" id="multi-currency" checked={settings.multi_currency_enabled} onChange={(e) => setSettings({ ...settings, multi_currency_enabled: e.target.checked })} className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" disabled={!isAdmin} />
              <label htmlFor="multi-currency" className="ml-3 text-sm font-semibold text-gray-900 dark:text-white">Enable multi-currency support</label>
            </div>

            {isAdmin && (
              <div className="flex justify-end space-x-3 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                <button type="button" onClick={fetchCompanyInfo} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all transform hover:scale-105" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-105 shadow-lg shadow-primary-500/50 disabled:opacity-50" disabled={saving}>
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
