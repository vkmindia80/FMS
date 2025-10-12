import React from 'react';

const ReconciliationReport = ({ session, report, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Create a simple text export
    const content = `
RECONCILIATION REPORT
=====================

Account: ${session.account_name}
Statement Date: ${formatDate(session.statement_date)}
Completed: ${formatDateTime(session.updated_at)}


SUMMARY
-------
Total Bank Entries: ${session.total_bank_entries}
Matched Transactions: ${session.matched_count}
Unmatched Transactions: ${session.unmatched_count}

Opening Balance: ${formatCurrency(session.opening_balance)}
Closing Balance: ${formatCurrency(session.closing_balance)}


DETAILS
-------
Status: ${session.status}
File: ${session.filename}

    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-${session.account_name}-${session.statement_date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reconciliationDifference = session.closing_balance - (session.opening_balance || 0);
  const matchedCount = session.matched_count || 0;
  const unmatchedCount = session.unmatched_count || 0;
  const totalCount = session.total_bank_entries || 0;
  const matchRate = totalCount > 0 ? ((matchedCount / totalCount) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Reconciliation Report</h3>
            <p className="text-blue-100 mt-1">
              Generated on {formatDateTime(new Date())}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Account Name</div>
            <div className="text-base font-medium text-gray-900 dark:text-white mt-1">
              {session.account_name}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Statement Date</div>
            <div className="text-base font-medium text-gray-900 dark:text-white mt-1">
              {formatDate(session.statement_date)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Statement File</div>
            <div className="text-base font-medium text-gray-900 dark:text-white mt-1">
              {session.filename}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed Date</div>
            <div className="text-base font-medium text-gray-900 dark:text-white mt-1">
              {formatDateTime(session.updated_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Opening Balance</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(session.opening_balance)}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Closing Balance</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(session.closing_balance)}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Net Change</div>
              <div className={`text-2xl font-bold mt-1 ${
                reconciliationDifference >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(reconciliationDifference)}
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              reconciliationDifference >= 0
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <svg className={`w-6 h-6 ${
                reconciliationDifference >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={reconciliationDifference >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {matchedCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Matched</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {unmatchedCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Unmatched</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {matchRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Match Rate</div>
          </div>
        </div>

        {/* Progress visualization */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Reconciliation Progress</span>
            <span>{matchedCount} / {totalCount} transactions</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${matchRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {session.status === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-green-900 dark:text-green-100">
                Reconciliation Completed Successfully
              </h4>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                This reconciliation has been finalized. All matched transactions have been marked as reconciled in your system.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unmatched Items Warning */}
      {unmatchedCount > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-base font-medium text-yellow-900 dark:text-yellow-100">
                {unmatchedCount} Unmatched Transaction{unmatchedCount !== 1 ? 's' : ''}
              </h4>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                These transactions from your bank statement could not be matched with transactions in your system.
                You may need to create the missing transactions or investigate discrepancies.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationReport;
