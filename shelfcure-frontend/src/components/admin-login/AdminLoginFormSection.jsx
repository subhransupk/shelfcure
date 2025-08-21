import React, { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Settings, Users, BarChart, Database, Activity, Bell } from 'lucide-react';

const AdminLoginFormSection = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      newErrors.email = 'Admin email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    // Simulate admin login process
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to admin dashboard would happen here
      console.log('Admin login successful:', formData);
    }, 2000);
  };

  const adminCapabilities = [
    { icon: Users, title: 'User Management', description: 'Manage all store owners and staff accounts' },
    { icon: BarChart, title: 'System Analytics', description: 'View platform-wide performance metrics' },
    { icon: Database, title: 'Data Management', description: 'Access and manage all system data' },
    { icon: Settings, title: 'System Settings', description: 'Configure platform settings and features' },
    { icon: Activity, title: 'Monitoring', description: 'Real-time system health monitoring' },
    { icon: Bell, title: 'Notifications', description: 'Manage system-wide notifications' }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Admin Login Form */}
          <div className="lg:col-span-2">
            <div className="max-w-2xl mx-auto">
              {/* Form Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                  Admin Panel Access
                </h2>
                <p className="text-secondary-600">
                  Enter your administrator credentials to access the ShelfCure admin dashboard
                </p>
              </div>

              {/* Security Warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">Authorized Access Only</h4>
                    <p className="text-red-700 text-sm">
                      This admin panel is restricted to authorized personnel only. 
                      Unauthorized access attempts are logged and monitored.
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Admin Email */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                    Admin Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white pl-12 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="admin@shelfcure.com"
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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

                {/* Admin Password */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white pl-12 pr-12 ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your admin password"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                      className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                    />
                    <span className="text-sm text-secondary-700">Keep me signed in</span>
                  </label>
                  <a
                    href="#forgot-password"
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Access Admin Panel
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Security Notice */}
                <div className="text-center">
                  <p className="text-secondary-500 text-sm">
                    🔒 This connection is secured with 256-bit SSL encryption
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Admin Capabilities Sidebar */}
          <div className="space-y-6">
            {/* Admin Access Info */}
            <div className="bg-gray-900 text-white rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">
                🛡️ Admin Access
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                As an admin, you have full control over the ShelfCure platform with access to all system features.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Full system access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Real-time monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Advanced analytics</span>
                </div>
              </div>
            </div>

            {/* Admin Capabilities */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-secondary-900 mb-4">
                Admin Capabilities
              </h3>
              <div className="space-y-4">
                {adminCapabilities.map((capability, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <capability.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-secondary-900 text-sm">{capability.title}</h4>
                      <p className="text-secondary-600 text-xs">{capability.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Contact */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-3">
                💬 Need Help?
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                Having trouble accessing the admin panel? Contact our technical support team.
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 text-sm w-full">
                Contact Tech Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminLoginFormSection;
