import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  DocumentTextIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const ReportsPage = () => {
  const { token } = useAuth();
  const [selectedReport, setSelectedReport] = useState(null);
  const [period, setPeriod] = useState('current_month');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const renderReportData = () => {
    if (!reportData) return null;

    return (
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{reportData.report_name}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('pdf')}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              PDF
            </button>
            <button
              onClick={() => generateReport('excel')}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Excel
            </button>
            <button
              onClick={() => generateReport('csv')}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              CSV
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Generated: {new Date(reportData.generated_at).toLocaleString()}
        </div>

        <div className="overflow-x-auto">
          <pre className="text-sm bg-gray-50 p-4 rounded border">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-2 text-gray-600">
            Generate and export comprehensive financial statements
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
            className={`card hover:shadow-md transition-shadow cursor-pointer ${
              selectedReport === report.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="card-body">
              <div className="flex flex-col items-center text-center">
                <div className={`rounded-lg p-3 ${report.color}`}>
                  <report.icon className="h-6 w-6 text-white" />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-gray-900">{report.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                </div>
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