import React from 'react';
import { CreditCardIcon, PlusIcon } from '@heroicons/react/24/outline';

const TransactionsPage = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="mt-2 text-gray-600">
              Manage your income, expenses, and transfers
            </p>
          </div>
          <button className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Transaction List - Placeholder */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">All Transactions</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No transactions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by adding your first transaction
            </p>
            <div className="mt-6">
              <button className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;