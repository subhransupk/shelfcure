import React from 'react';
import { Check, X, Star, ArrowRight } from 'lucide-react';

const FeatureComparisonSection = () => {
  const features = [
    'Dual Unit Inventory Tracking',
    'AI-Powered Bill OCR',
    'Multi-Store Management',
    'Real-time Analytics',
    'Mobile Applications',
    'WhatsApp Integration',
    'Cloud-based System',
    'Automated Alerts',
    'Custom Reports',
    'API Integrations',
    'Role-based Access',
    '24/7 Support'
  ];

  const competitors = [
    { name: 'ShelfCure', color: 'text-primary-600', bgColor: 'bg-primary-50' },
    { name: 'Competitor A', color: 'text-gray-600', bgColor: 'bg-gray-50' },
    { name: 'Competitor B', color: 'text-gray-600', bgColor: 'bg-gray-50' },
    { name: 'Traditional Systems', color: 'text-gray-600', bgColor: 'bg-gray-50' }
  ];

  // ShelfCure has all features, others have varying support
  const featureMatrix = {
    'ShelfCure': [true, true, true, true, true, true, true, true, true, true, true, true],
    'Competitor A': [false, false, true, true, false, false, true, true, false, false, true, false],
    'Competitor B': [true, false, false, true, true, false, true, false, true, false, false, true],
    'Traditional Systems': [false, false, false, false, false, false, false, true, false, false, false, false]
  };

  const plans = [
    {
      name: 'Starter',
      price: '₹999',
      period: '/month',
      description: 'Perfect for small pharmacies',
      features: ['Up to 1,000 products', 'Basic reporting', 'Email support', 'Mobile app access'],
      popular: false
    },
    {
      name: 'Professional',
      price: '₹1,999',
      period: '/month',
      description: 'Ideal for growing pharmacies',
      features: ['Up to 10,000 products', 'Advanced analytics', 'Priority support', 'Multi-store support', 'API access'],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large pharmacy chains',
      features: ['Unlimited products', 'Custom integrations', 'Dedicated support', 'Advanced security', 'Custom features'],
      popular: false
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Why Choose{' '}
            <span className="text-primary-500">ShelfCure?</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            See how ShelfCure compares to other pharmacy management solutions in the market.
          </p>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12 mb-16 overflow-x-auto">
          <h3 className="text-2xl font-bold text-secondary-900 mb-8 text-center">
            Feature Comparison
          </h3>

          <div className="min-w-full">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-secondary-900">Features</th>
                  {competitors.map((competitor, index) => (
                    <th key={index} className={`text-center py-4 px-6 font-bold ${competitor.color}`}>
                      {competitor.name}
                      {competitor.name === 'ShelfCure' && (
                        <Star className="w-4 h-4 inline ml-2 fill-primary-500 text-primary-500" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, featureIndex) => (
                  <tr key={featureIndex} className="border-t border-gray-200">
                    <td className="py-4 px-6 font-medium text-secondary-900">{feature}</td>
                    {competitors.map((competitor, compIndex) => (
                      <td key={compIndex} className="text-center py-4 px-6">
                        {featureMatrix[competitor.name][featureIndex] ? (
                          <Check className="w-6 h-6 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-400 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Choose Your Plan
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Flexible pricing plans designed to grow with your pharmacy business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-3xl p-8 relative ${
                  plan.popular
                    ? 'bg-primary-50 border-2 border-primary-200 shadow-large'
                    : 'bg-white border border-gray-200 shadow-soft'
                } hover:shadow-large transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h4 className="text-xl font-bold text-secondary-900 mb-2">{plan.name}</h4>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-primary-600">{plan.price}</span>
                    <span className="text-secondary-600">{plan.period}</span>
                  </div>
                  <p className="text-secondary-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-secondary-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-200 ${
                  plan.popular
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-secondary-900'
                }`}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-secondary-900 mb-4">
            Ready to Experience the Difference?
          </h3>
          <p className="text-secondary-600 mb-6 max-w-2xl mx-auto">
            Join hundreds of pharmacies that have already transformed their operations with ShelfCure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary text-lg px-8 py-4">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
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

export default FeatureComparisonSection;
