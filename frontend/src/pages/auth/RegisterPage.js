import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BuildingOfficeIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
  LockClosedIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ChartBarSquareIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RegisterPage = () => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    company_name: '',
    company_type: 'individual',
    role: 'individual',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Real-time form validation
  useEffect(() => {
    const errors = validateForm();
    setValidationErrors(errors);
    
    const hasRequiredFields = formData.full_name && formData.email && formData.password && formData.confirm_password;
    const hasValidCompanyName = formData.company_type === 'individual' || formData.company_name;
    const noErrors = Object.keys(errors).length === 0;
    
    setIsFormValid(hasRequiredFields && hasValidCompanyName && noErrors && acceptedTerms);
  }, [formData, acceptedTerms]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData.email, formData.password, clearError]);

  const validateForm = () => {
    const errors = {};

    if (formData.full_name && formData.full_name.length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.password) {
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and numbers';
      }
    }

    if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    if (formData.company_type !== 'individual' && formData.company_name && formData.company_name.length < 2) {
      errors.company_name = 'Company name must be at least 2 characters';
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-set role based on company type
    if (name === 'company_type') {
      setFormData((prev) => ({
        ...prev,
        role: value === 'individual' ? 'individual' : 'business',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const { confirm_password, ...registrationData } = formData;
    await register(registrationData);
  };

  const getCompanyTypeIcon = (type) => {
    switch (type) {
      case 'small_business':
        return BuildingStorefrontIcon;
      case 'corporation':
        return BuildingOfficeIcon;
      case 'nonprofit':
        return ShieldCheckIcon;
      default:
        return UserIcon;
    }
  };

  const CompanyTypeIcon = getCompanyTypeIcon(formData.company_type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex">
      {/* Left side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
        
        <div className="relative mx-auto w-full max-w-md lg:w-96">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 p-3 rounded-2xl">
                  <BuildingOfficeIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">AFMS</h1>
                <p className="text-xs text-gray-500 font-medium">Finance Management</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Join AFMS Today
            </h2>
            <p className="text-gray-600">
              Create your account and start managing your finances
            </p>
          </div>

          {/* Registration Form */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
              <form className="space-y-6" onSubmit={handleSubmit} data-testid="register-form">
                {/* Error Display */}
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-shake" data-testid="error-message">
                    <div className="flex">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                      <div className="ml-3">
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Name Field */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Full Name
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      autoComplete="name"
                      required
                      data-testid="full-name-input"
                      className={`block w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                        validationErrors.full_name 
                          ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500' 
                          : formData.full_name && !validationErrors.full_name 
                          ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 bg-gray-50/50 focus:border-emerald-500 focus:ring-emerald-500'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 placeholder-gray-400`}
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                    />
                    {formData.full_name && !validationErrors.full_name && (
                      <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  {validationErrors.full_name && (
                    <p className="mt-2 text-sm text-red-600 animate-slide-down flex items-center">
                      <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                      {validationErrors.full_name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Email Address
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      data-testid="email-input"
                      className={`block w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                        validationErrors.email 
                          ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500' 
                          : formData.email && !validationErrors.email 
                          ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 bg-gray-50/50 focus:border-emerald-500 focus:ring-emerald-500'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 placeholder-gray-400`}
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {formData.email && !validationErrors.email && (
                      <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  {validationErrors.email && (
                    <p className="mt-2 text-sm text-red-600 animate-slide-down flex items-center">
                      <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                {/* Account Type Field */}
                <div>
                  <label htmlFor="company_type" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <CompanyTypeIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Account Type
                    </div>
                  </label>
                  <select
                    id="company_type"
                    name="company_type"
                    data-testid="company-type-select"
                    className="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all duration-200"
                    value={formData.company_type}
                    onChange={handleInputChange}
                  >
                    <option value="individual">👤 Individual</option>
                    <option value="small_business">🏪 Small Business</option>
                    <option value="corporation">🏢 Corporation</option>
                    <option value="nonprofit">🛡️ Non-Profit</option>
                  </select>
                </div>

                {/* Company Name Field (conditional) */}
                {formData.company_type !== 'individual' && (
                  <div className="animate-slide-down">
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center">
                        <BuildingStorefrontIcon className="w-4 h-4 mr-2 text-gray-500" />
                        Company Name
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        id="company_name"
                        name="company_name"
                        type="text"
                        required
                        data-testid="company-name-input"
                        className={`block w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.company_name 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500' 
                            : formData.company_name && !validationErrors.company_name 
                            ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500'
                            : 'border-gray-200 bg-gray-50/50 focus:border-emerald-500 focus:ring-emerald-500'
                        } focus:outline-none focus:ring-2 focus:ring-opacity-50 placeholder-gray-400`}
                        placeholder="Enter your company name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                      />
                      {formData.company_name && !validationErrors.company_name && (
                        <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {validationErrors.company_name && (
                      <p className="mt-2 text-sm text-red-600 animate-slide-down flex items-center">
                        <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                        {validationErrors.company_name}
                      </p>
                    )}
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <LockClosedIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Password
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      data-testid="password-input"
                      className={`block w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 ${
                        validationErrors.password 
                          ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500' 
                          : formData.password && !validationErrors.password 
                          ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 bg-gray-50/50 focus:border-emerald-500 focus:ring-emerald-500'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 placeholder-gray-400`}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="toggle-password-visibility"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-2 text-sm text-red-600 animate-slide-down flex items-center">
                      <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                      {validationErrors.password}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Must contain uppercase, lowercase, and numbers
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <LockClosedIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Confirm Password
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      id="confirm_password"
                      name="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      data-testid="confirm-password-input"
                      className={`block w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 ${
                        validationErrors.confirm_password 
                          ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500' 
                          : formData.confirm_password && !validationErrors.confirm_password 
                          ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 bg-gray-50/50 focus:border-emerald-500 focus:ring-emerald-500'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 placeholder-gray-400`}
                      placeholder="Confirm your password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      data-testid="toggle-confirm-password-visibility"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {validationErrors.confirm_password && (
                    <p className="mt-2 text-sm text-red-600 animate-slide-down flex items-center">
                      <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                      {validationErrors.confirm_password}
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      data-testid="terms-checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors cursor-pointer"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-700 cursor-pointer font-medium">
                      I agree to the{' '}
                      <a href="#" className="text-emerald-600 hover:text-emerald-500 transition-colors font-semibold">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-emerald-600 hover:text-emerald-500 transition-colors font-semibold">
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    data-testid="register-submit-button"
                    className={`w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-lg ${
                      loading || !isFormValid 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 hover:shadow-xl'
                    }`}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="small" color="white" className="mr-2" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Enhanced Benefits */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
          
          <div className="relative flex flex-col justify-center h-full px-12 text-white">
            <div className="max-w-lg">
              {/* Main Content */}
              <div className="mb-8">
                <h1 className="text-5xl font-bold mb-6 leading-tight">
                  Start Your
                  <br />
                  <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                    Financial Journey
                  </span>
                </h1>
                <p className="text-xl text-emerald-100 leading-relaxed">
                  Join thousands of businesses already using AFMS to streamline their financial operations and gain valuable insights.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <DocumentCheckIcon className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-100 text-lg mb-1">Smart Document Processing</h3>
                    <p className="text-emerald-200/80">Upload receipts and invoices, get automatic data extraction with 98%+ accuracy using advanced ML.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                    <ChartBarSquareIcon className="w-6 h-6 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-100 text-lg mb-1">Real-time Financial Reports</h3>
                    <p className="text-emerald-200/80">Generate P&L statements, balance sheets, and cash flow reports instantly with live data.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-100 text-lg mb-1">Bank-Level Security</h3>
                    <p className="text-emerald-200/80">Enterprise-grade encryption and compliance with industry standards. Your data is always protected.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <CreditCardIcon className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-100 text-lg mb-1">Multi-Currency Support</h3>
                    <p className="text-emerald-200/80">Handle transactions in multiple currencies with real-time exchange rates and conversion.</p>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                  <div className="text-sm text-emerald-200">Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white mb-1">10K+</div>
                  <div className="text-sm text-emerald-200">Companies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white mb-1">50M+</div>
                  <div className="text-sm text-emerald-200">Transactions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;