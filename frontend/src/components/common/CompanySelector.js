import React from 'react';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';

const CompanySelector = ({ className = '' }) => {
  const {
    isSuperAdmin,
    selectedCompanyId,
    companies,
    selectCompany,
    getSelectedCompanyName
  } = useSuperAdmin();

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          View Data From:
        </span>
        <select
          value={selectedCompanyId || ''}
          onChange={(e) => selectCompany(e.target.value || null)}
          className="block w-64 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          data-testid="company-selector"
        >
          <option value="">All Companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name} ({company.user_count} users)
            </option>
          ))}
        </select>
      </div>
      
      {/* Visual indicator */}
      <div className="flex items-center space-x-1">
        <svg 
          className="w-5 h-5 text-purple-600 dark:text-purple-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
          Super Admin
        </span>
      </div>
    </div>
  );
};

export default CompanySelector;
