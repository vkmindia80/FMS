import React, { useState, useEffect } from 'react';
import { ArrowsRightLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { currencyAPI } from '../../services/api';
import CurrencySelector from './CurrencySelector';
import toast from 'react-hot-toast';

const CurrencyConverter = ({ 
  initialFromCurrency = 'USD', 
  initialToCurrency = 'EUR',
  onConversionResult = null,
  showHistory = true,
  embedded = false 
}) => {
  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState(initialToCurrency);
  const [amount, setAmount] = useState('100');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [conversionHistory, setConversionHistory] = useState([]);

  useEffect(() => {
    if (amount && fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      convertCurrency();
    } else if (fromCurrency === toCurrency) {
      setConvertedAmount(parseFloat(amount) || 0);
      setExchangeRate(1);
    }
  }, [amount, fromCurrency, toCurrency]);

  const convertCurrency = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setConvertedAmount(null);
      setExchangeRate(null);
      return;
    }

    setLoading(true);
    try {
      const result = await currencyAPI.convertCurrency({
        amount: parseFloat(amount),
        from_currency: fromCurrency,
        to_currency: toCurrency
      });

      setConvertedAmount(parseFloat(result.converted_amount));
      setExchangeRate(parseFloat(result.exchange_rate));
      setLastUpdated(new Date(result.conversion_timestamp));

      // Add to history
      if (showHistory) {
        const historyEntry = {
          id: Date.now(),
          fromCurrency,
          toCurrency,
          amount: parseFloat(amount),
          convertedAmount: parseFloat(result.converted_amount),
          exchangeRate: parseFloat(result.exchange_rate),
          timestamp: new Date()
        };
        
        setConversionHistory(prev => [historyEntry, ...prev.slice(0, 4)]); // Keep last 5
      }

      // Callback with result
      if (onConversionResult) {
        onConversionResult(result);
      }

    } catch (error) {
      console.error('Currency conversion error:', error);
      toast.error('Failed to convert currency. Please check exchange rates.');
      setConvertedAmount(null);
      setExchangeRate(null);
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatCurrency = (value, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  };

  const containerClass = embedded ? 'p-4' : 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6';

  return (
    <div className={containerClass}>
      {!embedded && (
        <div className="flex items-center space-x-2 mb-6">
          <ArrowsRightLeftIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Currency Converter
          </h3>
        </div>
      )}

      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <CurrencySelector
              label="From"
              selectedCurrency={fromCurrency}
              onCurrencyChange={setFromCurrency}
              size="medium"
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={swapCurrencies}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                       transition-colors"
              title="Swap currencies"
            >
              <ArrowsRightLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div>
            <CurrencySelector
              label="To"
              selectedCurrency={toCurrency}
              onCurrencyChange={setToCurrency}
              size="medium"
            />
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          ) : convertedAmount !== null ? (
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {formatCurrency(convertedAmount, toCurrency)}
              </div>
              
              {exchangeRate && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span>
                    1 {fromCurrency} = {parseFloat(exchangeRate).toFixed(4)} {toCurrency}
                  </span>
                </div>
              )}
              
              {lastUpdated && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4">
              Enter an amount to see conversion
            </div>
          )}
        </div>

        {/* Conversion History */}
        {showHistory && conversionHistory.length > 0 && (
          <div className="border-t dark:border-gray-600 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Recent Conversions
            </h4>
            <div className="space-y-2">
              {conversionHistory.map((entry) => (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 rounded px-3 py-2"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {entry.amount} {entry.fromCurrency} → {entry.toCurrency}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(entry.convertedAmount, entry.toCurrency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;