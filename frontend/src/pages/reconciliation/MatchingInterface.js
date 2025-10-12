import React, { useState } from 'react';

const MatchingInterface = ({ session, onMatch, onUnmatch, loading }) => {
  const [filter, setFilter] = useState('all'); // all, matched, unmatched
  const [expandedEntries, setExpandedEntries] = useState(new Set());

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

  const toggleExpanded = (entryId) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const filteredEntries = session.bank_entries ? session.bank_entries.filter(entry => {
    if (filter === 'matched') return entry.matched;
    if (filter === 'unmatched') return !entry.matched;
    return true;
  }) : [];

  const getConfidenceBadge = (score) => {
    if (score >= 0.8) {
      return {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: 'High'
      };
    } else if (score >= 0.5) {
      return {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        label: 'Medium'
      };
    } else {
      return {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        label: 'Low'
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All ({session.total_bank_entries})
          </button>
          <button
            onClick={() => setFilter('matched')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'matched'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Matched ({session.matched_count})
          </button>
          <button
            onClick={() => setFilter('unmatched')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unmatched'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Unmatched ({session.unmatched_count})
          </button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredEntries.length} transaction{filteredEntries.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Bank Entries List */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              No {filter} transactions
            </p>
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <BankEntryCard
              key={entry.id}
              entry={entry}
              index={index}
              isExpanded={expandedEntries.has(entry.id)}
              onToggle={() => toggleExpanded(entry.id)}
              onMatch={onMatch}
              onUnmatch={onUnmatch}
              loading={loading}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getConfidenceBadge={getConfidenceBadge}
            />
          ))
        )}
      </div>

      {/* Help Text */}
      {session.unmatched_count > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Matching Tips</h4>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Click on unmatched entries to view suggested matches. Select the best match and click "Match" to reconcile.
                The system uses amount, date, and description to find potential matches.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Bank Entry Card Component
const BankEntryCard = ({
  entry,
  index,
  isExpanded,
  onToggle,
  onMatch,
  onUnmatch,
  loading,
  formatCurrency,
  formatDate,
  getConfidenceBadge
}) => {
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleMatchClick = () => {
    if (selectedMatch) {
      onMatch(entry.id, selectedMatch.system_transaction_id, selectedMatch.confidence_score);
      setSelectedMatch(null);
    }
  };

  return (
    <div
      className={`border rounded-lg transition-all ${
        entry.matched
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {entry.matched ? (
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-medium">
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
                    {entry.description}
                  </h4>
                  {entry.matched && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                      Matched
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>📅 {formatDate(entry.date)}</span>
                  {entry.reference && <span>🔖 {entry.reference}</span>}
                  {entry.balance !== null && <span>Balance: {formatCurrency(entry.balance)}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 ml-4">
            <div className="text-right">
              <div className={`text-lg font-semibold ${
                entry.amount >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(entry.amount)}
              </div>
              {entry.amount >= 0 ? (
                <div className="text-xs text-green-600 dark:text-green-400">Deposit</div>
              ) : (
                <div className="text-xs text-red-600 dark:text-red-400">Withdrawal</div>
              )}
            </div>
            {!entry.matched && (
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isExpanded ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Matches - Only show for unmatched entries */}
      {isExpanded && !entry.matched && (
        <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
              Suggested Matches
            </h5>
            {entry.matched_transaction_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnmatch(entry.id);
                }}
                disabled={loading}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
              >
                Unmatch
              </button>
            )}
          </div>

          {/* For now, show placeholder for suggested matches */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No suggested matches available. The system looks for transactions with:
            </div>
            <ul className="list-disc list-inside text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <li>Similar amounts (within $0.01)</li>
              <li>Dates within 2 days</li>
              <li>Matching keywords in description</li>
            </ul>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
              💡 Tip: Create a transaction in the system that matches this bank entry, then refresh to see it appear as a suggested match.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingInterface;
