import React from 'react';
import { Smartphone, Monitor, Cloud, Wifi, Download, RefreshCw } from 'lucide-react';

const IntegrationSection = () => {
  const integrations = [
    {
      icon: Smartphone,
      title: 'Mobile App Integration',
      description: 'Native iOS and Android apps that sync seamlessly with your main system.',
      features: ['Real-time synchronization', 'Offline functionality', 'Push notifications', 'Mobile billing']
    },
    {
      icon: Cloud,
      title: 'Cloud Infrastructure',
      description: 'Secure cloud-based system accessible from anywhere with internet connection.',
      features: ['99.9% uptime guarantee', 'Automatic backups', 'Global accessibility', 'Scalable infrastructure']
    },
    {
      icon: Wifi,
      title: 'API Integrations',
      description: 'Connect with existing systems and third-party services through our robust APIs.',
      features: ['RESTful APIs', 'Webhook support', 'Third-party integrations', 'Custom connections']
    },
    {
      icon: RefreshCw,
      title: 'Data Synchronization',
      description: 'Real-time data sync across all devices and locations for consistent information.',
      features: ['Real-time updates', 'Multi-device sync', 'Conflict resolution', 'Data consistency']
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Seamless{' '}
            <span className="text-primary-500">Integration</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            ShelfCure integrates smoothly with your existing workflow and systems, 
            ensuring minimal disruption during transition.
          </p>
        </div>

        {/* Integration Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-2 group"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-500 transition-colors duration-300">
                <integration.icon className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                  {integration.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {integration.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {integration.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3 text-sm text-secondary-600">
                      <div className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Flow */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Integration Flow
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              See how ShelfCure connects with your existing systems and workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-10 h-10 text-primary-500" />
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">
                Data Import
              </h4>
              <p className="text-secondary-600 text-sm">
                Import your existing data through CSV files, API connections, or manual entry.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-10 h-10 text-blue-500" />
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">
                System Sync
              </h4>
              <p className="text-secondary-600 text-sm">
                ShelfCure automatically syncs with your systems and validates all imported data.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-10 h-10 text-green-500" />
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">
                Go Live
              </h4>
              <p className="text-secondary-600 text-sm">
                Start using ShelfCure with all your data properly integrated and ready to use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationSection;
