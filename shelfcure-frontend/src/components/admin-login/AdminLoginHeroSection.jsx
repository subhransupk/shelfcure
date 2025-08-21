import React from 'react';
import { Shield, Settings, Users, ArrowDown, BarChart, Lock, Database } from 'lucide-react';

const AdminLoginHeroSection = () => {
  const adminFeatures = [
    { icon: Settings, label: 'System Control', description: 'Full system access' },
    { icon: Users, label: 'User Management', description: 'Manage all users' },
    { icon: BarChart, label: 'Analytics', description: 'Global insights' }
  ];

  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 overflow-hidden pt-16 lg:pt-20 text-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container-max section-padding">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-900/50 text-blue-200 px-4 py-2 rounded-full text-sm font-medium border border-blue-700/50">
              <Shield className="w-4 h-4" />
              Admin Access
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                ShelfCure{' '}
                <span className="text-blue-400 relative">
                  Admin Panel
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-blue-600"
                    viewBox="0 0 300 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10C50 2 100 2 150 6C200 10 250 4 298 6"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl">
                Access the comprehensive admin dashboard to manage the entire ShelfCure platform. 
                Monitor system performance, manage users, and oversee all pharmacy operations.
              </p>
            </div>

            {/* Admin Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {adminFeatures.map((feature, index) => (
                <div key={index} className="text-center sm:text-left">
                  <div className="w-12 h-12 bg-blue-900/50 border border-blue-700/50 rounded-xl flex items-center justify-center mx-auto sm:mx-0 mb-3">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="font-semibold text-white mb-1">{feature.label}</div>
                  <div className="text-sm text-gray-400">{feature.description}</div>
                </div>
              ))}
            </div>

            {/* Security Notice */}
            <div className="bg-red-900/20 border border-red-700/50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-red-200">Restricted Access</span>
              </div>
              <p className="text-red-300 text-sm">
                This is a secure admin area. Only authorized system administrators should access this panel. 
                All login attempts are monitored and logged for security purposes.
              </p>
            </div>

            {/* Scroll Indicator */}
            <div className="flex items-center gap-3 text-gray-400 pt-8">
              <span className="text-sm">Admin login form below</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Admin Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700">
                {/* Mock Admin Dashboard */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-white">Admin Dashboard</h3>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">1,247</div>
                      <div className="text-xs text-gray-400">Active Stores</div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">99.9%</div>
                      <div className="text-xs text-gray-400">System Uptime</div>
                    </div>
                  </div>
                  
                  {/* Chart Placeholder */}
                  <div className="bg-gray-700/30 h-24 rounded-lg flex items-center justify-center">
                    <BarChart className="w-8 h-8 text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* Floating Admin Elements */}
              <div className="absolute -top-6 -left-6 bg-blue-900/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg animate-float border border-blue-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-200">System Online</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-8 bg-purple-900/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg animate-float animation-delay-1000 border border-purple-700/50">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-200">24/7</div>
                  <div className="text-xs text-purple-300">Monitoring</div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-indigo-900/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg animate-float animation-delay-2000 border border-indigo-700/50">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-300" />
                  <span className="text-sm font-medium text-indigo-200">Secure Database</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
};

export default AdminLoginHeroSection;
