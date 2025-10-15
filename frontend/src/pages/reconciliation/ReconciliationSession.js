import React, { useState, useEffect } from 'react';
import MatchingInterface from './MatchingInterface';
import ReconciliationReport from './ReconciliationReport';

const ReconciliationSession = ({ session, onClose, onUpdate, onError, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('matching'); // matching or report
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    // Load matches from the initial upload response
    if (session && session.matches) {
      setMatches(session.matches);
    }
  }, [session]);

  const handleMatch = async (bankEntryId, systemTransactionId, confidenceScore) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('afms_access_token');
      const response = await fetch(`${BACKEND_URL}/api/reconciliation/match`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: session._id,
          matches: [{
            bank_entry_id: bankEntryId,
            system_transaction_id: systemTransactionId,
            confidence_score: confidenceScore
          }]
        })
      });

      if (response.ok) {
        onSuccess('Transaction matched successfully');
        onUpdate();
      } else {
        const errorData = await response.json();
        onError(errorData.detail || 'Failed to match transaction');
      }
    } catch (err) {
      onError('Error matching transaction: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatch = async (bankEntryId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('afms_access_token');
      const response = await fetch(`${BACKEND_URL}/api/reconciliation/unmatch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: session._id,
          bank_entry_id: bankEntryId
        })
      });

      if (response.ok) {
        onSuccess('Transaction unmatched successfully');
        onUpdate();
      } else {
        const errorData = await response.json();
        onError(errorData.detail || 'Failed to unmatch transaction');
      }
    } catch (err) {
      onError('Error unmatching transaction: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const unmatchedCount = session.unmatched_count || 0;
    
    if (unmatchedCount > 0) {
      const confirmed = window.confirm(
        `There are ${unmatchedCount} unmatched transactions. Are you sure you want to complete this reconciliation?`
      );
      if (!confirmed) return;
    } else {
      if (!window.confirm('Complete this reconciliation? This will mark all matched transactions as reconciled.')) {
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('afms_access_token');
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
        onSuccess('Reconciliation completed successfully!');
        
        // Load the report
        await loadReport();
        setActiveTab('report');
      } else {
        const errorData = await response.json();
        onError(errorData.detail || 'Failed to complete reconciliation');
      }
    } catch (err) {
      onError('Error completing reconciliation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    try {
      const token = localStorage.getItem('afms_access_token');
      const response = await fetch(`${BACKEND_URL}/api/reconciliation/report/${session._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const reportData = await response.json();
        setReport(reportData);
      }
    } catch (err) {
      console.error('Error loading report:', err);
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

  const matchedPercentage = session.total_bank_entries > 0
    ? Math.round((session.matched_count / session.total_bank_entries) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {session.account_name}
              </h2>
              <span className={`px-3 py-1 text-xs rounded-full ${
                session.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {session.status === 'completed' ? 'Completed' : 'In Progress'}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
              <span>📅 Statement Date: {formatDate(session.statement_date)}</span>
              <span>📄 {session.filename}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {session.status === 'in_progress' && activeTab === 'matching' && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center space-x-2"
                data-testid="complete-reconciliation-btn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Complete Reconciliation</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Sessions
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Entries</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {session.total_bank_entries}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Matched</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              {session.matched_count}
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Unmatched</div>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
              {session.unmatched_count}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Progress</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
              {matchedPercentage}%
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Closing Balance</div>
            <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
              {formatCurrency(session.closing_balance)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Reconciliation Progress</span>
            <span>{session.matched_count} of {session.total_bank_entries} transactions</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${matchedPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('matching')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'matching'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Transaction Matching</span>
            </div>
          </button>
          {session.status === 'completed' && (
            <button
              onClick={() => {
                setActiveTab('report');
                if (!report) loadReport();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'report'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Reconciliation Report</span>
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'matching' ? (
          <MatchingInterface
            session={session}
            onMatch={handleMatch}
            onUnmatch={handleUnmatch}
            loading={loading}
          />
        ) : (
          <ReconciliationReport
            session={session}
            report={report}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default ReconciliationSession;
