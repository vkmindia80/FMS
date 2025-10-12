import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  ClockIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ReportScheduling = ({ emailEnabled, onUpdate }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'profit_loss',
    frequency: 'monthly',
    export_format: 'pdf',
    time_of_day: '09:00',
    day_of_week: 'monday',
    day_of_month: 1,
    recipients: [''],
    cc_recipients: [],
    include_attachments: true,
    include_charts: true,
    enabled: true,
  });

  const reportTypes = [
    { value: 'profit_loss', label: 'Profit & Loss Statement' },
    { value: 'balance_sheet', label: 'Balance Sheet' },
    { value: 'cash_flow', label: 'Cash Flow Statement' },
    { value: 'trial_balance', label: 'Trial Balance' },
    { value: 'general_ledger', label: 'General Ledger' },
    { value: 'dashboard_summary', label: 'Dashboard Summary' },
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
  ];

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  const exportFormats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
  ];

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/report-scheduling/schedules');
      setSchedules(response.data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        name: schedule.name,
        report_type: schedule.report_type,
        frequency: schedule.frequency,
        export_format: schedule.export_format,
        time_of_day: schedule.time_of_day,
        day_of_week: schedule.day_of_week || 'monday',
        day_of_month: schedule.day_of_month || 1,
        recipients: schedule.recipients || [''],
        cc_recipients: schedule.cc_recipients || [],
        include_attachments: schedule.include_attachments !== false,
        include_charts: schedule.include_charts !== false,
        enabled: schedule.enabled !== false,
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        name: '',
        report_type: 'profit_loss',
        frequency: 'monthly',
        export_format: 'pdf',
        time_of_day: '09:00',
        day_of_week: 'monday',
        day_of_month: 1,
        recipients: [''],
        cc_recipients: [],
        include_attachments: true,
        include_charts: true,
        enabled: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
  };

  const handleAddRecipient = () => {
    setFormData({ ...formData, recipients: [...formData.recipients, ''] });
  };

  const handleUpdateRecipient = (index, value) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = value;
    setFormData({ ...formData, recipients: newRecipients });
  };

  const handleRemoveRecipient = (index) => {
    const newRecipients = formData.recipients.filter((_, i) => i !== index);
    setFormData({ ...formData, recipients: newRecipients });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate recipients
    const validRecipients = formData.recipients.filter((r) => r.trim() !== '');
    if (validRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    try {
      const submitData = {
        ...formData,
        recipients: validRecipients,
      };

      if (editingSchedule) {
        await api.put(`/report-scheduling/schedules/${editingSchedule.schedule_id}`, submitData);
        toast.success('Schedule updated successfully');
      } else {
        await api.post('/report-scheduling/schedules', submitData);
        toast.success('Schedule created successfully');
      }

      handleCloseModal();
      fetchSchedules();
      onUpdate();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error(error.response?.data?.detail || 'Failed to save schedule');
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      await api.delete(`/report-scheduling/schedules/${scheduleId}`);
      toast.success('Schedule deleted successfully');
      fetchSchedules();
      onUpdate();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleRunNow = async (scheduleId) => {
    try {
      await api.post(`/report-scheduling/schedules/${scheduleId}/run`);
      toast.success('Report generation started. You will receive an email shortly.');
    } catch (error) {
      console.error('Error running schedule:', error);
      toast.error('Failed to run schedule');
    }
  };

  const handleToggleEnabled = async (schedule) => {
    try {
      await api.put(`/report-scheduling/schedules/${schedule.schedule_id}`, {
        enabled: !schedule.enabled,
      });
      toast.success(`Schedule ${!schedule.enabled ? 'enabled' : 'disabled'}`);
      fetchSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!emailEnabled) {
    return (
      <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
              Email Integration Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Report scheduling requires email functionality to be enabled. Please configure and
                enable email integration in the Email Configuration tab before creating report
                schedules.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Report Schedules</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Automate report generation and email delivery
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-testid="create-schedule-button"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Schedule
        </button>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No Schedules Yet
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Get started by creating your first report schedule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.schedule_id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {schedule.name}
                    </h3>
                    {schedule.enabled ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      <span className="capitalize">
                        {reportTypes.find((t) => t.value === schedule.report_type)?.label}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-4 h-4 mr-2" />
                      <span className="capitalize">{schedule.frequency}</span>
                      {schedule.frequency === 'weekly' && schedule.day_of_week && (
                        <span className="ml-1">
                          ({schedule.day_of_week.charAt(0).toUpperCase() + schedule.day_of_week.slice(1)})
                        </span>
                      )}
                      {(schedule.frequency === 'monthly' || schedule.frequency === 'quarterly') &&
                        schedule.day_of_month && (
                          <span className="ml-1">(Day {schedule.day_of_month})</span>
                        )}
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      <span>{schedule.recipients?.length || 0} recipient(s)</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Next run:</span>
                      <span className="ml-1">
                        {schedule.next_run
                          ? new Date(schedule.next_run).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={schedule.enabled}
                    onChange={() => handleToggleEnabled(schedule)}
                    className={classNames(
                      schedule.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    )}
                  >
                    <span
                      className={classNames(
                        schedule.enabled ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                      )}
                    />
                  </Switch>

                  <button
                    onClick={() => handleRunNow(schedule.schedule_id)}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    title="Run now"
                  >
                    <PlayIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleOpenModal(schedule)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(schedule.schedule_id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75" onClick={handleCloseModal}></div>

            <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Schedule Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Schedule Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Monthly P&L Report"
                  />
                </div>

                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Report Type *
                  </label>
                  <select
                    value={formData.report_type}
                    onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frequency *
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {frequencies.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Export Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Export Format *
                    </label>
                    <select
                      value={formData.export_format}
                      onChange={(e) => setFormData({ ...formData, export_format: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {exportFormats.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Timing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time of Day *
                    </label>
                    <input
                      type="time"
                      value={formData.time_of_day}
                      onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {formData.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Day of Week *
                      </label>
                      <select
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {weekDays.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(formData.frequency === 'monthly' || formData.frequency === 'quarterly') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Day of Month *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.day_of_month}
                        onChange={(e) =>
                          setFormData({ ...formData, day_of_month: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipients *
                  </label>
                  {formData.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="email"
                        value={recipient}
                        onChange={(e) => handleUpdateRecipient(index, e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      {formData.recipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    + Add Recipient
                  </button>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.include_attachments}
                      onChange={(e) =>
                        setFormData({ ...formData, include_attachments: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Include report as attachment
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.include_charts}
                      onChange={(e) =>
                        setFormData({ ...formData, include_charts: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Include charts and visualizations
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Enable schedule immediately
                    </span>
                  </label>
                </div>
              </form>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  data-testid="save-schedule-button"
                >
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportScheduling;
