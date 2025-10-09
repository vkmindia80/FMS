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
  LockClosedIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LoginPage = () => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Demo credentials
  const DEMO_CREDENTIALS = {
    email: 'john.doe@testcompany.com',
    password: 'testpassword123'
  };

  // Real-time form validation
  useEffect(() => {
    const errors = {};
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    setIsFormValid(formData.email && formData.password && Object.keys(errors).length === 0);
  }, [formData]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData.email, formData.password, clearError]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    const result = await login(formData.email, formData.password);
    
    if (result.success && formData.rememberMe) {
      localStorage.setItem('afms_remember_me', 'true');
      localStorage.setItem('afms_remembered_email', formData.email);
    }
  };

  const handleDemoLogin = async () => {
    // Fill the form data first
    setFormData(prev => ({
      ...prev,
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password
    }));
    
    // Automatically submit the login
    await login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
  };

  const handleSocialLogin = (provider) => {
    // Placeholder for social login implementation
    console.log(`Social login with ${provider} - Coming soon!`);
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('afms_remembered_email');
    const rememberMe = localStorage.getItem('afms_remember_me') === 'true';
    
    if (rememberedEmail && rememberMe) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Header */}
          <div className="animate-fade-in">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-10 w-10 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">AFMS</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account or{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                create a new account
              </Link>
            </p>
          </div>

          {/* Demo Credentials Card */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg animate-slide-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">Quick Demo Access</h3>
                <p className="text-xs text-blue-700 mt-1">Login instantly with demo account</p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                data-testid="demo-login-button"
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <UserIcon className="w-4 h-4 mr-1" />
                {loading ? 'Signing In...' : 'Demo Login'}
              </button>
            </div>
            <div className="mt-2 text-xs text-blue-600 space-y-1">
              <div className="flex justify-between">
                <span>Email:</span>
                <code className="bg-blue-100 px-1 rounded">{DEMO_CREDENTIALS.email}</code>
              </div>
              <div className="flex justify-between">
                <span>Password:</span>
                <code className="bg-blue-100 px-1 rounded">••••••••••••</code>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit} data-testid="login-form">
              {/* Error Display */}
              {error && (
                <div className="rounded-md bg-red-50 p-4 animate-shake" data-testid="error-message">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="form-label flex items-center">
                  <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                  Email address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    data-testid="email-input"
                    className={`form-input transition-all duration-200 ${
                      formErrors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : formData.email && !formErrors.email 
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                        : ''
                    }`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {formData.email && !formErrors.email && (
                    <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-400" />
                  )}
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 animate-slide-down">{formErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="form-label flex items-center">
                  <LockClosedIcon className="w-4 h-4 mr-2 text-gray-500" />
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    data-testid="password-input"
                    className={`form-input pr-10 transition-all duration-200 ${
                      formErrors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : formData.password && !formErrors.password 
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                        : ''
                    }`}
                    placeholder="Enter your password"
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
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600 animate-slide-down">{formErrors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    data-testid="remember-me-checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors cursor-pointer"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    onClick={() => setShowForgotPassword(true)}
                    data-testid="forgot-password-link"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  data-testid="login-submit-button"
                  className={`btn-primary w-full flex justify-center items-center transition-all duration-200 transform ${
                    loading || !isFormValid 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="small" color="white" className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Social Login Section */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  data-testid="google-login-button"
                  className="btn-secondary transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>

                <button 
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  data-testid="github-login-button"
                  className="btn-secondary transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Feature Showcase */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800">
          <div className="flex flex-col justify-center h-full px-8 text-white">
            <div className="max-w-md animate-fade-in-right">
              <h1 className="text-4xl font-bold mb-6">
                Advanced Finance Management System
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Streamline your financial operations with AI-powered document processing, 
                automated transaction classification, and comprehensive reporting.
              </p>
              <div className="space-y-4">
                <div className="flex items-center animate-fade-in-right" style={{animationDelay: '0.2s'}}>
                  <div className="w-2 h-2 bg-primary-300 rounded-full mr-3"></div>
                  <span>OCR & AI Document Processing</span>
                </div>
                <div className="flex items-center animate-fade-in-right" style={{animationDelay: '0.4s'}}>
                  <div className="w-2 h-2 bg-primary-300 rounded-full mr-3"></div>
                  <span>Multi-Currency Support</span>
                </div>
                <div className="flex items-center animate-fade-in-right" style={{animationDelay: '0.6s'}}>
                  <div className="w-2 h-2 bg-primary-300 rounded-full mr-3"></div>
                  <span>Enterprise-Grade Security</span>
                </div>
                <div className="flex items-center animate-fade-in-right" style={{animationDelay: '0.8s'}}>
                  <div className="w-2 h-2 bg-primary-300 rounded-full mr-3"></div>
                  <span>Comprehensive Financial Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-modal-appear">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reset Password</h3>
              <p className="text-sm text-gray-600 mb-4">
                Password reset functionality will be available soon. For now, please contact support.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  data-testid="close-forgot-password-modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;