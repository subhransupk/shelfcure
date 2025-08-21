import React from 'react';
import { Package, CreditCard, BarChart, Users, Smartphone, Camera, Shield, Cloud, Zap, RefreshCw, Bell, FileText } from 'lucide-react';

const CoreFeaturesSection = () => {
  const coreFeatures = [
    {
      icon: Package,
      title: 'Smart Inventory Management',
      description: 'Track medicines with dual unit support (strips/packs + individual units), automated alerts, and batch tracking.',
      features: ['Real-time stock monitoring', 'Low stock alerts', 'Batch & expiry tracking', 'Dual unit support'],
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: CreditCard,
      title: 'Advanced Sales & Billing',
      description: 'Streamlined billing process with multiple payment options, automatic invoice generation, and tax calculations.',
      features: ['Quick billing interface', 'Multiple payment methods', 'Auto invoice generation', 'Tax compliance'],
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: BarChart,
      title: 'Comprehensive Analytics',
      description: 'Real-time insights into sales performance, inventory trends, and business growth with customizable reports.',
      features: ['Sales analytics', 'Inventory insights', 'Profit tracking', 'Custom reports'],
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Camera,
      title: 'AI-Powered Bill OCR',
      description: 'Automatically scan and digitize paper bills using advanced AI technology for faster data entry.',
      features: ['Automatic bill scanning', 'Data extraction', 'Error reduction', 'Time savings'],
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Users,
      title: 'Multi-Store Support',
      description: 'Manage multiple pharmacy locations from a single dashboard with centralized control and reporting.',
      features: ['Centralized management', 'Location-wise reports', 'Staff management', 'Unified inventory'],
      color: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      icon: Smartphone,
      title: 'Mobile Applications',
      description: 'Native iOS and Android apps for on-the-go access with offline functionality and real-time sync.',
      features: ['Native mobile apps', 'Offline functionality', 'Real-time sync', 'Push notifications'],
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const additionalFeatures = [
    { icon: Shield, title: 'Data Security', description: 'Enterprise-grade security' },
    { icon: Cloud, title: 'Cloud Storage', description: 'Secure cloud backup' },
    { icon: Zap, title: 'Fast Performance', description: '99.9% uptime guarantee' },
    { icon: RefreshCw, title: 'Auto Updates', description: 'Always up-to-date' },
    { icon: Bell, title: 'Smart Alerts', description: 'Intelligent notifications' },
    { icon: FileText, title: 'Compliance', description: 'Regulatory compliance' }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Core{' '}
            <span className="text-primary-500">Features</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Discover the powerful features that make ShelfCure the most comprehensive 
            pharmacy management solution in the market.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {coreFeatures.map((feature, index) => (
            <div
              key={index}
              className={`${feature.bgColor} rounded-3xl p-8 hover:shadow-large transition-all duration-300 hover:-translate-y-2 group`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Feature List */}
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-3 text-sm text-secondary-600">
                      <div className={`w-2 h-2 bg-gradient-to-r ${feature.color} rounded-full flex-shrink-0`}></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Additional Features
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Even more features to help you run your pharmacy efficiently and securely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 hover:shadow-medium transition-all duration-200 hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-200">
                    <feature.icon className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary-900 mb-1 group-hover:text-primary-600 transition-colors duration-200">
                      {feature.title}
                    </h4>
                    <p className="text-secondary-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-secondary-900 mb-4">
            Ready to Experience All Features?
          </h3>
          <p className="text-secondary-600 mb-6 max-w-2xl mx-auto">
            Start your free trial today and discover how ShelfCure can transform your pharmacy operations.
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

export default CoreFeaturesSection;
