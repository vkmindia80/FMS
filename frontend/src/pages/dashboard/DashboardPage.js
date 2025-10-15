import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import {
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import CurrencyConverter from '../../components/common/CurrencyConverter';

const DashboardPage = () => {
  const { user } = useAuth();
  const { darkMode, currentScheme } = useTheme();
  const navigate = useNavigate();
  const [showAmounts, setShowAmounts] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [generatingDemo, setGeneratingDemo] = useState(false);

  // Real data from API
  const [dashboardData, setDashboardData] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    profit: 0,
    transactions: 0,
    documents: 0,
    pendingApprovals: 0,
  });

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('afms_access_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/reports/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData({
          balance: data.summary?.cash_balance || 0,
          income: data.summary?.current_month_revenue || 0,
          expenses: data.summary?.current_month_expenses || 0,
          profit: data.summary?.current_month_profit || 0,
          transactions: data.counts?.total_transactions || 0,
          documents: data.counts?.total_documents || 0,
          pendingApprovals: data.counts?.pending_transactions || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDemoData = async () => {
    if (!window.confirm('This will generate sample data for testing. This process may take up to 2 minutes. Continue?')) return;
    
    setGeneratingDemo(true);
    try {
      toast.loading('Generating demo data... Please wait...', {
        id: 'demo-data-loading',
        duration: Infinity
      });

      const token = localStorage.getItem('afms_access_token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/auth/generate-demo-data`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      toast.dismiss('demo-data-loading');
      
      if (response.ok) {
        const result = await response.json();
        toast.success(
          `Demo data generated successfully!\n\n` +
          `📊 ${result.data.accounts_created} accounts\n` +
          `💰 ${result.data.transactions_created} transactions\n` +
          `📄 ${result.data.documents_created} documents`,
          {
            duration: 8000,
            style: {
              minWidth: '350px',
              whiteSpace: 'pre-line'
            }
          }
        );
        fetchDashboardData(); // Refresh dashboard
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to generate demo data. Please try again.', {
          duration: 5000
        });
      }
    } catch (error) {
      toast.dismiss('demo-data-loading');
      console.error('Error generating demo data:', error);
      
      if (error.name === 'AbortError') {
        toast.error('Request timed out. The demo data generation is taking too long. Please try again later.', {
          duration: 6000
        });
      } else {
        toast.error(error.message || 'Error generating demo data. Please check your connection and try again.', {
          duration: 5000
        });
      }
    } finally {
      setGeneratingDemo(false);
    }
  };

  const timeframeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  // Mock chart data
  const revenueData = [
    { name: 'Jan', income: 24000, expenses: 18000 },
    { name: 'Feb', income: 28000, expenses: 19000 },
    { name: 'Mar', income: 32000, expenses: 21000 },
    { name: 'Apr', income: 35000, expenses: 22000 },
    { name: 'May', income: 31000, expenses: 20000 },
    { name: 'Jun', income: 38000, expenses: 24000 },
  ];

  const categoryData = [
    { name: 'Office Supplies', value: 4800, color: '#3B82F6' },
    { name: 'Marketing', value: 7200, color: '#10B981' },
    { name: 'Travel', value: 3200, color: '#F59E0B' },
    { name: 'Software', value: 2400, color: '#EF4444' },
    { name: 'Other', value: 1340, color: '#8B5CF6' },
  ];

  const recentTransactions = [
    {
      id: 1,
      description: 'Office Rent - June 2024',
      amount: -2400.00,
      category: 'Office Expenses',
      date: '2024-06-01',
      type: 'expense',
    },
    {
      id: 2,
      description: 'Client Payment - ABC Corp',
      amount: 8500.00,
      category: 'Revenue',
      date: '2024-05-30',
      type: 'income',
    },
    {
      id: 3,
      description: 'Software License - Adobe',
      amount: -52.99,
      category: 'Software',
      date: '2024-05-29',
      type: 'expense',
    },
    {
      id: 4,
      description: 'Marketing Campaign - Google Ads',
      amount: -850.00,
      category: 'Marketing',
      date: '2024-05-28',
      type: 'expense',
    },
  ];

  const formatCurrency = (amount) => {
    if (!showAmounts) return '••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {formatCurrency(value)}
          </p>
          {change && (
            <div className="flex items-center mt-2">
              {changeType === 'positive' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {change}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
      
      {/* Gradient overlay */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 rounded-full -translate-y-16 translate-x-16`} />
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's what's happening with your finances today.
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Generate Demo Data Button */}
          <button
            onClick={handleGenerateDemoData}
            disabled={generatingDemo}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="generate-demo-btn"
          >
            {generatingDemo ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <ChartBarIcon className="h-4 w-4" />
                <span>Generate Data</span>
              </>
            )}
          </button>
          
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeframeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Toggle amounts visibility */}
          <button
            onClick={() => setShowAmounts(!showAmounts)}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            data-testid="toggle-amounts"
          >
            {showAmounts ? (
              <EyeIcon className="h-5 w-5" />
            ) : (
              <EyeSlashIcon className="h-5 w-5" />
            )}
          </button>
          
          {/* Quick Add Button */}
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl">
            <PlusIcon className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Cash Balance"
          value={dashboardData.balance}
          change={null}
          changeType="positive"
          icon={BanknotesIcon}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Monthly Income"
          value={dashboardData.income}
          change={null}
          changeType="positive"
          icon={ArrowTrendingUpIcon}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          title="Monthly Expenses"
          value={dashboardData.expenses}
          change={null}
          changeType="negative"
          icon={ArrowTrendingDownIcon}
          color="bg-gradient-to-br from-orange-500 to-red-500"
        />
        <StatCard
          title="Monthly Profit"
          value={dashboardData.profit}
          change={null}
          changeType={dashboardData.profit >= 0 ? "positive" : "negative"}
          icon={CreditCardIcon}
          color="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="name" 
                stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                fontSize={12}
              />
              <YAxis 
                stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: darkMode ? '#F9FAFB' : '#111827'
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Categories</h3>
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-48 h-48 mb-4 lg:mb-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      color: darkMode ? '#F9FAFB' : '#111827'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 lg:ml-6 space-y-3 w-full">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(category.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Currency Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Converter Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <CurrencyConverter 
            embedded={true}
            showHistory={true}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/transactions')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500">
                  <PlusIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">New Transaction</span>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </button>
            
            <button 
              onClick={() => navigate('/documents')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-500">
                  <DocumentTextIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Upload Document</span>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
            </button>
            
            <button 
              onClick={() => navigate('/reports')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">View Reports</span>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors">
            View all →
          </button>
        </div>
        
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'income' 
                    ? 'bg-green-100 dark:bg-green-900/20' 
                    : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {transaction.type === 'income' ? (
                    <ArrowTopRightOnSquareIcon className={`h-4 w-4 ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  ) : (
                    <ArrowRightIcon className="h-4 w-4 text-red-600 transform rotate-45" />
                  )}
                </div>
                
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {transaction.description}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className={`font-semibold ${
                transaction.type === 'income' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {transaction.type === 'income' ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;