import React, { useState, useEffect } from 'react';
import { 
  BanknotesIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import AccountModal from '../../components/accounts/AccountModal';

// Account type definitions organized by category
const ACCOUNT_TYPES = {
  'Assets': [
    { value: 'cash', label: 'Cash' },
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'accounts_receivable', label: 'Accounts Receivable' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'prepaid_expenses', label: 'Prepaid Expenses' },
    { value: 'fixed_assets', label: 'Fixed Assets' },
    { value: 'other_assets', label: 'Other Assets' }
  ],
  'Liabilities': [
    { value: 'accounts_payable', label: 'Accounts Payable' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'short_term_debt', label: 'Short-term Debt' },
    { value: 'long_term_debt', label: 'Long-term Debt' },
    { value: 'accrued_expenses', label: 'Accrued Expenses' },
    { value: 'other_liabilities', label: 'Other Liabilities' }
  ],
  'Equity': [
    { value: 'owner_equity', label: "Owner's Equity" },
    { value: 'retained_earnings', label: 'Retained Earnings' },
    { value: 'common_stock', label: 'Common Stock' }
  ],
  'Income': [
    { value: 'revenue', label: 'Revenue' },
    { value: 'service_income', label: 'Service Income' },
    { value: 'interest_income', label: 'Interest Income' },
    { value: 'other_income', label: 'Other Income' }
  ],
  'Expenses': [
    { value: 'cost_of_goods_sold', label: 'Cost of Goods Sold' },
    { value: 'operating_expenses', label: 'Operating Expenses' },
    { value: 'administrative_expenses', label: 'Administrative Expenses' },
    { value: 'interest_expense', label: 'Interest Expense' },
    { value: 'tax_expense', label: 'Tax Expense' },
    { value: 'other_expenses', label: 'Other Expenses' }
  ]
};

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({
    assets: true,
    liabilities: true,
    equity: true,
    income: true,
    expenses: true
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/accounts/');
      setAccounts(response.data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupDefaultAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/accounts/setup-defaults');
      await fetchAccounts();
      alert('Default accounts created successfully!');
    } catch (err) {
      console.error('Failed to setup default accounts:', err);
      setError(err.response?.data?.detail || 'Failed to setup default accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setShowModal(true);
  };

  const handleEditAccount = (account) => {
    setSelectedAccount(account);
    setShowModal(true);
  };

  const handleSaveAccount = async (accountData) => {
    try {
      if (selectedAccount) {
        // Update existing account
        await api.put(`/accounts/${selectedAccount.id}`, accountData);
      } else {
        // Create new account
        await api.post('/accounts/', accountData);
      }
      await fetchAccounts();
    } catch (err) {
      console.error('Failed to save account:', err);
      throw err;
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      await api.delete(`/accounts/${accountId}`);
      await fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert(err.response?.data?.detail || 'Failed to delete account');
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Filter and organize accounts
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (account.account_number && account.account_number.includes(searchTerm));
    const matchesCategory = filterCategory === 'all' || account.account_category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && account.is_active) ||
                         (filterStatus === 'inactive' && !account.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Group accounts by category
  const accountsByCategory = {
    assets: filteredAccounts.filter(a => a.account_category === 'assets'),
    liabilities: filteredAccounts.filter(a => a.account_category === 'liabilities'),
    equity: filteredAccounts.filter(a => a.account_category === 'equity'),
    income: filteredAccounts.filter(a => a.account_category === 'income'),
    expenses: filteredAccounts.filter(a => a.account_category === 'expenses')
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getCategoryTotals = () => {
    const totals = {};
    Object.keys(accountsByCategory).forEach(category => {
      totals[category] = accountsByCategory[category].reduce((sum, account) => {
        return sum + (parseFloat(account.current_balance) || 0);
      }, 0);
    });
    return totals;
  };

  const categoryTotals = getCategoryTotals();

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex space-x-3">
            {accounts.length === 0 && (
              <button
                onClick={setupDefaultAccounts}
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                disabled={loading}
              >
                Setup Default Accounts
              </button>
            )}
            <button
              onClick={handleCreateAccount}
              className="btn-primary inline-flex items-center"
              disabled={loading}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Account
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {accounts.length === 0 && !loading ? (
        /* No Accounts - Setup Prompt */
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No accounts configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set up your chart of accounts to start tracking finances
              </p>
              <div className="mt-6 space-x-3">
                <button
                  onClick={setupDefaultAccounts}
                  className="btn-primary"
                  disabled={loading}
                >
                  Setup Default Accounts
                </button>
                <button
                  onClick={handleCreateAccount}
                  className="btn-secondary inline-flex items-center"
                  disabled={loading}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Custom Account
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filters and Search */}
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <div className="relative">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="assets">Assets</option>
                      <option value="liabilities">Liabilities</option>
                      <option value="equity">Equity</option>
                      <option value="income">Income</option>
                      <option value="expenses">Expenses</option>
                    </select>
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                    <option value="all">All Status</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Account List by Category */}
          <div className="space-y-4">
            {Object.entries(accountsByCategory).map(([category, categoryAccounts]) => {
              if (categoryAccounts.length === 0) return null;

              const isExpanded = expandedCategories[category];
              const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

              return (
                <div key={category} className="card">
                  <div
                    className="card-header cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                        )}
                        <h2 className="text-lg font-semibold text-gray-900">
                          {categoryName} ({categoryAccounts.length})
                        </h2>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(categoryTotals[category])}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="card-body p-0">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Account
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Number
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Balance
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {categoryAccounts.map((account) => (
                              <tr key={account.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {account.name}
                                    </div>
                                    {account.description && (
                                      <div className="text-sm text-gray-500">
                                        {account.description}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {account.account_type.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {account.account_number || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                  {formatCurrency(account.current_balance)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {account.is_active ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      <XCircleIcon className="h-4 w-4 mr-1" />
                                      Inactive
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleEditAccount(account)}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAccount(account.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredAccounts.length === 0 && (
            <div className="card">
              <div className="card-body text-center py-12">
                <p className="text-gray-500">No accounts found matching your filters.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedAccount(null);
        }}
        onSave={handleSaveAccount}
        account={selectedAccount}
        accountTypes={ACCOUNT_TYPES}
      />
    </div>
  );
};

export default AccountsPage;