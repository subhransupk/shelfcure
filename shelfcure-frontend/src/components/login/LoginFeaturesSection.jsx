import React from 'react';
import { Shield, Clock, Users, BarChart, Smartphone, Cloud } from 'lucide-react';

const LoginFeaturesSection = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Enterprise-grade security with multi-factor authentication and encrypted data transmission.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Clock,
      title: 'Always Available',
      description: 'Access your pharmacy data 24/7 from anywhere with 99.9% uptime guarantee.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage multiple user accounts with role-based permissions and access controls.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: BarChart,
      title: 'Real-time Analytics',
      description: 'Get instant insights into your pharmacy performance with live dashboards.',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Access your account from any device with our responsive web app and mobile apps.',
      color: 'bg-pink-100 text-pink-600'
    },
    {
      icon: Cloud,
      title: 'Cloud Sync',
      description: 'Your data is automatically synced across all devices and backed up securely.',
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Why Choose{' '}
            <span className="text-primary-500">ShelfCure?</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Experience the power of modern pharmacy management with features designed 
            to streamline your operations and grow your business.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-2 group"
            >
              {/* Icon */}
              <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-secondary-900 mb-4 group-hover:text-primary-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-secondary-900 mb-4">
            Ready to Transform Your Pharmacy?
          </h3>
          <p className="text-secondary-600 mb-6 max-w-2xl mx-auto">
            Join hundreds of pharmacies already using ShelfCure to streamline their operations 
            and provide better patient care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary text-lg px-8 py-4">
              Start Free Trial
            </button>
            <button className="btn-secondary text-lg px-8 py-4">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginFeaturesSection;
