import React, { useState, useEffect } from 'react';
import {
  BuildingLibraryIcon,
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const BankingIntegration = ({ integrationStatus, onUpdate }) => {
  const [connections, setConnections] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);

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
      
      if (!response.ok) throw new Error('Failed to fetch connections');
      
      const data = await response.json();
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setConnections([]);
      toast.error('Failed to load bank connections');
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/banking/institutions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch institutions');
      
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
        toast.success(`Bank connected! ${data.accounts_count} accounts found.`);
        setShowConnectModal(false);
        fetchConnections();
        onUpdate();
        setConnectForm({ provider: 'mock', institution_id: '', username: '', password: '' });
      } else {
        toast.error(data.detail || 'Failed to connect bank');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async (connectionId) => {
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/banking/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        },
        body: JSON.stringify({ connection_id: connectionId })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Synced ${data.transactions_synced} new transactions`);
        fetchBankTransactions(connectionId);
      } else {
        toast.error(data.detail || 'Failed to sync transactions');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
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
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
      setSelectedConnection(connectionId);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
      toast.error('Failed to load transactions');
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
          'Authorization': `Bearer ${localStorage.getItem('afms_access_token')}`
        }
      });

      if (response.ok) {
        toast.success('Bank account disconnected');
        fetchConnections();
        onUpdate();
        if (selectedConnection === connectionId) {
          setTransactions([]);
          setSelectedConnection(null);
        }
      }
    } catch (err) {
      toast.error('Failed to disconnect bank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Banking Integration
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Connect bank accounts and sync transactions automatically
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-testid="connect-bank-button"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Connect Bank
        </button>
      </div>

      {/* Connected Banks */}
      {connections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <BuildingLibraryIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No bank connections</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by connecting your first bank account.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Connect Bank Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => (
            <div key={conn.connection_id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-xl font-bold">
                        {conn.institution_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{conn.institution_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {conn.accounts?.length || 0} accounts • Connected {new Date(conn.connected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {conn.accounts?.slice(0, 3).map((acc, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {acc.name || acc.account_type} - ****{acc.mask || acc.account_number?.slice(-4)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSyncTransactions(conn.connection_id)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    title="Sync transactions"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDisconnect(conn.connection_id)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Disconnect"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {conn.last_synced && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Last synced: {new Date(conn.last_synced).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Connect Bank Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowConnectModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
  );
};

export default BankingIntegration;
