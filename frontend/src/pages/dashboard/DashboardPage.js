import React from 'react';
import { useQuery } from 'react-query';
import { 
  BanknotesIcon, 
  DocumentTextIcon, 
  CreditCardIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { reportsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  // Fetch dashboard summary data
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery('dashboard-summary', reportsAPI.getDashboardSummary, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-error-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">
          {summaryError?.response?.data?.detail || 'Something went wrong'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = [
    {
      name: 'Cash Balance',
      value: `$${summary?.summary?.cash_balance?.toLocaleString() || '0'}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: BanknotesIcon,
    },
    {
      name: 'Monthly Revenue',
      value: `$${summary?.summary?.current_month_revenue?.toLocaleString() || '0'}`,
      change: '+18.2%',
      changeType: 'positive',
      icon: ArrowUpIcon,
    },
    {
      name: 'Monthly Expenses',
      value: `$${summary?.summary?.current_month_expenses?.toLocaleString() || '0'}`,
      change: '-4.7%',
      changeType: 'negative',
      icon: CreditCardIcon,
    },
    {
      name: 'Net Profit',
      value: `$${summary?.summary?.current_month_profit?.toLocaleString() || '0'}`,
      change: '+25.8%',
      changeType: 'positive',
      icon: ChartBarIcon,
    },
  ];

  const quickActions = [
    {
      name: 'Upload Document',
      description: 'Add receipts, invoices, and statements',
      href: '/documents',
      icon: DocumentTextIcon,
      color: 'bg-primary-500',
    },
    {
      name: 'Add Transaction',
      description: 'Record income, expenses, or transfers',
      href: '/transactions',
      icon: CreditCardIcon,
      color: 'bg-success-500',
    },
    {
      name: 'View Reports',
      description: 'Generate financial statements',
      href: '/reports',
      icon: ChartBarIcon,
      color: 'bg-warning-500',
    },
    {
      name: 'Manage Accounts',
      description: 'Set up chart of accounts',
      href: '/accounts',
      icon: BanknotesIcon,
      color: 'bg-error-500',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'document_uploaded',
      description: 'Receipt uploaded - Office supplies',
      amount: '$234.56',
      time: '2 hours ago',
      status: 'processed',
    },
    {
      id: 2,
      type: 'transaction_created',
      description: 'Payment received from client',
      amount: '$2,500.00',
      time: '4 hours ago',
      status: 'cleared',
    },
    {
      id: 3,
      type: 'document_uploaded',
      description: 'Invoice uploaded - Marketing services',
      amount: '$1,200.00',
      time: '6 hours ago',
      status: 'processing',
    },
    {
      id: 4,
      type: 'transaction_created',
      description: 'Rent payment',
      amount: '$3,000.00',
      time: '1 day ago',
      status: 'cleared',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.full_name || 'User'}
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your financial activity for {user?.company_name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'positive'
                            ? 'text-success-600'
                            : 'text-error-600'
                        }`}
                      >
                        {stat.changeType === 'positive' ? (
                          <ArrowUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                        )}
                        <span className="sr-only">
                          {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                        </span>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600">Get started with these common tasks</p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <span
                    className={`rounded-lg inline-flex p-3 ring-4 ring-white ${action.color}`}
                  >
                    <action.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{action.description}</p>
                </div>
                <span
                  className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <a href="/transactions" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </a>
          </div>
          <div className="card-body p-0">
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {recentActivities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivities.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3 px-6">
                        <div>
                          <span
                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              activity.type === 'document_uploaded'
                                ? 'bg-primary-500'
                                : 'bg-success-500'
                            }`}
                          >
                            {activity.type === 'document_uploaded' ? (
                              <DocumentTextIcon className="h-4 w-4 text-white" />
                            ) : (
                              <CreditCardIcon className="h-4 w-4 text-white" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            <p className="text-sm font-medium text-gray-900">{activity.amount}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>{activity.time}</time>
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  activity.status === 'processed'
                                    ? 'bg-success-100 text-success-800'
                                    : activity.status === 'processing'
                                    ? 'bg-warning-100 text-warning-800'
                                    : 'bg-primary-100 text-primary-800'
                                }`}
                              >
                                {activity.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Account Summary</h2>
            <a href="/accounts" className="text-sm text-primary-600 hover:text-primary-500">
              Manage accounts
            </a>
          </div>
          <div className="card-body">
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Total Assets</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  ${summary?.summary?.total_assets?.toLocaleString() || '0'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Total Liabilities</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  ${summary?.summary?.total_liabilities?.toLocaleString() || '0'}
                </dd>
              </div>
              <div className="flex justify-between border-t pt-4">
                <dt className="text-sm font-medium text-gray-900">Net Worth</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  ${summary?.summary?.total_equity?.toLocaleString() || '0'}
                </dd>
              </div>
            </dl>
            
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500 mb-2">Processing Status</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Documents:</span>
                  <span className="ml-1 font-medium">
                    {summary?.counts?.processing_documents || 0} processing
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Transactions:</span>
                  <span className="ml-1 font-medium">
                    {summary?.counts?.pending_transactions || 0} pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;