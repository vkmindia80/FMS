import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UploadStatementModal from './UploadStatementModal';
import ReconciliationSession from './ReconciliationSession';

const ReconciliationPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchAccounts();
    fetchSessions();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('afms_access_token');
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
      const token = localStorage.getItem('afms_access_token');
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
    setSuccess(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Build query string
      const params = new URLSearchParams({
        account_id: formData.get('account_id'),
        statement_date: formData.get('statement_date'),
        opening_balance: formData.get('opening_balance'),
        closing_balance: formData.get('closing_balance'),
        auto_match: formData.get('auto_match')
      });
      
      // Create a new FormData with just the file
      const fileData = new FormData();
      fileData.append('file', formData.get('file'));
      
      const response = await fetch(
        `${BACKEND_URL}/api/reconciliation/upload-statement?${params}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fileData
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setShowUploadModal(false);
        setSuccess(`Statement uploaded successfully! ${data.auto_matched_count} transactions auto-matched.`);
        fetchSessions();
        
        // Open the new session
        if (data.session_id) {
          setTimeout(() => loadSession(data.session_id), 500);
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
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/reconciliation/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const session = await response.json();
        setActiveSession(session);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to load session');
      }
    } catch (err) {
      setError('Error loading session: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this reconciliation session?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/reconciliation/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setSuccess('Session deleted successfully');
        fetchSessions();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete session');
      }
    } catch (err) {
      setError('Error deleting session: ' + err.message);
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

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 dark:text-green-200">{success}</span>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-800 dark:text-green-400"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 dark:text-red-200">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400"
              >
                ×
              </button>
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View and manage your account reconciliation sessions
              </p>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading && sessions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
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
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {session.matched_count}/{session.total_bank_entries} matched
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Closing Balance
                          </div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(session.closing_balance)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(session._id, e)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete session"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
            onError={setError}
            onSuccess={setSuccess}
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

export default ReconciliationPage;
