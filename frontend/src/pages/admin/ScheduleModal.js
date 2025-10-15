import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ScheduleModal = ({ schedule, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'profit_loss',
    frequency: 'monthly',
    export_format: 'pdf',
    time_of_day: '09:00',
    day_of_week: 'monday',
    day_of_month: 1,
    recipients: '',
    cc_recipients: '',
    enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name || '',
        report_type: schedule.report_type || 'profit_loss',
        frequency: schedule.frequency || 'monthly',
        export_format: schedule.export_format || 'pdf',
        time_of_day: schedule.time_of_day || '09:00',
        day_of_week: schedule.day_of_week || 'monday',
        day_of_month: schedule.day_of_month || 1,
        recipients: schedule.recipients?.join(', ') || '',
        cc_recipients: schedule.cc_recipients?.join(', ') || '',
        enabled: schedule.enabled !== false,
      });
    }
  }, [schedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate recipients
      const recipientsArray = formData.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      if (recipientsArray.length === 0) {
        setError('At least one recipient email is required');
        setLoading(false);
        return;
      }

      const ccRecipientsArray = formData.cc_recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      // Prepare request body
      const body = {
        name: formData.name,
        report_type: formData.report_type,
        frequency: formData.frequency,
        export_format: formData.export_format,
        time_of_day: formData.time_of_day,
        recipients: recipientsArray,
        enabled: formData.enabled,
      };

      // Add frequency-specific fields
      if (formData.frequency === 'weekly') {
        body.day_of_week = formData.day_of_week;
      } else if (formData.frequency === 'monthly' || formData.frequency === 'quarterly') {
        body.day_of_month = parseInt(formData.day_of_month);
      }

      if (ccRecipientsArray.length > 0) {
        body.cc_recipients = ccRecipientsArray;
      }

      // API call
      const url = schedule
        ? `${process.env.REACT_APP_BACKEND_URL}/api/report-scheduling/schedules/${schedule.schedule_id}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/report-scheduling/schedules`;

      const response = await fetch(url, {
        method: schedule ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSave();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to save schedule');
      }
    } catch (err) {
      setError('Error saving schedule: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {schedule ? 'Edit Schedule' : 'Create Report Schedule'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Schedule Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly P&L Report"
                  />
                </div>

                {/* Report Type and Format */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Type *
                    </label>
                    <select
                      className="input"
                      value={formData.report_type}
                      onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                    >
                      <option value="profit_loss">Profit & Loss</option>
                      <option value="balance_sheet">Balance Sheet</option>
                      <option value="cash_flow">Cash Flow</option>
                      <option value="trial_balance">Trial Balance</option>
                      <option value="general_ledger">General Ledger</option>
                      <option value="dashboard_summary">Dashboard Summary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Export Format *
                    </label>
                    <select
                      className="input"
                      value={formData.export_format}
                      onChange={(e) => setFormData({ ...formData, export_format: e.target.value })}
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency *
                  </label>
                  <select
                    className="input"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                {/* Time and Day Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time of Day *
                    </label>
                    <input
                      type="time"
                      className="input"
                      value={formData.time_of_day}
                      onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                    />
                  </div>

                  {formData.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Week *
                      </label>
                      <select
                        className="input"
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                      >
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                  )}

                  {(formData.frequency === 'monthly' || formData.frequency === 'quarterly') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Month *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="input"
                        value={formData.day_of_month}
                        onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients (Email Addresses) *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.recipients}
                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                    placeholder="email1@example.com, email2@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple email addresses with commas
                  </p>
                </div>

                {/* CC Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CC Recipients (Optional)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.cc_recipients}
                    onChange={(e) => setFormData({ ...formData, cc_recipients: e.target.value })}
                    placeholder="cc1@example.com, cc2@example.com"
                  />
                </div>

                {/* Enabled Toggle */}
                <div className="flex items-center">
                  <input
                    id="enabled"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                  <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                    Enable this schedule
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full sm:w-auto sm:ml-3"
              >
                {loading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
