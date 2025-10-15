import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  CalendarIcon, 
  ClockIcon, 
  EnvelopeIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  TrashIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const ReportSchedulingPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/report-scheduling/schedules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      } else {
        toast.error('Failed to load report schedules');
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleCreateSchedule = async (scheduleData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/report-scheduling/schedules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (response.ok) {
        toast.success('Report schedule created successfully');
        setShowCreateModal(false);
        loadSchedules();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
    }
  };

  const handleRunSchedule = async (scheduleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/report-scheduling/schedules/${scheduleId}/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Report generation started');
        loadSchedules();
      } else {
        toast.error('Failed to run schedule');
      }
    } catch (error) {
      console.error('Error running schedule:', error);
      toast.error('Failed to run schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/report-scheduling/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Schedule deleted successfully');
        loadSchedules();
      } else {
        toast.error('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const formatFrequency = (frequency) => {
    const map = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly'
    };
    return map[frequency] || frequency;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" data-testid="report-scheduling-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <CalendarIcon className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
              Report Scheduling
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Automate your financial reports and email delivery
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            data-testid="create-schedule-btn"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Schedule</span>
          </button>
        </div>

        {/* Schedules Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Report Schedules Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first automated report schedule to receive financial reports on a regular basis
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Schedule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onRun={handleRunSchedule}
                onDelete={handleDeleteSchedule}
                formatFrequency={formatFrequency}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <CreateScheduleModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateSchedule}
            editingSchedule={editingSchedule}
          />
        )}
      </div>
    </div>
  );
};

// Schedule Card Component
const ScheduleCard = ({ schedule, onRun, onDelete, formatFrequency, formatDate }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {schedule.report_name || schedule.report_type.replace('_', ' ').toUpperCase()}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              schedule.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {schedule.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Schedule Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <ClockIcon className="w-4 h-4 mr-2" />
            <span>{formatFrequency(schedule.frequency)}</span>
            {schedule.time_of_day && (
              <span className="ml-2">at {schedule.time_of_day}</span>
            )}
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            <span>{schedule.export_format.toUpperCase()}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            <span>{schedule.email_recipients.length} recipient(s)</span>
          </div>
        </div>

        {/* Last Run Info */}
        {schedule.last_run_at && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            Last run: {formatDate(schedule.last_run_at)}
            {schedule.last_run_status && (
              <span className={`ml-2 ${
                schedule.last_run_status === 'success' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ({schedule.last_run_status})
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onRun(schedule.id)}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center justify-center transition-colors"
            title="Run now"
          >
            <PlayIcon className="w-4 h-4 mr-1" />
            Run Now
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            title="Delete schedule"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Schedule Modal Component
const CreateScheduleModal = ({ onClose, onSubmit, editingSchedule }) => {
  const [formData, setFormData] = useState({
    report_type: 'profit_loss',
    report_name: '',
    frequency: 'monthly',
    time_of_day: '09:00',
    export_format: 'pdf',
    email_recipients: [''],
    email_cc: [],
    report_parameters: {
      period: 'current_month'
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty email recipients
    const cleanedData = {
      ...formData,
      email_recipients: formData.email_recipients.filter(email => email.trim() !== ''),
      email_cc: formData.email_cc.filter(email => email.trim() !== '')
    };
    
    onSubmit(cleanedData);
  };

  const addRecipient = () => {
    setFormData({
      ...formData,
      email_recipients: [...formData.email_recipients, '']
    });
  };

  const updateRecipient = (index, value) => {
    const newRecipients = [...formData.email_recipients];
    newRecipients[index] = value;
    setFormData({ ...formData, email_recipients: newRecipients });
  };

  const removeRecipient = (index) => {
    const newRecipients = formData.email_recipients.filter((_, i) => i !== index);
    setFormData({ ...formData, email_recipients: newRecipients });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create Report Schedule
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Set up automated report generation and email delivery
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type *
            </label>
            <select
              required
              value={formData.report_type}
              onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="profit_loss">Profit & Loss Statement</option>
              <option value="balance_sheet">Balance Sheet</option>
              <option value="cash_flow">Cash Flow Statement</option>
              <option value="trial_balance">Trial Balance</option>
              <option value="general_ledger">General Ledger</option>
            </select>
          </div>

          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule Name (Optional)
            </label>
            <input
              type="text"
              value={formData.report_name}
              onChange={(e) => setFormData({ ...formData, report_name: e.target.value })}
              placeholder="e.g., Monthly P&L for Executives"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Frequency and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency *
              </label>
              <select
                required
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time of Day *
              </label>
              <input
                type="time"
                required
                value={formData.time_of_day}
                onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['pdf', 'excel', 'csv'].map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => setFormData({ ...formData, export_format: format })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.export_format === format
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Email Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Recipients *
            </label>
            <div className="space-y-2">
              {formData.email_recipients.map((email, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    placeholder="recipient@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {formData.email_recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecipient(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRecipient}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Another Recipient
              </button>
            </div>
          </div>

          {/* Report Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Period
            </label>
            <select
              value={formData.report_parameters.period}
              onChange={(e) => setFormData({ 
                ...formData, 
                report_parameters: { ...formData.report_parameters, period: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="current_year">Current Year</option>
              <option value="last_year">Last Year</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportSchedulingPage;
