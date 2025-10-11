import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ArrowPathIcon, 
  PlusIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { currencyAPI } from '../../services/api';
import CurrencySelector from '../../components/common/CurrencySelector';
import CurrencyConverter from '../../components/common/CurrencyConverter';
import toast from 'react-hot-toast';

const CurrencyManagementPage = () => {
  const [exchangeRates, setExchangeRates] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddRateModal, setShowAddRateModal] = useState(false);
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState('USD');
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const [newRateForm, setNewRateForm] = useState({
    base_currency: 'USD',
    target_currency: 'EUR',
    rate: '',
    source: 'manual'
  });

  useEffect(() => {
    loadData();
  }, [selectedBaseCurrency]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load currencies and exchange rates in parallel
      const [currenciesData, ratesData] = await Promise.all([
        currencyAPI.getCurrencies(),
        currencyAPI.getExchangeRates({ base_currency: selectedBaseCurrency, limit: 50 })
      ]);
      
      setCurrencies(currenciesData);
      setExchangeRates(ratesData);
      
      // Find the most recent update time
      if (ratesData.length > 0) {
        const mostRecent = ratesData.reduce((latest, rate) => 
          new Date(rate.last_updated) > new Date(latest.last_updated) ? rate : latest
        );
        setLastUpdate(new Date(mostRecent.last_updated));
      }
      
    } catch (error) {
      console.error('Error loading currency data:', error);
      toast.error('Failed to load currency data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRates = async () => {
    try {
      setUpdating(true);
      toast.loading('Updating exchange rates from external API...', { id: 'updating-rates' });
      
      const result = await currencyAPI.updateExchangeRates(selectedBaseCurrency);
      
      if (result.success) {
        toast.success(
          `Successfully updated ${result.updated_count} exchange rates`, 
          { id: 'updating-rates' }
        );
        await loadData();
      } else {
        toast.error('Failed to update exchange rates', { id: 'updating-rates' });
      }
      
    } catch (error) {
      console.error('Error updating rates:', error);
      toast.error('Failed to update exchange rates', { id: 'updating-rates' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddRate = async (e) => {
    e.preventDefault();
    
    if (!newRateForm.rate || isNaN(newRateForm.rate) || parseFloat(newRateForm.rate) <= 0) {
      toast.error('Please enter a valid exchange rate');
      return;
    }
    
    try {
      await currencyAPI.createExchangeRate({
        ...newRateForm,
        rate: parseFloat(newRateForm.rate)
      });
      
      toast.success('Exchange rate added successfully');
      setShowAddRateModal(false);
      setNewRateForm({
        base_currency: 'USD',
        target_currency: 'EUR',
        rate: '',
        source: 'manual'
      });
      await loadData();
      
    } catch (error) {
      console.error('Error adding rate:', error);
      toast.error('Failed to add exchange rate');
    }
  };

  const formatRate = (rate) => {
    return parseFloat(rate).toFixed(4);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRateAge = (dateString) => {
    const now = new Date();
    const rateDate = new Date(dateString);
    const diffHours = Math.floor((now - rateDate) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getRateAgeColor = (dateString) => {
    const now = new Date();
    const rateDate = new Date(dateString);
    const diffHours = Math.floor((now - rateDate) / (1000 * 60 * 60));
    
    if (diffHours < 24) return 'text-green-600 dark:text-green-400';
    if (diffHours < 48) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CurrencyDollarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Currency Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage exchange rates and currency settings
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleUpdateRates}
              disabled={updating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Updating...' : 'Update Rates'}
            </button>
            
            <button
              onClick={() => setShowAddRateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Rate
            </button>
          </div>
        </div>
        
        {lastUpdate && (
          <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <ClockIcon className="w-4 h-4 mr-2" />
            Last updated: {formatDate(lastUpdate)}
          </div>
        )}
      </div>

      {/* Base Currency Selector */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Base Currency Filter
          </h3>
          <div className="max-w-xs">
            <CurrencySelector
              label="Show rates for base currency"
              selectedCurrency={selectedBaseCurrency}
              onCurrencyChange={setSelectedBaseCurrency}
              size="medium"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Exchange Rates Table */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exchange Rates ({selectedBaseCurrency} Base)
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : exchangeRates.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Exchange Rates Found</h3>
                  <p>Update rates from external API or add manual rates to get started.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Currency Pair
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {exchangeRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {rate.base_currency} → {rate.target_currency}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-lg font-mono text-gray-900 dark:text-white">
                            {formatRate(rate.rate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rate.source === 'manual' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {rate.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <span className={getRateAgeColor(rate.last_updated)}>
                            {getRateAge(rate.last_updated)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            rate.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            {rate.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Currency Converter Sidebar */}
        <div className="xl:col-span-1">
          <CurrencyConverter 
            initialFromCurrency={selectedBaseCurrency}
            initialToCurrency={selectedBaseCurrency === 'USD' ? 'EUR' : 'USD'}
            showHistory={true}
            embedded={false}
          />
        </div>
      </div>

      {/* Add Rate Modal */}
      {showAddRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Manual Exchange Rate
                </h3>
                <button
                  onClick={() => setShowAddRateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddRate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <CurrencySelector
                    label="From Currency"
                    selectedCurrency={newRateForm.base_currency}
                    onCurrencyChange={(currency) => 
                      setNewRateForm(prev => ({ ...prev, base_currency: currency }))
                    }
                    size="medium"
                  />
                  <CurrencySelector
                    label="To Currency"
                    selectedCurrency={newRateForm.target_currency}
                    onCurrencyChange={(currency) => 
                      setNewRateForm(prev => ({ ...prev, target_currency: currency }))
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
                    step="0.000001"
                    min="0"
                    value={newRateForm.rate}
                    onChange={(e) => setNewRateForm(prev => ({ ...prev, rate: e.target.value }))}
                    placeholder="e.g., 0.85"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    1 {newRateForm.base_currency} = {newRateForm.rate || '?'} {newRateForm.target_currency}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddRateModal(false)}
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

export default CurrencyManagementPage;