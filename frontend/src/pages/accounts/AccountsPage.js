import React from 'react';
import { BanknotesIcon, PlusIcon } from '@heroicons/react/24/outline';

const AccountsPage = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
            <p className="mt-2 text-gray-600">
              Manage your account structure and balances
            </p>
          </div>
          <button className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Account
          </button>
        </div>
      </div>

      {/* Setup Default Accounts */}
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No accounts configured</h3>
            <p className="mt-1 text-sm text-gray-500">
              Set up your chart of accounts to start tracking finances
            </p>
            <div className="mt-6 space-x-3">
              <button className="btn-primary">
                Setup Default Accounts
              </button>
              <button className="btn-secondary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Custom Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account List - Placeholder */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Account List</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-12 text-gray-500">
            Account management interface coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsPage;