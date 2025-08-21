import React from 'react';
import { Shield, Users, BarChart, Settings, Database, Activity, Bell, Lock, Eye, Zap } from 'lucide-react';

const AdminLoginFeaturesSection = () => {
  const adminFeatures = [
    {
      icon: Users,
      title: 'User Management',
      description: 'Complete control over all user accounts, permissions, and access levels across the platform.',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: BarChart,
      title: 'System Analytics',
      description: 'Comprehensive analytics dashboard with real-time insights into platform performance.',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Database,
      title: 'Data Management',
      description: 'Advanced data management tools with backup, restore, and migration capabilities.',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Settings,
      title: 'System Configuration',
      description: 'Configure platform settings, features, and system-wide preferences.',
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      description: 'Monitor system health, performance metrics, and user activity in real-time.',
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: Shield,
      title: 'Security Management',
      description: 'Advanced security controls, audit logs, and threat monitoring capabilities.',
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const securityFeatures = [
    { icon: Lock, title: 'Multi-Factor Authentication', description: 'Enhanced security with MFA' },
    { icon: Eye, title: 'Audit Logging', description: 'Complete activity tracking' },
    { icon: Shield, title: 'Role-Based Access', description: 'Granular permission control' },
    { icon: Zap, title: 'Real-time Alerts', description: 'Instant security notifications' }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Admin Panel{' '}
            <span className="text-gray-700">Features</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Comprehensive administrative tools to manage and monitor the entire ShelfCure platform 
            with enterprise-grade security and control.
          </p>
        </div>

        {/* Admin Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {adminFeatures.map((feature, index) => (
            <div
              key={index}
              className={`${feature.bgColor} rounded-3xl p-8 hover:shadow-large transition-all duration-300 hover:-translate-y-2 group`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-secondary-900 mb-4 group-hover:text-gray-700 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Security Features */}
        <div className="bg-gray-900 text-white rounded-3xl p-8 md:p-12 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Enterprise Security
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Advanced security features designed to protect your admin access and maintain system integrity.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-700 transition-colors duration-200">
                  <feature.icon className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors duration-200" />
                </div>
                <h4 className="font-bold text-white mb-2 group-hover:text-gray-200 transition-colors duration-200">
                  {feature.title}
                </h4>
                <p className="text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Dashboard Preview */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Admin Dashboard Overview
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Get a glimpse of what you'll have access to once you log into the admin panel.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* System Stats */}
            <div className="text-center">
              <div className="bg-blue-100 p-6 rounded-2xl mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
                <div className="text-blue-800 font-medium">Active Stores</div>
                <div className="text-blue-600 text-sm">Across all regions</div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-green-100 p-6 rounded-2xl mb-4">
                <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-green-800 font-medium">System Uptime</div>
                <div className="text-green-600 text-sm">Last 30 days</div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 p-6 rounded-2xl mb-4">
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-purple-800 font-medium">Monitoring</div>
                <div className="text-purple-600 text-sm">Real-time alerts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Access Notice */}
        <div className="text-center mt-16 bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 rounded-2xl">
          <div className="max-w-2xl mx-auto">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Secure Admin Access
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              The admin panel provides complete control over the ShelfCure platform. 
              Access is restricted to authorized administrators only and all activities are logged for security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 py-4 rounded-xl transition-colors duration-200">
                Request Admin Access
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold px-8 py-4 rounded-xl transition-all duration-200">
                Contact Support
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Admin access requires proper authorization and security clearance
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminLoginFeaturesSection;
