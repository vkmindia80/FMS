import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CubeIcon, CheckCircleIcon, LinkIcon, KeyIcon } from '@heroicons/react/24/outline';

const IntegrationsSettings = () => {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchIntegrations();
    // eslint-disable-next-line
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/integrations`, {
        headers: { 'Authorization': `Bearer ${getAccessToken()}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const integrationsList = [
    {
      id: 'plaid',
      name: 'Plaid',
      description: 'Connect your bank accounts and automatically import transactions',
      icon: '🏦',
      status: integrations?.plaid?.enabled ? 'connected' : 'available',
      connectedAccounts: integrations?.plaid?.connected_accounts || 0,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept payments and manage subscriptions',
      icon: '💳',
      status: integrations?.stripe?.configured ? 'connected' : 'available',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Sync data with QuickBooks accounting software',
      icon: '📊',
      status: integrations?.quickbooks?.enabled ? 'connected' : 'available',
      lastSynced: integrations?.quickbooks?.synced_at,
      color: 'from-green-500 to-emerald-600'
    },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Loading integrations...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="integrations-settings">
      {/* Connected Integrations */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <LinkIcon className="h-6 w-6 mr-2" />
            Connected Integrations
          </h2>
          <p className="mt-1 text-indigo-100">Manage third-party integrations and connections</p>
        </div>

        <div className="p-8">
          <div className="space-y-4">
            {integrationsList.map((integration) => (
              <div
                key={integration.id}
                className="group relative overflow-hidden bg-white dark:bg-gray-700/30 border-2 border-gray-200 dark:border-gray-600 rounded-2xl p-6 hover:border-primary-300 dark:hover:border-primary-600 transition-all hover:shadow-lg"
                data-testid={`integration-${integration.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-5 flex-1">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${integration.color} shadow-lg flex-shrink-0`}>
                      <span className="text-4xl">{integration.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{integration.name}</h3>
                        {integration.status === 'connected' && (
                          <span className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{integration.description}</p>
                      {integration.connectedAccounts > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          🔗 {integration.connectedAccounts} account(s) connected
                        </p>
                      )}
                      {integration.lastSynced && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          🔄 Last synced: {new Date(integration.lastSynced).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {integration.status === 'connected' ? (
                      <button className="px-5 py-2.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-500 transition-all" disabled>
                        Configure
                      </button>
                    ) : (
                      <button className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg" disabled>
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              ℹ️ Integration configuration is managed through the main Integrations page. Visit the Integrations section from the main navigation to configure these services.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <KeyIcon className="h-6 w-6 mr-2" />
            API Keys
          </h2>
          <p className="mt-1 text-orange-100">Manage API keys for programmatic access</p>
        </div>

        <div className="p-8">
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-6">
              <CubeIcon className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-2">No API keys configured yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create API keys to access your data programmatically</p>
            <button className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-medium cursor-not-allowed" disabled>
              Generate API Key (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <LinkIcon className="h-6 w-6 mr-2" />
            Webhooks
          </h2>
          <p className="mt-1 text-teal-100">Configure webhooks to receive real-time notifications</p>
        </div>

        <div className="p-8">
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-6">
              <LinkIcon className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-2">Webhook management coming soon</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Set up webhooks to get instant notifications about events</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsSettings;
