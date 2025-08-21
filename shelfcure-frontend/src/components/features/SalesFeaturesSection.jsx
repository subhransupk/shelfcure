import React from 'react';
import { CreditCard, Receipt, Calculator, Percent, Users, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const SalesFeaturesSection = () => {
  const salesFeatures = [
    {
      icon: CreditCard,
      title: 'Multiple Payment Methods',
      description: 'Accept cash, cards, UPI, digital wallets, and insurance payments seamlessly.',
      features: ['Cash payments', 'Card processing', 'UPI integration', 'Digital wallets', 'Insurance billing'],
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Receipt,
      title: 'Smart Invoice Generation',
      description: 'Automatically generate professional invoices with tax calculations and compliance.',
      features: ['Auto invoice creation', 'Tax calculations', 'Custom templates', 'Digital receipts', 'Print options'],
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Calculator,
      title: 'Advanced Pricing',
      description: 'Flexible pricing with discounts, bulk rates, and customer-specific pricing.',
      features: ['Dynamic pricing', 'Bulk discounts', 'Customer pricing', 'Promotional offers', 'Price alerts'],
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Maintain detailed customer profiles with purchase history and preferences.',
      features: ['Customer profiles', 'Purchase history', 'Loyalty programs', 'Credit management', 'Communication tools'],
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const quickStats = [
    { icon: Clock, label: '30 sec', description: 'Average billing time' },
    { icon: CheckCircle, label: '99.9%', description: 'Payment success rate' },
    { icon: TrendingUp, label: '40%', description: 'Faster checkout' },
    { icon: Percent, label: '15%', description: 'Revenue increase' }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Advanced{' '}
            <span className="text-primary-500">Sales & Billing</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Streamline your sales process with our comprehensive billing system designed
            for modern pharmacy operations.
          </p>
        </div>

        {/* Sales Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {salesFeatures.map((feature, index) => (
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

        {/* Quick Stats */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Sales Performance Metrics
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              See how ShelfCure's sales features improve your pharmacy's performance.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-primary-500" />
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-2">{stat.label}</div>
                <div className="text-secondary-600 text-sm">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalesFeaturesSection;
