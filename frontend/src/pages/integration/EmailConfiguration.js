import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const EmailConfiguration = ({ integrationStatus, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [provider, setProvider] = useState('smtp');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  // SMTP Configuration
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    use_tls: true,
    use_ssl: false,
    from_email: '',
    from_name: 'AFMS Notifications',
  });

  // SendGrid Configuration
  const [sendgridConfig, setSendgridConfig] = useState({
    api_key: '',
    from_email: '',
    from_name: 'AFMS Notifications',
  });

  // AWS SES Configuration
  const [awsConfig, setAwsConfig] = useState({
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1',
    from_email: '',
    from_name: 'AFMS Notifications',
  });

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      const response = await api.get('/integrations/config');
      const data = response.data;

      if (data.email) {
        setEmailEnabled(data.email.enabled || false);
        setProvider(data.email.provider || 'smtp');

        if (data.email.smtp_config) {
          setSmtpConfig({ ...smtpConfig, ...data.email.smtp_config });
        }
        if (data.email.sendgrid_config) {
          setSendgridConfig({ ...sendgridConfig, ...data.email.sendgrid_config });
        }
        if (data.email.aws_config) {
          setAwsConfig({ ...awsConfig, ...data.email.aws_config });
        }
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      toast.error('Failed to load email configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmail = async (enabled) => {
    try {
      await api.post('/integrations/email/toggle', { enabled });
      setEmailEnabled(enabled);
      toast.success(`Email ${enabled ? 'enabled' : 'disabled'} successfully`);
      onUpdate();
    } catch (error) {
      console.error('Error toggling email:', error);
      toast.error(error.response?.data?.detail || 'Failed to toggle email');
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      setLoading(true);

      const emailConfig = {
        provider,
        enabled: emailEnabled,
        smtp_config: provider === 'smtp' || provider === 'gmail' ? smtpConfig : null,
        sendgrid_config: provider === 'sendgrid' ? sendgridConfig : null,
        aws_config: provider === 'aws_ses' ? awsConfig : null,
      };

      await api.put('/integrations/config', { email: emailConfig });
      toast.success('Email configuration saved successfully');
      onUpdate();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error(error.response?.data?.detail || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    try {
      setSending(true);
      await api.post('/integrations/email/test', {
        recipient: testEmail,
        subject: 'Test Email from AFMS',
        body: 'This is a test email to verify your email configuration is working correctly.',
      });
      toast.success(`Test email sent to ${testEmail}`);
      setTestEmail('');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error(error.response?.data?.detail || 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  if (loading && !emailEnabled) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Email Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure email delivery for report scheduling and notifications
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Functionality
          </span>
          <Switch
            checked={emailEnabled}
            onChange={handleToggleEmail}
            className={classNames(
              emailEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
              'relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
            data-testid="email-toggle"
          >
            <span
              aria-hidden="true"
              className={classNames(
                emailEnabled ? 'translate-x-8' : 'translate-x-0',
                'pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
              )}
            />
          </Switch>
        </div>
      </div>

      {!emailEnabled && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Email Functionality Disabled
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  Enable email functionality to send scheduled reports and notifications. Make sure to
                  configure your email settings below before enabling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Provider
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          data-testid="provider-select"
        >
          <option value="smtp">SMTP (Generic)</option>
          <option value="gmail">Gmail SMTP</option>
          <option value="sendgrid">SendGrid</option>
          <option value="aws_ses">AWS SES</option>
        </select>
      </div>

      {/* SMTP Configuration */}
      {(provider === 'smtp' || provider === 'gmail') && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {provider === 'gmail' ? 'Gmail SMTP Settings' : 'SMTP Settings'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                placeholder={provider === 'gmail' ? 'smtp.gmail.com' : 'smtp.example.com'}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Port
              </label>
              <input
                type="number"
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={smtpConfig.username}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                placeholder="your-email@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={smtpConfig.password}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Email
              </label>
              <input
                type="email"
                value={smtpConfig.from_email}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, from_email: e.target.value })}
                placeholder="noreply@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Name
              </label>
              <input
                type="text"
                value={smtpConfig.from_name}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, from_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={smtpConfig.use_tls}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, use_tls: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use TLS</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={smtpConfig.use_ssl}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, use_ssl: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use SSL</span>
            </label>
          </div>
        </div>
      )}

      {/* SendGrid Configuration */}
      {provider === 'sendgrid' && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">SendGrid Settings</h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={sendgridConfig.api_key}
                onChange={(e) => setSendgridConfig({ ...sendgridConfig, api_key: e.target.value })}
                placeholder="SG.••••••••••••••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Email
              </label>
              <input
                type="email"
                value={sendgridConfig.from_email}
                onChange={(e) =>
                  setSendgridConfig({ ...sendgridConfig, from_email: e.target.value })
                }
                placeholder="noreply@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Name
              </label>
              <input
                type="text"
                value={sendgridConfig.from_name}
                onChange={(e) =>
                  setSendgridConfig({ ...sendgridConfig, from_name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* AWS SES Configuration */}
      {provider === 'aws_ses' && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">AWS SES Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Key ID
              </label>
              <input
                type="text"
                value={awsConfig.access_key_id}
                onChange={(e) => setAwsConfig({ ...awsConfig, access_key_id: e.target.value })}
                placeholder="AKIA••••••••••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Secret Access Key
              </label>
              <input
                type="password"
                value={awsConfig.secret_access_key}
                onChange={(e) =>
                  setAwsConfig({ ...awsConfig, secret_access_key: e.target.value })
                }
                placeholder="••••••••••••••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Region
              </label>
              <select
                value={awsConfig.region}
                onChange={(e) => setAwsConfig({ ...awsConfig, region: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">EU (Ireland)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Email
              </label>
              <input
                type="email"
                value={awsConfig.from_email}
                onChange={(e) => setAwsConfig({ ...awsConfig, from_email: e.target.value })}
                placeholder="noreply@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSaveConfiguration}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="save-config-button"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Save Configuration
            </>
          )}
        </button>
      </div>

      {/* Test Email Section */}
      {emailEnabled && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Test Email Configuration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Send a test email to verify your configuration is working correctly.
          </p>

          <div className="flex items-center space-x-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleTestEmail}
              disabled={sending || !testEmail}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="send-test-email-button"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                  Send Test
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailConfiguration;
