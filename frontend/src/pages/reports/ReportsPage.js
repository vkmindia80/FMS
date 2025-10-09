import React from 'react';
import { ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const ReportsPage = () => {
  const reports = [
    {
      name: 'Profit & Loss',
      description: 'Income and expense summary',
      icon: ChartBarIcon,
      color: 'bg-primary-500',
    },
    {
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity',
      icon: ChartBarIcon,
      color: 'bg-success-500',
    },
    {
      name: 'Cash Flow',
      description: 'Cash inflows and outflows',
      icon: ChartBarIcon,
      color: 'bg-warning-500',
    },
    {
      name: 'Trial Balance',
      description: 'Account balances verification',
      icon: ChartBarIcon,
      color: 'bg-error-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-2 text-gray-600">
            Generate comprehensive financial statements and analysis
          </p>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reports.map((report) => (
          <div key={report.name} className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`rounded-lg p-3 ${report.color}`}>
                  <report.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <button className="btn-secondary w-full">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Generate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No reports generated</h3>
            <p className="mt-1 text-sm text-gray-500">
              Generate your first financial report to see it here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;