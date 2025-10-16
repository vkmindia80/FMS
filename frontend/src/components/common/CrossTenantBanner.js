import React from 'react';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';

const CrossTenantBanner = () => {
  const { isSuperAdmin, selectedCompanyId, getSelectedCompanyName } = useSuperAdmin();

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="mb-4">
      {!selectedCompanyId ? (
        <div 
          className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-900/20 dark:border-purple-800"
          data-testid="all-companies-banner"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                🔍 Viewing data from ALL companies (Super Admin mode)
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                You are currently viewing cross-tenant data. Use the company selector above to filter by a specific company.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800"
          data-testid="specific-company-banner"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                🔍 Viewing data from: <span className="font-bold">{getSelectedCompanyName()}</span>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Super Admin mode - viewing specific company data
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossTenantBanner;
