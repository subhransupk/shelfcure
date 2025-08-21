import React, { useState } from 'react';
import { Package, CreditCard, BarChart, Smartphone, Camera, Users, Check } from 'lucide-react';

const FeaturesInActionSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Real-time tracking of medicines with dual unit support and automated alerts.',
      image: '/images/web-images/f4.png',
      benefits: ['Real-time stock monitoring', 'Automated low stock alerts', 'Batch tracking', 'Expiry management']
    },
    {
      icon: CreditCard,
      title: 'Sales & Billing',
      description: 'Streamlined billing process with multiple payment options and invoice generation.',
      image: '/images/web-images/f5.png',
      benefits: ['Quick billing process', 'Multiple payment methods', 'Automatic invoice generation', 'Tax calculations']
    },
    {
      icon: Camera,
      title: 'AI Bill OCR',
      description: 'Automatically scan and digitize paper bills using advanced AI technology.',
      image: '/images/web-images/hero5.png',
      benefits: ['Automatic bill scanning', 'Data extraction', 'Error reduction', 'Time savings']
    },
    {
      icon: BarChart,
      title: 'Analytics & Reports',
      description: 'Comprehensive analytics dashboard with detailed insights and custom reports.',
      image: '/images/web-images/hero6.png',
      benefits: ['Sales analytics', 'Profit tracking', 'Customer insights', 'Custom reports']
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Features in{' '}
            <span className="text-primary-500">Action</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            See how ShelfCure's powerful features work in real pharmacy environments 
            to streamline operations and boost efficiency.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feature Tabs */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => setActiveFeature(index)}
                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                  activeFeature === index
                    ? 'bg-primary-500 text-white shadow-large'
                    : 'bg-gray-50 hover:bg-primary-50 hover:shadow-medium'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeFeature === index ? 'bg-white/20' : 'bg-primary-100'
                  }`}>
                    <feature.icon className={`w-6 h-6 ${
                      activeFeature === index ? 'text-white' : 'text-primary-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${
                      activeFeature === index ? 'text-white' : 'text-secondary-900'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm ${
                      activeFeature === index ? 'text-primary-100' : 'text-secondary-600'
                    }`}>
                      Click to see in action
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Feature Details */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-soft">
              {/* Feature Image */}
              <div className="relative mb-6">
                <img 
                  src={features[activeFeature].image} 
                  alt={features[activeFeature].title}
                  className="w-full h-64 object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-primary-500/10 rounded-2xl"></div>
              </div>

              {/* Feature Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-secondary-900 mb-3">
                    {features[activeFeature].title}
                  </h3>
                  <p className="text-secondary-600 leading-relaxed">
                    {features[activeFeature].description}
                  </p>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="text-lg font-semibold text-secondary-900 mb-4">
                    Key Benefits:
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {features[activeFeature].benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-500" />
                        </div>
                        <span className="text-secondary-600 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                  <button className="btn-primary flex-1 justify-center">
                    Try This Feature
                  </button>
                  <button className="btn-secondary flex-1 justify-center">
                    Watch Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesInActionSection;
