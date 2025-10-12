import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const BankingPage = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [connectForm, setConnectForm] = useState({
    provider: 'mock',
    institution_id: '',
    username: '',
    password: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.ENV?.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchConnections();
    fetchInstitutions();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/banking/connections`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      
      const data = await response.json();
      // Ensure data is always an array
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setConnections([]); // Set empty array on error
      setError('Failed to load bank connections');
    }
  };

  const fetchInstitutions = async () => {
    try:
      const response = await fetch(`${BACKEND_URL}/api/banking/institutions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch institutions');
      }
      
      const data = await response.json();
      setInstitutions(Array.isArray(data.institutions) ? data.institutions : []);
    } catch (err) {
      console.error('Error fetching institutions:', err);
      setInstitutions([]);
    }
  };

  const handleConnectBank = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/banking/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        },
        body: JSON.stringify(connectForm)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Bank connected successfully! ${data.accounts_count} accounts found.`);
        setShowConnectModal(false);
        fetchConnections();
        setConnectForm({ provider: 'mock', institution_id: '', username: '', password: '' });
      } else {
        setError(data.detail || 'Failed to connect bank');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async (connectionId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/banking/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        },
        body: JSON.stringify({
          connection_id: connectionId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Synced ${data.transactions_synced} new transactions`);
        fetchBankTransactions(connectionId);
      } else {
        setError(data.detail || 'Failed to sync transactions');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankTransactions = async (connectionId) => {
    try {
      const url = connectionId 
        ? `${BACKEND_URL}/api/banking/transactions?connection_id=${connectionId}`
        : `${BACKEND_URL}/api/banking/transactions`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
      setSelectedConnection(connectionId);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
      setError('Failed to load transactions');
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (!window.confirm('Are you sure you want to disconnect this bank account?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/banking/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSuccess('Bank account disconnected');
        fetchConnections();
        if (selectedConnection === connectionId) {
          setTransactions([]);
          setSelectedConnection(null);
        }
      }
    } catch (err) {
      setError('Failed to disconnect bank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Banking & Connections</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Connect bank accounts and sync transactions</p>
          </div>
          <button
            onClick={() => setShowConnectModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Connect Bank
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Connected Banks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Connected Banks</h2>
          {connections.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No bank accounts connected yet. Click "Connect Bank" to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {connections.map((conn) => (
                <div key={conn.connection_id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-300 text-xl font-bold">
                            {conn.institution_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{conn.institution_name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {conn.accounts?.length || 0} accounts • Connected {new Date(conn.connected_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {conn.accounts?.slice(0, 3).map((acc, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                            {acc.name || acc.account_type} - ****{acc.mask || acc.account_number?.slice(-4)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSyncTransactions(conn.connection_id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                      >
                        Sync
                      </button>
                      <button
                        onClick={() => fetchBankTransactions(conn.connection_id)}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDisconnect(conn.connection_id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm font-medium"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                  {conn.last_synced && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Last synced: {new Date(conn.last_synced).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bank Transactions */}
        {selectedConnection && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bank Transactions</h2>
            {transactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No transactions found. Click "Sync" to fetch transactions.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.slice(0, 50).map((txn) => (
                      <tr key={txn.bank_transaction_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{txn.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {txn.description}
                          {txn.merchant_name && (
                            <div className="text-xs text-gray-500">{txn.merchant_name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {Array.isArray(txn.category) ? txn.category[0] : txn.category || 'Uncategorized'}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${
                          txn.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ${Math.abs(txn.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {txn.imported ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Imported
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Connect Bank Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Connect Bank Account</h3>
              <form onSubmit={handleConnectBank}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Provider
                    </label>
                    <select
                      value={connectForm.provider}
                      onChange={(e) => setConnectForm({ ...connectForm, provider: e.target.value })}
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="mock">Mock Banking (Demo)</option>
                      <option value="plaid">Plaid (Real Banks)</option>
                    </select>
                  </div>

                  {connectForm.provider === 'mock' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Institution
                        </label>
                        <select
                          value={connectForm.institution_id}
                          onChange={(e) => setConnectForm({ ...connectForm, institution_id: e.target.value })}
                          className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="">Select institution...</option>
                          {institutions.map((inst) => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={connectForm.username}
                          onChange={(e) => setConnectForm({ ...connectForm, username: e.target.value })}
                          className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                          placeholder="demo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={connectForm.password}
                          onChange={(e) => setConnectForm({ ...connectForm, password: e.target.value })}
                          className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="demo123"
                        />
                      </div>
                    </>
                  )}

                  {connectForm.provider === 'plaid' && (
                    <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Plaid integration requires API credentials. Use Mock Banking for demo purposes.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankingPage;
