import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { currencyAPI } from '../../services/api';
import CurrencySelector from '../../components/common/CurrencySelector';
import toast from 'react-hot-toast';

const ExchangeRatesPage = () => {
  const [rates, setRates] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterBaseCurrency, setFilterBaseCurrency] = useState('USD');
  const [formData, setFormData] = useState({
    base_currency: 'USD',
    target_currency: 'EUR',
    rate: '',
    source: 'manual',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBaseCurrency]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currenciesData, ratesData] = await Promise.all([
        currencyAPI.getCurrencies(),
        currencyAPI.getExchangeRates({ base_currency: filterBaseCurrency, limit: 100 }),
      ]);
      setCurrencies(currenciesData);
      setRates(ratesData);
    } catch (error) {
      console.error('Error loading exchange rate data:', error);
      toast.error('Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRates = async () => {
    if (!window.confirm('This will fetch the latest exchange rates from the API. Continue?')) {
      return;
    }

    setUpdating(true);
    try {
      const result = await currencyAPI.updateExchangeRates(filterBaseCurrency);
      
      if (result.success) {
        toast.success(
          `Successfully updated ${result.updated_count} exchange rates!`,
          { duration: 4000 }
        );
        await loadData();
      } else {
        toast.error(result.message || 'Failed to update rates');
      }
    } catch (error) {
      console.error('Error updating rates:', error);
      toast.error('Failed to update exchange rates');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddRate = async (e) => {
    e.preventDefault();

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      toast.error('Please enter a valid exchange rate');
      return;
    }

    try {
      await currencyAPI.createExchangeRate({
        base_currency: formData.base_currency,
        target_currency: formData.target_currency,
        rate: parseFloat(formData.rate),
        source: formData.source,
      });

      toast.success('Exchange rate added successfully!');
      setShowAddModal(false);
      setFormData({
        base_currency: 'USD',
        target_currency: 'EUR',
        rate: '',
        source: 'manual',
      });
      await loadData();
    } catch (error) {
      console.error('Error adding rate:', error);
      toast.error('Failed to add exchange rate');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrencySymbol = (code) => {
    const currency = currencies.find((c) => c.code === code);
    return currency?.symbol || code;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Exchange Rate Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage and update currency exchange rates for multi-currency accounting
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-secondary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Manual Rate
            </button>
            <button
              onClick={handleUpdateRates}
              disabled={updating}
              className="btn-primary flex items-center"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Updating...' : 'Update Rates'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Total Currencies
              </p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                {currencies.length}
              </p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 text-blue-500 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Active Rates
              </p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
                {rates.length}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-green-500 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                Base Currency
              </p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-2">
                {filterBaseCurrency}
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-purple-500 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Base Currency:
          </label>
          <div className="flex-1 max-w-xs">
            <CurrencySelector
              selectedCurrency={filterBaseCurrency}
              onCurrencyChange={setFilterBaseCurrency}
              size="medium"
            />
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            Showing rates for 1 {filterBaseCurrency}
          </div>
        </div>
      </div>

      {/* Exchange Rates Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Exchange Rates
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
              No exchange rates
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Click "Update Rates" to fetch the latest rates from the API
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Currency Pair
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Exchange Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Inverse Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rates.map((rate) => (
                  <tr
                    key={rate.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {rate.base_currency} / {rate.target_currency}
                        </div>
                        <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {getCurrencySymbol(rate.base_currency)} → {getCurrencySymbol(rate.target_currency)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {parseFloat(rate.rate).toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {parseFloat(rate.inverse_rate).toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {rate.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <div>
                          <div>{formatDate(rate.last_updated)}</div>
                          <div className="text-xs">{formatTime(rate.last_updated)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {rate.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Manual Rate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Add Manual Exchange Rate
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddRate} className="space-y-4">
                <div>
                  <CurrencySelector
                    label="Base Currency"
                    selectedCurrency={formData.base_currency}
                    onCurrencyChange={(currency) =>
                      setFormData({ ...formData, base_currency: currency })
                    }
                    size="medium"
                  />
                </div>

                <div>
                  <CurrencySelector
                    label="Target Currency"
                    selectedCurrency={formData.target_currency}
                    onCurrencyChange={(currency) =>
                      setFormData({ ...formData, target_currency: currency })
                    }
                    size="medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exchange Rate *
                  </label>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    step="0.0001"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 1.0850"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    1 {formData.base_currency} = {formData.rate || '?'} {formData.target_currency}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., manual, bank, etc."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Rate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeRatesPage;
