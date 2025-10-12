import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  DocumentTextIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import CurrencySelector from '../../components/common/CurrencySelector';

const ReportsPage = () => {
  const { token } = useAuth();
  const [selectedReport, setSelectedReport] = useState(null);
  const [period, setPeriod] = useState('current_month');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [showCurrencyConversion, setShowCurrencyConversion] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const reports = [
    {
      id: 'profit-loss',
      name: 'Profit & Loss',
      description: 'Income and expense summary',
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      endpoint: '/api/reports/profit-loss',
      hasPeriod: true,
    },
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity',
      icon: TableCellsIcon,
      color: 'bg-green-500',
      endpoint: '/api/reports/balance-sheet',
      hasPeriod: false,
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow',
      description: 'Cash inflows and outflows',
      icon: DocumentTextIcon,
      color: 'bg-yellow-500',
      endpoint: '/api/reports/cash-flow',
      hasPeriod: true,
    },
    {
      id: 'trial-balance',
      name: 'Trial Balance',
      description: 'Account balances verification',
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      endpoint: '/api/reports/trial-balance',
      hasPeriod: false,
    },
    {
      id: 'general-ledger',
      name: 'General Ledger',
      description: 'Detailed transaction listing',
      icon: DocumentTextIcon,
      color: 'bg-indigo-500',
      endpoint: '/api/reports/general-ledger',
      hasPeriod: true,
    },
  ];

  const periods = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const generateReport = async (format = 'json') => {
    // Validate report selection
    if (!selectedReport) {
      alert('Please select a report type first');
      return;
    }

    // Validate custom date range
    if (period === 'custom' && (!startDate || !endDate)) {
      alert('Please select both start and end dates for custom range');
      return;
    }

    setLoading(true);
    try {
      const report = reports.find(r => r.id === selectedReport);
      let url = `${BACKEND_URL}${report.endpoint}?format=${format}`;
      
      if (report.hasPeriod) {
        url += `&period=${period}`;
        if (period === 'custom' && startDate && endDate) {
          url += `&start_date=${startDate}&end_date=${endDate}`;
        }
      }
      
      // Add currency parameter for multi-currency reporting
      if (displayCurrency !== 'USD') {
        url += `&display_currency=${displayCurrency}`;
      }

      console.log('Generating report:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (format === 'json') {
          const data = await response.json();
          setReportData(data);
        } else {
          // Handle file download
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          
          // Extract filename from Content-Disposition header or create one
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `${selectedReport}_${new Date().toISOString().split('T')[0]}.${format}`;
          if (contentDisposition) {
            const matches = /filename="?([^"]+)"?/i.exec(contentDisposition);
            if (matches && matches[1]) {
              filename = matches[1];
            }
          }
          
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
        }
      } else {
        const errorText = await response.text();
        console.error('Report generation failed:', response.status, errorText);
        alert(`Failed to generate report: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Error generating report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = displayCurrency) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const renderReportData = () => {
    if (!reportData) return null;

    return (
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Report Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.report_name}
              </h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Generated: {new Date(reportData.generated_at).toLocaleString()}</span>
                {reportData.period && <span>Period: {reportData.period}</span>}
                {displayCurrency !== 'USD' && (
                  <span className="flex items-center text-blue-600 dark:text-blue-400">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Displayed in {displayCurrency}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => generateReport('pdf')}
                className="btn-secondary flex items-center text-sm"
                disabled={loading}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                PDF
              </button>
              <button
                onClick={() => generateReport('excel')}
                className="btn-secondary flex items-center text-sm"
                disabled={loading}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Excel
              </button>
              <button
                onClick={() => generateReport('csv')}
                className="btn-secondary flex items-center text-sm"
                disabled={loading}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Report Summary/Totals */}
        {(reportData.total_revenue !== undefined || reportData.net_income !== undefined || reportData.total_assets !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {reportData.total_revenue !== undefined && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Revenue</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {formatCurrency(reportData.total_revenue)}
                </div>
              </div>
            )}
            {reportData.total_expenses !== undefined && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="text-sm text-red-600 dark:text-red-400 font-medium">Total Expenses</div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                  {formatCurrency(reportData.total_expenses)}
                </div>
              </div>
            )}
            {reportData.net_income !== undefined && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Net Income</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  {formatCurrency(reportData.net_income)}
                </div>
              </div>
            )}
            {reportData.total_assets !== undefined && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Total Assets</div>
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                  {formatCurrency(reportData.total_assets)}
                </div>
              </div>
            )}
            {reportData.total_liabilities !== undefined && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Total Liabilities</div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                  {formatCurrency(reportData.total_liabilities)}
                </div>
              </div>
            )}
            {reportData.total_equity !== undefined && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Equity</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                  {formatCurrency(reportData.total_equity)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Report Data */}
        <div className="overflow-x-auto">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <details open>
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                View Detailed Report Data (JSON)
              </summary>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-96">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Generate and export comprehensive financial statements with multi-currency support
          </p>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {reports.map((report) => (
          <div 
            key={report.id} 
            onClick={() => {
              setSelectedReport(report.id);
              setReportData(null);
            }}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4 ${
              selectedReport === report.id ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`rounded-lg p-3 ${report.color}`}>
                <report.icon className="h-6 w-6 text-white" />
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{report.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{report.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Generator */}
      {selectedReport && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Generate {reports.find(r => r.id === selectedReport)?.name}
            </h2>
          </div>
          <div className="card-body space-y-4">
            {reports.find(r => r.id === selectedReport)?.hasPeriod && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Report Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="input w-full md:w-64"
                >
                  {periods.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>

                {period === 'custom' && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Currency Selection for Multi-Currency Reporting */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CurrencySelector
                    label={
                      <span className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        Display Currency
                      </span>
                    }
                    selectedCurrency={displayCurrency}
                    onCurrencyChange={setDisplayCurrency}
                    size="medium"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    All amounts will be displayed in this currency
                  </p>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCurrencyConversion}
                      onChange={(e) => setShowCurrencyConversion(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Show multi-currency breakdown
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => generateReport('json')}
                className="btn-primary flex items-center"
                disabled={loading}
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'View Report'}
              </button>
              
              <button
                onClick={() => generateReport('pdf')}
                className="btn-secondary flex items-center"
                disabled={loading}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export PDF
              </button>
              
              <button
                onClick={() => generateReport('excel')}
                className="btn-secondary flex items-center"
                disabled={loading}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export Excel
              </button>
              
              <button
                onClick={() => generateReport('csv')}
                className="btn-secondary flex items-center"
                disabled={loading}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Display */}
      {renderReportData()}
    </div>
  );
};

export default ReportsPage;