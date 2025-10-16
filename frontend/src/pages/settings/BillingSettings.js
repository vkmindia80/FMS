import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCardIcon, DocumentTextIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

const BillingSettings = () => {
  const { getAccessToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  const isAdmin = user?.role === 'admin' || user?.role === 'corporate';

  useEffect(() => {
    fetchBillingInfo();
    // eslint-disable-next-line
  }, []);

  const fetchBillingInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/company`, {
        headers: { 'Authorization': `Bearer ${getAccessToken()}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription || {});
      }
    } catch (error) {
      console.error('Error loading billing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Individual',
      price: 'Free',
      period: 'forever',
      features: [
        'Up to 100 transactions/month',
        'Basic reporting',
        'Email support',
        '1 user'
      ],
      color: 'from-gray-400 to-gray-600'
    },
    {
      name: 'Business',
      price: '$49',
      period: '/month',
      features: [
        'Unlimited transactions',
        'Advanced reporting',
        'Priority support',
        'Up to 5 users',
        'Bank connections',
        'Multi-currency support'
      ],
      popular: true,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      name: 'Corporate',
      price: '$199',
      period: '/month',
      features: [
        'Everything in Business',
        'Unlimited users',
        'Custom integrations',
        'Dedicated account manager',
        'Advanced security features',
        'API access'
      ],
      color: 'from-purple-500 to-pink-600'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Loading billing information...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="billing-settings">
      {!isAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            ℹ️ Only company admins can manage billing and subscriptions. Contact your administrator for changes.
          </p>
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2" />
            Current Subscription
          </h2>
          <p className="mt-1 text-green-100">Your current plan and billing details</p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-600">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize mb-2">
                {subscription?.plan || 'Individual'} Plan
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Status:</span>
                  <span className={`flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    subscription?.status === 'active' 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {subscription?.status === 'active' ? '✓ Active' : 'Inactive'}
                  </span>
                </div>
                {subscription?.expires_at && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="mr-1">📅</span>
                    Next billing: {new Date(subscription.expires_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            {isAdmin && (
              <button className="px-5 py-2.5 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium border-2 border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-all cursor-not-allowed" disabled>
                Manage Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Available Plans</h2>
          <p className="mt-1 text-indigo-100">Choose the plan that works best for your business</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                  plan.popular
                    ? 'border-primary-500 shadow-2xl shadow-primary-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 left-0">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-2 text-sm font-bold">
                      ⭐ MOST POPULAR
                    </div>
                  </div>
                )}
                <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                  <div className={`inline-block px-4 py-2 rounded-xl bg-gradient-to-r ${plan.color} mb-6`}>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    {plan.period && <span className="text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>}
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      subscription?.plan?.toLowerCase() === plan.name.toLowerCase()
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    disabled={!isAdmin || subscription?.plan?.toLowerCase() === plan.name.toLowerCase()}
                  >
                    {subscription?.plan?.toLowerCase() === plan.name.toLowerCase() ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <CreditCardIcon className="h-6 w-6 mr-2" />
            Payment Method
          </h2>
          <p className="mt-1 text-pink-100">Manage your payment methods</p>
        </div>

        <div className="p-8">
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-6">
              <CreditCardIcon className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-2">No payment method on file</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Add a credit card or PayPal account to manage subscriptions</p>
            {isAdmin && (
              <button className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg cursor-not-allowed" disabled>
                Add Payment Method (Coming Soon)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <DocumentTextIcon className="h-6 w-6 mr-2" />
            Billing History
          </h2>
          <p className="mt-1 text-cyan-100">View and download past invoices</p>
        </div>

        <div className="p-8">
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-6">
              <DocumentTextIcon className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-2">No billing history available</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your invoices and payment history will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;
