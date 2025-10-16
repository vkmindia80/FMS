import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProfileSettings from './ProfileSettings';
import CompanySettings from './CompanySettings';
import PreferencesSettings from './PreferencesSettings';
import SecuritySettings from './SecuritySettings';
import IntegrationsSettings from './IntegrationsSettings';
import BillingSettings from './BillingSettings';
import {
  UserIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  CubeIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'profile');

  // Update active tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon, description: 'Personal information' },
    { id: 'company', name: 'Company', icon: BuildingOfficeIcon, description: 'Organization settings' },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon, description: 'App preferences' },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon, description: 'Password & privacy' },
    { id: 'integrations', name: 'Integrations', icon: CubeIcon, description: 'Connected services' },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon, description: 'Plans & payments' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'company':
        return <CompanySettings />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'integrations':
        return <IntegrationsSettings />;
      case 'billing':
        return <BillingSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 -m-6 p-6" data-testid="settings-page">
      {/* Enhanced Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-2">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
            <Cog6ToothIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage your account, company, and application preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Enhanced Settings Navigation */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 sticky top-6">
            <nav className="space-y-1" data-testid="settings-nav">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    data-testid={`settings-tab-${tab.id}`}
                    className={`w-full group flex items-start px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 transform ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/50 scale-[1.02]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.01]'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400'
                      } ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                    />
                    <div className="text-left">
                      <div className={isActive ? 'font-semibold' : ''}>{tab.name}</div>
                      <div className={`text-xs mt-0.5 ${
                        isActive 
                          ? 'text-primary-100' 
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Enhanced Settings Content */}
        <div className="lg:col-span-9">
          <div className="transition-all duration-300 ease-in-out" data-testid="settings-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
