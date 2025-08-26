import React, { useState } from 'react';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, User, Building } from 'lucide-react';
import { loginUser, redirectAfterLogin } from '../../services/authService';

const LoginFormSection = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginType, setLoginType] = useState('store'); // 'store' or 'owner'
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await loginUser(formData.email, formData.password, loginType);

      if (result.success) {
        setMessage('Login successful! Redirecting...');

        // Redirect based on user role
        setTimeout(() => {
          redirectAfterLogin(result.user);
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.message || 'Login failed. Please check your credentials and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginOptions = [
    { name: 'Store Owner', email: 'owner1@pharmacy1.com', password: 'password123' },
    { name: 'Store Manager', email: 'manager@shelfcure.com', password: 'manager123' }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Login Form */}
          <div className="lg:col-span-2">
            <div className="max-w-2xl mx-auto">
              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                  Sign In to Your Account
                </h2>
                <p className="text-secondary-600">
                  Enter your credentials to access your ShelfCure dashboard
                </p>
              </div>

              {/* Login Type Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
                <button
                  type="button"
                  onClick={() => setLoginType('store')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    loginType === 'store'
                      ? 'bg-white text-primary-600 shadow-soft'
                      : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  Store Login
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('owner')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    loginType === 'owner'
                      ? 'bg-white text-primary-600 shadow-soft'
                      : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Store Owner Login
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{errors.general}</p>
                  </div>
                )}

                {/* Success Message */}
                {message && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-green-700 text-sm">{message}</p>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-3">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-3">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white pr-12 ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">Remember me</span>
                  </label>
                  <a
                    href="#forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full justify-center text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <LogIn className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-secondary-500">Don't have an account?</span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <a
                    href="#signup"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                  >
                    Create a new account
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Login */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-secondary-900 mb-4">
                🚀 Quick Login
              </h3>
              <p className="text-secondary-600 text-sm mb-4">
                Try ShelfCure with demo credentials
              </p>
              <div className="space-y-3">
                {quickLoginOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setFormData({
                      email: option.email,
                      password: option.password,
                      rememberMe: false
                    })}
                    className="w-full text-left p-3 bg-white rounded-lg hover:bg-primary-50 hover:border-primary-200 border border-gray-200 transition-all duration-200"
                  >
                    <div className="font-medium text-secondary-900 text-sm">{option.name}</div>
                    <div className="text-secondary-500 text-xs">{option.email}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Features */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-800 mb-4">
                🔒 Security Features
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  256-bit SSL encryption
                </li>
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Two-factor authentication
                </li>
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Session timeout protection
                </li>
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Login attempt monitoring
                </li>
              </ul>
            </div>

            {/* Need Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-3">
                💬 Need Help?
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                Having trouble logging in? Our support team is here to help.
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 text-sm w-full">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginFormSection;
