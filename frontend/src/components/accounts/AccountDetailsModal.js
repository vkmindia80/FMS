import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { api } from '../../services/api';

const AccountDetailsModal = ({ isOpen, onClose, account }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && account) {
      fetchAccountTransactions();
    }
  }, [isOpen, account]);

  const fetchAccountTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch transactions for this account
      const response = await api.get(`/transactions/?account_id=${account.id}`);
      setTransactions(response.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{account.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {account.account_type.replace(/_/g, ' ')} {account.account_number && `• ${account.account_number}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Current Balance</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(account.current_balance)}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Account Type</p>
                <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                  {account.account_category}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Status</p>
                <p className="text-lg font-semibold mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>

            {account.description && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium mb-1">Description</p>
                <p className="text-sm text-gray-900">{account.description}</p>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="border-t border-gray-200">
            <div className="px-6 py-4 bg-gray-50">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Transaction History
              </h4>
            </div>

            <div className="px-6 py-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading transactions...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">No transactions found for this account</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                              {formatDate(transaction.transaction_date)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              {transaction.memo && (
                                <div className="text-gray-500 text-xs mt-1">{transaction.memo}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.transaction_type === 'income' 
                                ? 'bg-green-100 text-green-800'
                                : transaction.transaction_type === 'expense'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {transaction.transaction_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <span className={
                              transaction.transaction_type === 'income' 
                                ? 'text-green-600'
                                : transaction.transaction_type === 'expense'
                                ? 'text-red-600'
                                : 'text-gray-900'
                            }>
                              {transaction.transaction_type === 'income' ? '+' : transaction.transaction_type === 'expense' ? '-' : ''}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              transaction.status === 'cleared'
                                ? 'bg-green-50 text-green-700'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-50 text-yellow-700'
                                : transaction.status === 'reconciled'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-gray-50 text-gray-700'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsModal;