import React from 'react';
import { Package, CreditCard, Users, BarChart, Shield, Smartphone, Check } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Complete medicine inventory tracking with dual unit support (strips/packs + individual units).',
      benefits: [
        'Real-time stock monitoring',
        'Automated low stock alerts',
        'Batch and expiry tracking',
        'Dual unit inventory system'
      ]
    },
    {
      icon: CreditCard,
      title: 'Sales & Billing',
      description: 'Streamlined billing system with AI-powered Bill OCR and multiple payment options.',
      benefits: [
        'AI-powered Bill OCR',
        'Multiple payment methods',
        'Invoice generation',
        'Tax calculations'
      ]
    },
    {
      icon: Users,
      title: 'Doctor Commissions',
      description: 'Automated commission tracking and management for doctor referrals and partnerships.',
      benefits: [
        'Automated commission calculation',
        'Doctor performance tracking',
        'Commission reports',
        'Payment management'
      ]
    },
    {
      icon: BarChart,
      title: 'Analytics & Reports',
      description: 'Comprehensive analytics dashboard with detailed insights and customizable reports.',
      benefits: [
        'Sales analytics dashboard',
        'Profit margin analysis',
        'Customer insights',
        'Custom report generation'
      ]
    },
    {
      icon: Shield,
      title: 'Multi-Store Support',
      description: 'Manage multiple pharmacy locations from a single dashboard with centralized control.',
      benefits: [
        'Centralized management',
        'Store-wise analytics',
        'Inventory synchronization',
        'Role-based access control'
      ]
    },
    {
      icon: Smartphone,
      title: 'Mobile App',
      description: 'Native mobile application for on-the-go pharmacy management and operations.',
      benefits: [
        'iOS and Android apps',
        'Offline functionality',
        'Push notifications',
        'Mobile billing'
      ]
    }
  ];

  return (
    <section id="features" className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Everything You Need to{' '}
            <span className="text-primary-500">Manage Your Pharmacy</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Our comprehensive MERN stack solution provides all the tools and features 
            you need to streamline your pharmacy operations and grow your business.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-large hover:border-primary-200 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-500 transition-colors duration-300">
                <feature.icon className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Benefits List */}
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center gap-3 text-sm text-secondary-600">
                      <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-secondary-600 mb-6">
            Ready to transform your pharmacy operations?
          </p>
          <button className="btn-primary text-lg px-8 py-4">
            Start Your Free Trial
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
