import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CubeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const IntegrationsSettings = () => {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchIntegrations();
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
      connectedAccounts: integrations?.plaid?.connected_accounts || 0
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept payments and manage subscriptions',
      icon: '💳',
      status: integrations?.stripe?.configured ? 'connected' : 'available',
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Sync data with QuickBooks accounting software',
      icon: '📊',
      status: integrations?.quickbooks?.enabled ? 'connected' : 'available',
      lastSynced: integrations?.quickbooks?.synced_at
    },
  ];

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading integrations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="integrations-settings">
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Integrations</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage third-party integrations and connections
          </p>
        </div>

        <div className="card-body">
          <div className="space-y-4">
            {integrationsList.map((integration) => (
              <div
                key={integration.id}
                className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                data-testid={`integration-${integration.id}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{integration.icon}</div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      {integration.name}
                      {integration.status === 'connected' && (
                        <CheckCircleIcon className="h-4 w-4 ml-2 text-green-500" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {integration.description}
                    </p>
                    {integration.connectedAccounts > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {integration.connectedAccounts} account(s) connected
                      </p>
                    )}
                    {integration.lastSynced && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Last synced: {new Date(integration.lastSynced).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {integration.status === 'connected' ? (
                    <button className="btn-secondary text-sm" disabled>
                      Configure
                    </button>
                  ) : (
                    <button className="btn-primary text-sm" disabled>
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ Integration configuration is managed through the main Integrations page. Visit the Integrations section from the main navigation to configure these services.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage API keys for programmatic access
          </p>
        </div>

        <div className="card-body">
          <div className="text-center py-8">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              No API keys configured yet
            </p>
            <button className="mt-4 btn-secondary text-sm" disabled>
              Generate API Key (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Webhooks</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure webhooks to receive real-time notifications
          </p>
        </div>

        <div className="card-body">
          <div className="text-center py-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Webhook management coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsSettings;
