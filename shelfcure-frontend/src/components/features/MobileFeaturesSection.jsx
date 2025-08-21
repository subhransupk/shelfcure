import React from 'react';
import { Smartphone, Wifi, Bell, RefreshCw, Download, Camera, BarChart, Users } from 'lucide-react';

const MobileFeaturesSection = () => {
  const mobileFeatures = [
    {
      icon: Smartphone,
      title: 'Native Mobile Apps',
      description: 'Dedicated iOS and Android apps designed specifically for pharmacy management on mobile.',
      features: ['Native performance', 'Intuitive interface', 'Touch-optimized', 'Regular updates'],
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Wifi,
      title: 'Offline Functionality',
      description: 'Continue working even without internet connection with automatic sync when reconnected.',
      features: ['Offline billing', 'Local data storage', 'Auto synchronization', 'Conflict resolution'],
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Stay informed with real-time notifications about important events and alerts.',
      features: ['Stock alerts', 'Sales notifications', 'System updates', 'Custom alerts'],
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Camera,
      title: 'Mobile Scanning',
      description: 'Use your phone camera to scan barcodes, QR codes, and bills for quick data entry.',
      features: ['Barcode scanning', 'QR code reading', 'Bill OCR', 'Product lookup'],
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const mobileCapabilities = [
    { icon: RefreshCw, title: 'Real-time Sync', description: 'Instant data synchronization' },
    { icon: Download, title: 'App Store Ready', description: 'Available on iOS & Android' },
    { icon: BarChart, title: 'Mobile Analytics', description: 'View reports on mobile' },
    { icon: Users, title: 'Team Access', description: 'Multi-user mobile support' }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Mobile{' '}
            <span className="text-primary-500">Accessibility</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Manage your pharmacy on the go with our powerful mobile applications that bring
            full functionality to your smartphone and tablet.
          </p>
        </div>

        {/* Mobile Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {mobileFeatures.map((feature, index) => (
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

        {/* Mobile Capabilities */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Mobile Capabilities
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Everything you need to run your pharmacy efficiently from your mobile device.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {mobileCapabilities.map((capability, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500 transition-colors duration-200">
                  <capability.icon className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-200" />
                </div>
                <h4 className="font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                  {capability.title}
                </h4>
                <p className="text-secondary-600 text-sm">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile App Download CTA */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-2xl">
          <div className="max-w-2xl mx-auto">
            <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-4">
              Download ShelfCure Mobile App
            </h3>
            <p className="text-primary-100 mb-6 leading-relaxed">
              Get the full power of ShelfCure in your pocket. Download our mobile app
              and manage your pharmacy from anywhere, anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 hover:bg-primary-50 font-bold px-8 py-4 rounded-xl transition-colors duration-200">
                Download for iOS
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold px-8 py-4 rounded-xl transition-all duration-200">
                Download for Android
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileFeaturesSection;
