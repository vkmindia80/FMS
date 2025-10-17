import React, { useState } from 'react';
import { 
  BookOpenIcon, 
  QuestionMarkCircleIcon, 
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const HelpCenter = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [downloading, setDownloading] = useState(false);

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/download/user-guide`);
      
      if (!response.ok) {
        throw new Error('Failed to download user guide');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AFMS_User_Guide_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download user guide. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: BookOpenIcon },
    { id: 'transactions', name: 'Transactions', icon: CreditCardIcon },
    { id: 'reports', name: 'Reports & Analytics', icon: ChartBarIcon },
    { id: 'users', name: 'User Management', icon: UserGroupIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'multi-currency', name: 'Multi-Currency', icon: GlobeAltIcon },
  ];

  const helpContent = {
    'getting-started': {
      title: 'Getting Started',
      sections: [
        {
          id: 'login',
          title: 'How to Login',
          content: `
            <h3 class="font-semibold text-lg mb-2">Login Credentials</h3>
            <p class="mb-3">Use the following credentials to access the system:</p>
            <ul class="list-disc ml-5 mb-4 space-y-1">
              <li><strong>Superadmin:</strong> superadmin@afms.system / admin123</li>
              <li><strong>Admin:</strong> admin@testcompany.com / admin123</li>
            </ul>
            <p>Navigate to the login page and enter your credentials to access the system.</p>
          `
        },
        {
          id: 'dashboard',
          title: 'Understanding the Dashboard',
          content: `
            <p class="mb-3">The dashboard provides a comprehensive overview of your financial health:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li><strong>Cash Balance:</strong> Your current liquid assets (cash, checking, savings accounts)</li>
              <li><strong>Monthly Revenue/Expenses:</strong> Current month financial performance</li>
              <li><strong>Monthly Profit:</strong> Net income for the current period</li>
              <li><strong>Total Assets/Liabilities:</strong> Overall financial position</li>
            </ul>
          `
        },
        {
          id: 'navigation',
          title: 'Navigation',
          content: `
            <p class="mb-3">The sidebar menu provides access to all system features:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li><strong>Dashboard:</strong> Financial overview and key metrics</li>
              <li><strong>Transactions:</strong> Record and manage financial transactions</li>
              <li><strong>Chart of Accounts:</strong> Manage your account structure</li>
              <li><strong>Documents:</strong> Upload and process financial documents</li>
              <li><strong>Reports:</strong> Generate financial reports</li>
              <li><strong>Administration:</strong> Manage users, roles, and companies (Admin only)</li>
            </ul>
          `
        }
      ]
    },
    'transactions': {
      title: 'Transactions',
      sections: [
        {
          id: 'create-transaction',
          title: 'Creating Transactions',
          content: `
            <h3 class="font-semibold text-lg mb-2">How to Create a Transaction</h3>
            <ol class="list-decimal ml-5 space-y-2">
              <li>Navigate to <strong>Transactions</strong> in the sidebar</li>
              <li>Click <strong>"Add Transaction"</strong> button</li>
              <li>Fill in the transaction details:
                <ul class="list-disc ml-5 mt-1">
                  <li>Transaction Type (Income/Expense)</li>
                  <li>Amount</li>
                  <li>Date</li>
                  <li>Account</li>
                  <li>Description</li>
                  <li>Currency (if multi-currency enabled)</li>
                </ul>
              </li>
              <li>Click <strong>"Save"</strong> to record the transaction</li>
            </ol>
          `
        },
        {
          id: 'edit-transaction',
          title: 'Editing & Deleting Transactions',
          content: `
            <p class="mb-3">To modify existing transactions:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li><strong>Edit:</strong> Click the edit icon next to the transaction, make changes, and save</li>
              <li><strong>Delete:</strong> Click the delete icon and confirm the action</li>
              <li><strong>Filter:</strong> Use the filter options to find specific transactions by date, type, or account</li>
            </ul>
            <p class="mt-3 text-yellow-700 dark:text-yellow-400">⚠️ Note: Deleted transactions cannot be recovered.</p>
          `
        },
        {
          id: 'import-transactions',
          title: 'Importing Transactions',
          content: `
            <p class="mb-3">Import transactions in bulk from CSV files:</p>
            <ol class="list-decimal ml-5 space-y-2">
              <li>Click <strong>"Import"</strong> button</li>
              <li>Download the CSV template</li>
              <li>Fill in your transaction data following the template format</li>
              <li>Upload the completed CSV file</li>
              <li>Review and confirm the import</li>
            </ol>
          `
        }
      ]
    },
    'reports': {
      title: 'Reports & Analytics',
      sections: [
        {
          id: 'financial-reports',
          title: 'Financial Reports',
          content: `
            <h3 class="font-semibold text-lg mb-2">Available Reports</h3>
            <ul class="list-disc ml-5 space-y-2 mb-4">
              <li><strong>Profit & Loss Statement:</strong> Revenue and expenses over a period</li>
              <li><strong>Balance Sheet:</strong> Assets, liabilities, and equity at a point in time</li>
              <li><strong>Cash Flow Statement:</strong> Cash movements categorized by operating, investing, and financing activities</li>
              <li><strong>Trial Balance:</strong> Account balances verification</li>
            </ul>
          `
        },
        {
          id: 'generate-report',
          title: 'Generating Reports',
          content: `
            <ol class="list-decimal ml-5 space-y-2">
              <li>Navigate to <strong>Reports</strong> section</li>
              <li>Select the report type you want to generate</li>
              <li>Choose the date range or period:
                <ul class="list-disc ml-5 mt-1">
                  <li>Current Month</li>
                  <li>Last Month</li>
                  <li>Current Quarter</li>
                  <li>Current Year</li>
                  <li>Custom Date Range</li>
                </ul>
              </li>
              <li>Select the format (PDF, Excel, CSV, or view online)</li>
              <li>Click <strong>"Generate Report"</strong></li>
            </ol>
          `
        },
        {
          id: 'schedule-reports',
          title: 'Scheduled Reports',
          content: `
            <p class="mb-3">Automate report generation and delivery:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li>Set up recurring reports (daily, weekly, monthly)</li>
              <li>Configure email recipients</li>
              <li>Choose report format and parameters</li>
              <li>Reports are automatically generated and emailed on schedule</li>
            </ul>
          `
        }
      ]
    },
    'users': {
      title: 'User Management',
      sections: [
        {
          id: 'user-roles',
          title: 'User Roles & Permissions',
          content: `
            <h3 class="font-semibold text-lg mb-2">Default Roles</h3>
            <ul class="list-disc ml-5 space-y-2 mb-4">
              <li><strong>Super Admin:</strong> Full system access, cross-company visibility</li>
              <li><strong>Administrator:</strong> Company-level management and configuration</li>
              <li><strong>Manager:</strong> Operational management within assigned areas</li>
              <li><strong>User:</strong> Basic access to view and create transactions</li>
              <li><strong>Auditor:</strong> Read-only access for compliance review</li>
            </ul>
          `
        },
        {
          id: 'create-user',
          title: 'Creating Users',
          content: `
            <p class="mb-3">Admin users can create new user accounts:</p>
            <ol class="list-decimal ml-5 space-y-2">
              <li>Navigate to <strong>Administration → Users</strong></li>
              <li>Click <strong>"Add User"</strong></li>
              <li>Enter user details:
                <ul class="list-disc ml-5 mt-1">
                  <li>Email address</li>
                  <li>Full name</li>
                  <li>Password</li>
                  <li>Role assignment</li>
                  <li>Company assignment</li>
                </ul>
              </li>
              <li>Click <strong>"Create User"</strong></li>
            </ol>
          `
        },
        {
          id: 'manage-permissions',
          title: 'Managing Permissions',
          content: `
            <p class="mb-3">Customize access control with granular permissions:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li>Create custom roles with specific permissions</li>
              <li>Assign multiple roles to users</li>
              <li>Control access to transactions, reports, documents, and settings</li>
              <li>Use permission templates for consistent role creation</li>
            </ul>
          `
        }
      ]
    },
    'settings': {
      title: 'Settings',
      sections: [
        {
          id: 'company-settings',
          title: 'Company Settings',
          content: `
            <p class="mb-3">Configure company-wide preferences:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li><strong>Base Currency:</strong> Primary currency for reporting</li>
              <li><strong>Fiscal Year:</strong> Set your fiscal year start date</li>
              <li><strong>Date Format:</strong> Choose preferred date display format</li>
              <li><strong>Number Format:</strong> Configure decimal and thousands separators</li>
              <li><strong>Timezone:</strong> Set company timezone for accurate timestamps</li>
            </ul>
          `
        },
        {
          id: 'integrations',
          title: 'Integrations',
          content: `
            <p class="mb-3">Connect with third-party services:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li><strong>Payment Gateways:</strong> Stripe, PayPal integration</li>
              <li><strong>Email Services:</strong> Configure SMTP for notifications</li>
              <li><strong>Banking:</strong> Connect bank accounts for transaction import</li>
              <li><strong>Cloud Storage:</strong> Document backup and storage</li>
            </ul>
          `
        },
        {
          id: 'notification-settings',
          title: 'Notifications',
          content: `
            <p class="mb-3">Manage notification preferences:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li>Email notifications for important events</li>
              <li>Report completion notifications</li>
              <li>Transaction approval alerts</li>
              <li>Low balance warnings</li>
            </ul>
          `
        }
      ]
    },
    'security': {
      title: 'Security',
      sections: [
        {
          id: 'password-security',
          title: 'Password Security',
          content: `
            <h3 class="font-semibold text-lg mb-2">Best Practices</h3>
            <ul class="list-disc ml-5 space-y-2">
              <li>Use strong passwords with at least 8 characters</li>
              <li>Include uppercase, lowercase, numbers, and special characters</li>
              <li>Change passwords regularly (recommended every 90 days)</li>
              <li>Never share passwords with others</li>
              <li>Use unique passwords for each account</li>
            </ul>
          `
        },
        {
          id: 'change-password',
          title: 'Changing Your Password',
          content: `
            <ol class="list-decimal ml-5 space-y-2">
              <li>Navigate to <strong>Settings</strong></li>
              <li>Click on <strong>"Change Password"</strong></li>
              <li>Enter your current password</li>
              <li>Enter your new password</li>
              <li>Confirm the new password</li>
              <li>Click <strong>"Update Password"</strong></li>
            </ol>
          `
        },
        {
          id: 'audit-logs',
          title: 'Audit Logs',
          content: `
            <p class="mb-3">Track all system activities for security and compliance:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li>View all user actions and changes</li>
              <li>Filter by user, action type, or date range</li>
              <li>Export audit logs for compliance reporting</li>
              <li>Monitor login attempts and access patterns</li>
            </ul>
          `
        }
      ]
    },
    'multi-currency': {
      title: 'Multi-Currency Support',
      sections: [
        {
          id: 'currency-setup',
          title: 'Setting Up Multi-Currency',
          content: `
            <p class="mb-3">Enable and configure multi-currency support:</p>
            <ol class="list-decimal ml-5 space-y-2">
              <li>Navigate to <strong>Settings → Currency</strong></li>
              <li>Enable multi-currency support</li>
              <li>Add currencies you want to use</li>
              <li>Set your base currency for reporting</li>
              <li>Configure automatic exchange rate updates</li>
            </ol>
          `
        },
        {
          id: 'exchange-rates',
          title: 'Exchange Rates',
          content: `
            <p class="mb-3">Exchange rates are automatically updated:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li>Daily automatic updates at 2 AM UTC</li>
              <li>Manual refresh available anytime</li>
              <li>Historical rates maintained for accurate reporting</li>
              <li>View current and historical exchange rates</li>
            </ul>
          `
        },
        {
          id: 'multi-currency-transactions',
          title: 'Multi-Currency Transactions',
          content: `
            <p class="mb-3">Work with multiple currencies:</p>
            <ul class="list-disc ml-5 space-y-2">
              <li>Select currency for each transaction</li>
              <li>Automatic conversion to base currency</li>
              <li>View amounts in both transaction and base currency</li>
              <li>Reports can be generated in any supported currency</li>
            </ul>
          `
        }
      ]
    }
  };

  const currentContent = helpContent[activeCategory];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="help-center-title">
          Help Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find answers and learn how to use the Advanced Finance Management System
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
              Categories
            </h2>
            <nav className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    data-testid={`help-category-${category.id}`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {category.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Links */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 p-4 mt-6">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
              Need More Help?
            </h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
              <p>📧 Email: support@afms.system</p>
              <p>📞 Phone: +1 (555) 123-4567</p>
              <p>🕐 Mon-Fri, 9 AM - 5 PM EST</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentContent.title}
              </h2>
              <div className="h-1 w-20 bg-blue-600 rounded"></div>
            </div>

            <div className="space-y-4">
              {currentContent.sections.map((section) => (
                <div
                  key={section.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  data-testid={`help-section-${section.id}`}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-left">
                        {section.title}
                      </h3>
                    </div>
                    {expandedSection === section.id ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedSection === section.id && (
                    <div className="px-5 py-4 bg-white dark:bg-gray-800">
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
              <DocumentTextIcon className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Video Tutorials</h3>
              <p className="text-blue-100 text-sm mb-4">
                Watch step-by-step video guides for common tasks
              </p>
              <button className="text-sm font-medium underline hover:no-underline">
                Coming Soon
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
              <BookOpenIcon className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">User Guide PDF</h3>
              <p className="text-purple-100 text-sm mb-4">
                Download the complete user manual
              </p>
              <button className="text-sm font-medium underline hover:no-underline">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
