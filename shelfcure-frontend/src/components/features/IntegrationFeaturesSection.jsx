import React from 'react';
import { Smartphone, Cloud, Wifi, RefreshCw, Link, Database, MessageSquare, CreditCard } from 'lucide-react';

const IntegrationFeaturesSection = () => {
  const integrationFeatures = [
    {
      icon: Smartphone,
      title: 'Mobile App Integration',
      description: 'Native iOS and Android apps that sync seamlessly with your main system.',
      features: ['Real-time synchronization', 'Offline functionality', 'Push notifications', 'Mobile billing'],
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Cloud,
      title: 'Cloud Infrastructure',
      description: 'Secure cloud-based system accessible from anywhere with internet connection.',
      features: ['99.9% uptime guarantee', 'Automatic backups', 'Global accessibility', 'Scalable infrastructure'],
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Wifi,
      title: 'API Integrations',
      description: 'Connect with existing systems and third-party services through our robust APIs.',
      features: ['RESTful APIs', 'Webhook support', 'Third-party integrations', 'Custom connections'],
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: RefreshCw,
      title: 'Data Synchronization',
      description: 'Real-time data sync across all devices and locations for consistent information.',
      features: ['Real-time updates', 'Multi-device sync', 'Conflict resolution', 'Data consistency'],
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const thirdPartyIntegrations = [
    { icon: MessageSquare, title: 'WhatsApp Business', description: 'Customer communication' },
    { icon: CreditCard, title: 'Payment Gateways', description: 'Multiple payment options' },
    { icon: Database, title: 'Accounting Software', description: 'Financial data sync' },
    { icon: Link, title: 'Supplier Systems', description: 'Direct ordering integration' }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Seamless{' '}
            <span className="text-primary-500">Integrations</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Connect ShelfCure with your existing systems and favorite tools for a unified
            pharmacy management experience.
          </p>
        </div>

        {/* Integration Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {integrationFeatures.map((feature, index) => (
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

        {/* Third-Party Integrations */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Popular Integrations
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Connect with the tools and services you already use to streamline your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {thirdPartyIntegrations.map((integration, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500 transition-colors duration-200">
                  <integration.icon className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-200" />
                </div>
                <h4 className="font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                  {integration.title}
                </h4>
                <p className="text-secondary-600 text-sm">
                  {integration.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationFeaturesSection;
