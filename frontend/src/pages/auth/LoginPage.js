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
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentTextIcon
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
        
        <div className="relative mx-auto w-full max-w-md lg:w-96">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl">
                  <BuildingOfficeIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">AFMS</h1>
                <p className="text-xs text-gray-500 font-medium">Finance Management</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your financial dashboard
            </p>
          </div>

          {/* Enhanced Demo Credentials Card */}
          <div className="mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="text-sm font-semibold text-blue-900">Try Demo Account</h3>
                    </div>
                    <p className="text-xs text-blue-700 mb-3">Experience full features instantly</p>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-medium">Email:</span>
                        <code className="bg-blue-100/80 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                          {DEMO_CREDENTIALS.email}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-medium">Password:</span>
                        <code className="bg-blue-100/80 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                          ••••••••••••
                        </code>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    data-testid="demo-login-button"
                    className={`ml-4 inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                      loading ? 'opacity-50 cursor-not-allowed transform-none' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="small" color="white" className="mr-2" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-4 h-4 mr-2" />
                        Demo Login
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
              <form className="space-y-6" onSubmit={handleSubmit} data-testid="login-form">
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
                        formErrors.email 
                          ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500' 
                          : formData.email && !formErrors.email 
                          ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 placeholder-gray-400`}
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {formData.email && !formErrors.email && (
                      <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  {formErrors.email && (
                    <p className="mt-2 text-sm text-red-600 animate-slide-down flex items-center">
                      <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

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
                      autoComplete="current-password"
                      required
                      data-testid="password-input"
                      className={`block w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 ${
                        formErrors.password 
                          ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500' 
                          : formData.password && !formErrors.password 
                          ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 placeholder-gray-400`}
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
                    <p className="mt-2 text-sm text-red-600 animate-slide-down flex items-center">
                      <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                      {formErrors.password}
                    </p>
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
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-opacity-50 transition-colors cursor-pointer"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer font-medium">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <button
                      type="button"
                      className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                      onClick={() => setShowForgotPassword(true)}
                      data-testid="forgot-password-link"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    data-testid="login-submit-button"
                    className={`w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg ${
                      loading || !isFormValid 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 hover:shadow-xl'
                    }`}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="small" color="white" className="mr-2" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Social Login Section */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    data-testid="google-login-button"
                    className="flex justify-center items-center px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 hover:shadow-md font-medium"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                    className="flex justify-center items-center px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 hover:shadow-md font-medium"
                  >
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    GitHub
                  </button>
                </div>
              </div>

              {/* Register Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Create one here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Enhanced Feature Showcase */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
          
          <div className="relative flex flex-col justify-center h-full px-12 text-white">
            <div className="max-w-lg">
              {/* Main Content */}
              <div className="mb-8">
                <h1 className="text-5xl font-bold mb-6 leading-tight">
                  Advanced
                  <br />
                  <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                    Finance Management
                  </span>
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Transform your financial operations with AI-powered insights, automated workflows, and enterprise-grade security.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-4 h-4 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-100">Smart OCR Processing</h3>
                      <p className="text-sm text-blue-200/70">Automated document extraction</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="w-4 h-4 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-100">Enterprise Security</h3>
                      <p className="text-sm text-blue-200/70">Bank-level encryption</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-100">Real-time Analytics</h3>
                      <p className="text-sm text-blue-200/70">Live financial insights</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <SparklesIcon className="w-4 h-4 text-green-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-100">AI Automation</h3>
                      <p className="text-sm text-blue-200/70">Smart categorization</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex space-x-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-sm text-blue-200">Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-sm text-blue-200">Companies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">50M+</div>
                  <div className="text-sm text-blue-200">Transactions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-modal-appear">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <LockClosedIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              </div>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Password reset functionality will be available soon. For now, please contact our support team for assistance.
              </p>
              
              <div className="flex justify-center">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  data-testid="close-forgot-password-modal"
                >
                  Got it
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