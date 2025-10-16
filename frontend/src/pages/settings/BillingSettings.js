import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCardIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const BillingSettings = () => {
  const { getAccessToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  const isAdmin = user?.role === 'admin' || user?.role === 'corporate';

  useEffect(() => {
    fetchBillingInfo();
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
      features: [
        'Up to 100 transactions/month',
        'Basic reporting',
        'Email support',
        '1 user'
      ]
    },
    {
      name: 'Business',
      price: '$49/month',
      features: [
        'Unlimited transactions',
        'Advanced reporting',
        'Priority support',
        'Up to 5 users',
        'Bank connections',
        'Multi-currency support'
      ],
      popular: true
    },
    {
      name: 'Corporate',
      price: '$199/month',
      features: [
        'Everything in Business',
        'Unlimited users',
        'Custom integrations',
        'Dedicated account manager',
        'Advanced security features',
        'API access'
      ]
    }
  ];

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading billing information...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="billing-settings">
      {!isAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ℹ️ Only company admins can manage billing and subscriptions. Contact your administrator for changes.
          </p>
        </div>
      )}

      {/* Current Subscription */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Subscription</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Your current plan and billing details
          </p>
        </div>

        <div className="card-body">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {subscription?.plan || 'Individual'} Plan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Status: <span className={`font-medium ${
                  subscription?.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {subscription?.status === 'active' ? '✓ Active' : 'Inactive'}
                </span>
              </p>
              {subscription?.expires_at && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Next billing date: {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
            {isAdmin && (
              <button className="btn-secondary" disabled>
                Manage Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available Plans</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Choose the plan that works best for your business
          </p>
        </div>

        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative border-2 rounded-lg p-6 ${
                  plan.popular
                    ? 'border-primary-500 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-6 transform -translate-y-1/2">
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full ${
                    subscription?.plan?.toLowerCase() === plan.name.toLowerCase()
                      ? 'btn-secondary'
                      : 'btn-primary'
                  }`}
                  disabled={!isAdmin || subscription?.plan?.toLowerCase() === plan.name.toLowerCase()}
                >
                  {subscription?.plan?.toLowerCase() === plan.name.toLowerCase() ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2 text-primary-500" />
            Payment Method
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your payment methods
          </p>
        </div>

        <div className="card-body">
          <div className="text-center py-8">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              No payment method on file
            </p>
            {isAdmin && (
              <button className="mt-4 btn-secondary" disabled>
                Add Payment Method
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-primary-500" />
            Billing History
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View and download past invoices
          </p>
        </div>

        <div className="card-body">
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              No billing history available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;
