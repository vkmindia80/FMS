import React, { useState, useEffect } from 'react';
import { PlusIcon, ClockIcon, EnvelopeIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import ScheduleModal from './ScheduleModal';
import ScheduleHistoryModal from './ScheduleHistoryModal';

const ReportSchedulingPage = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/report-scheduling/schedules`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSchedule(null);
    setShowModal(true);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowModal(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/report-scheduling/schedules/${scheduleId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (response.ok) {
        fetchSchedules();
      } else {
        alert('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error deleting schedule');
    }
  };

  const handleToggleEnabled = async (schedule) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/report-scheduling/schedules/${schedule.schedule_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enabled: !schedule.enabled,
          }),
        }
      );

      if (response.ok) {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleRunNow = async (scheduleId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/report-scheduling/schedules/${scheduleId}/run`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchSchedules();
      } else {
        alert('Failed to run schedule');
      }
    } catch (error) {
      console.error('Error running schedule:', error);
      alert('Error running schedule');
    }
  };

  const handleViewHistory = (scheduleId) => {
    setSelectedScheduleId(scheduleId);
    setShowHistoryModal(true);
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      profit_loss: 'Profit & Loss',
      balance_sheet: 'Balance Sheet',
      cash_flow: 'Cash Flow',
      trial_balance: 'Trial Balance',
      general_ledger: 'General Ledger',
      dashboard_summary: 'Dashboard Summary',
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
    };
    return labels[frequency] || frequency;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Scheduling</h1>
          <p className="mt-2 text-gray-600">
            Automate financial report generation and email delivery
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Schedule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Schedules</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{schedules.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-success-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Schedules</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {schedules.filter(s => s.enabled).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Runs</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {schedules.reduce((sum, s) => sum + (s.total_runs || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Scheduled Reports</h2>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-500">Loading schedules...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new report schedule.
              </p>
              <div className="mt-6">
                <button onClick={handleCreate} className="btn btn-primary">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Schedule
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.schedule_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                        <div className="text-sm text-gray-500">
                          {schedule.export_format.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getReportTypeLabel(schedule.report_type)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getFrequencyLabel(schedule.frequency)}
                        </div>
                        <div className="text-sm text-gray-500">
                          at {schedule.time_of_day}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(schedule.next_run)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleEnabled(schedule)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            schedule.enabled
                              ? 'bg-success-100 text-success-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {schedule.enabled ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleRunNow(schedule.schedule_id)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Run Now"
                        >
                          Run
                        </button>
                        <button
                          onClick={() => handleViewHistory(schedule.schedule_id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View History"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.schedule_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <ScheduleModal
          schedule={editingSchedule}
          onClose={() => {
            setShowModal(false);
            setEditingSchedule(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingSchedule(null);
            fetchSchedules();
          }}
        />
      )}

      {showHistoryModal && (
        <ScheduleHistoryModal
          scheduleId={selectedScheduleId}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedScheduleId(null);
          }}
        />
      )}
    </div>
  );
};

export default ReportSchedulingPage;
