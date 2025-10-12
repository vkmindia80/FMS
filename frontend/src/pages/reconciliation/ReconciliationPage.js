import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ReconciliationPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchAccounts();
    fetchSessions();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/accounts/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter to bank/cash accounts for reconciliation
        const bankAccounts = data.filter(acc => 
          ['checking', 'savings', 'cash', 'credit_card'].includes(acc.account_type)
        );
        setAccounts(bankAccounts);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/reconciliation/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const handleUploadStatement = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${BACKEND_URL}/api/reconciliation/upload-statement?${new URLSearchParams(formData)}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData.get('file')
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setShowUploadModal(false);
        fetchSessions();
        
        // Open the new session
        if (data.session_id) {
          loadSession(data.session_id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to upload statement');
      }
    } catch (err) {
      setError('Failed to upload statement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (sessionId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/reconciliation/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const session = await response.json();
        setActiveSession(session);
      }
    } catch (err) {
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" data-testid="reconciliation-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Account Reconciliation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Match bank statements with your transactions
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            data-testid="upload-statement-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload Statement</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!activeSession ? (
          /* Sessions List */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Reconciliation Sessions
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessions.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No reconciliation sessions yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Upload a bank statement to start reconciling your accounts
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Upload Statement
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session._id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => loadSession(session._id)}
                    data-testid={`session-${session._id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {session.account_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            session.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>📅 {formatDate(session.statement_date)}</span>
                          <span>📄 {session.filename}</span>
                          <span>
                            ✅ {session.matched_count}/{session.total_bank_entries} matched
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Closing Balance
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(session.closing_balance)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Active Session View */
          <ReconciliationSession
            session={activeSession}
            onClose={() => {
              setActiveSession(null);
              fetchSessions();
            }}
            onUpdate={() => loadSession(activeSession._id)}
          />
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadStatementModal
            accounts={accounts}
            onClose={() => setShowUploadModal(false)}
            onUpload={handleUploadStatement}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

// Upload Statement Modal Component
const UploadStatementModal = ({ accounts, onClose, onUpload, loading }) => {
  const [formData, setFormData] = useState({
    account_id: '',
    statement_date: '',
    opening_balance: '',
    closing_balance: '',
    auto_match: false,
    file: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('account_id', formData.account_id);
    data.append('statement_date', formData.statement_date);
    data.append('opening_balance', formData.opening_balance);
    data.append('closing_balance', formData.closing_balance);
    data.append('auto_match', formData.auto_match);
    data.append('file', formData.file);
    
    onUpload(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upload Bank Statement
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account
            </label>
            <select
              required
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({formatCurrency(account.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statement Date
            </label>
            <input
              type="date"
              required
              value={formData.statement_date}
              onChange={(e) => setFormData({ ...formData, statement_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Opening Balance
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Closing Balance
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.closing_balance}
                onChange={(e) => setFormData({ ...formData, closing_balance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statement File (CSV, OFX, or QFX)
            </label>
            <input
              type="file"
              required
              accept=".csv,.ofx,.qfx"
              onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_match"
              checked={formData.auto_match}
              onChange={(e) => setFormData({ ...formData, auto_match: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="auto_match" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Automatically approve high-confidence matches (≥80%)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload & Start Reconciliation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function for formatting currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Reconciliation Session Component (will be in separate file)
const ReconciliationSession = ({ session, onClose, onUpdate }) => {
  const [matches, setMatches] = useState([]);
  const [selectedBankEntries, setSelectedBankEntries] = useState(new Set());
  const [selectedSystemTxns, setSelectedSystemTxns] = useState(new Set());
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleMatch = async () => {
    // Match selected bank entries with system transactions
    const matchRequests = Array.from(selectedBankEntries).map(bankEntryId => {
      const systemTxnId = Array.from(selectedSystemTxns)[0]; // Simplified for now
      return {
        bank_entry_id: bankEntryId,
        system_transaction_id: systemTxnId,
        confidence_score: 0.9
      };
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/reconciliation/match`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: session._id,
          matches: matchRequests
        })
      });

      if (response.ok) {
        onUpdate();
        setSelectedBankEntries(new Set());
        setSelectedSystemTxns(new Set());
      }
    } catch (err) {
      console.error('Error matching transactions:', err);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Complete this reconciliation? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/reconciliation/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: session._id
        })
      });

      if (response.ok) {
        alert('Reconciliation completed successfully!');
        onClose();
      }
    } catch (err) {
      console.error('Error completing reconciliation:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {session.account_name} - Reconciliation
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Statement Date: {new Date(session.statement_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {session.status === 'in_progress' && (
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              data-testid="complete-reconciliation-btn"
            >
              Complete Reconciliation
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Entries</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {session.total_bank_entries}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">Matched</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {session.matched_count}
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Unmatched</div>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {session.unmatched_count}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400">Closing Balance</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(session.closing_balance)}
            </div>
          </div>
        </div>

        {/* Bank Entries List */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Bank Statement Entries
          </h3>
          {session.bank_entries && session.bank_entries.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 border rounded-lg ${
                entry.matched
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {entry.description}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    entry.amount >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(entry.amount)}
                  </div>
                  {entry.matched && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      ✓ Matched
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReconciliationPage;
