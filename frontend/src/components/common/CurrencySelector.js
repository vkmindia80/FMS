import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { currencyAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CurrencySelector = ({ 
  selectedCurrency = 'USD', 
  onCurrencyChange, 
  disabled = false,
  showFlag = true,
  size = 'medium',
  label = null
}) => {
  const [currencies, setCurrencies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const data = await currencyAPI.getCurrencies();
      setCurrencies(data);
    } catch (error) {
      console.error('Error loading currencies:', error);
      toast.error('Failed to load currencies');
      // Fallback to common currencies
      setCurrencies([
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrencyInfo = currencies.find(c => c.code === selectedCurrency) || 
    { code: selectedCurrency, name: selectedCurrency, symbol: selectedCurrency };

  const sizeClasses = {
    small: 'text-sm py-1 px-2',
    medium: 'text-sm py-2 px-3',
    large: 'text-base py-3 px-4'
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${sizeClasses[size]}`}>
        <div className="w-20 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            w-full text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
            rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'}
            flex items-center justify-between
          `}
        >
          <div className="flex items-center space-x-2">
            {showFlag && (
              <div className="w-6 h-4 bg-gray-200 dark:bg-gray-600 rounded-sm flex items-center justify-center text-xs font-bold">
                {selectedCurrencyInfo.code.slice(0, 2)}
              </div>
            )}
            <span className="font-medium">{selectedCurrencyInfo.code}</span>
            <span className="text-gray-500 dark:text-gray-400 font-normal">
              {selectedCurrencyInfo.symbol}
            </span>
            {size !== 'small' && (
              <span className="text-gray-500 dark:text-gray-400 text-sm truncate">
                {selectedCurrencyInfo.name}
              </span>
            )}
          </div>
          
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => {
                  onCurrencyChange(currency.code);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 
                  flex items-center space-x-3
                  ${currency.code === selectedCurrency ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
                `}
              >
                {showFlag && (
                  <div className="w-6 h-4 bg-gray-200 dark:bg-gray-600 rounded-sm flex items-center justify-center text-xs font-bold">
                    {currency.code.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{currency.code}</span>
                    <span className="text-gray-500 dark:text-gray-400">{currency.symbol}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {currency.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CurrencySelector;