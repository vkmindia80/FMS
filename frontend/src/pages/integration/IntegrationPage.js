import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import {
  EnvelopeIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import EmailConfiguration from './EmailConfiguration';
import ReportScheduling from './ReportScheduling';
import BankingIntegration from './BankingIntegration';
import PaymentIntegration from './PaymentIntegration';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const IntegrationPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [integrationStatus, setIntegrationStatus] = useState({
    email_enabled: false,
    banking_enabled: false,
    payment_enabled: false,
  });
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      name: 'Email Configuration',
      icon: EnvelopeIcon,
      description: 'Configure SMTP and email delivery settings',
      color: 'blue',
    },
    {
      name: 'Report Scheduling',
      icon: CalendarDaysIcon,
      description: 'Schedule automated report delivery',
      color: 'purple',
    },
    {
      name: 'Banking Integration',
      icon: BuildingLibraryIcon,
      description: 'Connect bank accounts and sync transactions',
      color: 'green',
    },
    {
      name: 'Payment Integration',
      icon: CreditCardIcon,
      description: 'Configure payment processors',
      color: 'orange',
    },
  ];

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/integrations/status');
      setIntegrationStatus(response.data);
    } catch (error) {
      console.error('Error fetching integration status:', error);
      toast.error('Failed to load integration status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (enabled) => {
    return enabled ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <XCircleIcon className="w-4 h-4 mr-1" />
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integration Center</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Connect and configure external services for your finance management system
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {integrationStatus.email_enabled ? 'Connected' : 'Not Connected'}
              </p>
            </div>
            {getStatusBadge(integrationStatus.email_enabled)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Banking</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {integrationStatus.banking_enabled ? 'Connected' : 'Not Connected'}
              </p>
            </div>
            {getStatusBadge(integrationStatus.banking_enabled)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {integrationStatus.payment_enabled ? 'Connected' : 'Not Connected'}
              </p>
            </div>
            {getStatusBadge(integrationStatus.payment_enabled)}
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                      selected
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-2 border-blue-500'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </Tab>
              );
            })}
          </Tab.List>

          <Tab.Panels className="p-6">
            {/* Email Configuration Tab */}
            <Tab.Panel>
              <EmailConfiguration
                integrationStatus={integrationStatus}
                onUpdate={fetchIntegrationStatus}
              />
            </Tab.Panel>

            {/* Report Scheduling Tab */}
            <Tab.Panel>
              <ReportScheduling
                emailEnabled={integrationStatus.email_enabled}
                onUpdate={fetchIntegrationStatus}
              />
            </Tab.Panel>

            {/* Banking Integration Tab */}
            <Tab.Panel>
              <div className="text-center py-12">
                <BuildingLibraryIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Banking Integration
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Bank account connections are managed in the Banking section.
                </p>
                <button
                  onClick={() => (window.location.href = '/banking')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Banking
                </button>
              </div>
            </Tab.Panel>

            {/* Payment Integration Tab */}
            <Tab.Panel>
              <div className="text-center py-12">
                <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Payment Integration
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Payment processors are managed in the Payments section.
                </p>
                <button
                  onClick={() => (window.location.href = '/payments')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Payments
                </button>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default IntegrationPage;
