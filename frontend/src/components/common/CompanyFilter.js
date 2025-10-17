import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';
import {
  BuildingOfficeIcon,
  ChevronDownIcon,
  CheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

const CompanyFilter = () => {
  const { 
    isSuperAdmin, 
    companies, 
    selectedCompanyId, 
    selectCompany, 
    clearCompanySelection,
    getSelectedCompanyName 
  } = useSuperAdmin();
  
  const [isOpen, setIsOpen] = useState(false);

  if (!isSuperAdmin) {
    return null;
  }

  const handleSelectCompany = (companyId) => {
    if (companyId === 'all') {
      clearCompanySelection();
    } else {
      selectCompany(companyId);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all shadow-sm hover:shadow"
        data-testid="company-filter-button"
      >
        {selectedCompanyId ? (
          <BuildingOfficeIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        ) : (
          <GlobeAltIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        )}
        <span className="max-w-[150px] truncate">{getSelectedCompanyName()}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Company Filter
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select a company to view its data
                </p>
              </div>

              {/* Company List */}
              <div className="max-h-96 overflow-y-auto py-2">
                {/* All Companies Option */}
                <button
                  onClick={() => handleSelectCompany('all')}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    !selectedCompanyId
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-200'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  data-testid="company-option-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      !selectedCompanyId 
                        ? 'bg-purple-600 dark:bg-purple-400' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                    <div className="text-left">
                      <div className="font-medium flex items-center space-x-2">
                        <GlobeAltIcon className="h-4 w-4" />
                        <span>All Companies</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        View data from all companies
                      </div>
                    </div>
                  </div>
                  {!selectedCompanyId && (
                    <CheckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  )}
                </button>

                {/* Individual Companies */}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        selectedCompanyId === company.id
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-200'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      data-testid={`company-option-${company.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedCompanyId === company.id 
                            ? 'bg-purple-600 dark:bg-purple-400' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`} />
                        <div className="text-left">
                          <div className="font-medium">{company.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                            <span className="capitalize">{company.type}</span>
                            <span>•</span>
                            <span>{company.user_count || 0} user{company.user_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      {selectedCompanyId === company.id && (
                        <CheckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'} available
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyFilter;
