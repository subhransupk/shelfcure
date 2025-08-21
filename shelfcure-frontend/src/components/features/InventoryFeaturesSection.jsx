import React from 'react';
import { Package, AlertTriangle, Calendar, BarChart3 } from 'lucide-react';

const InventoryFeaturesSection = () => {
  const inventoryFeatures = [
    {
      icon: Package,
      title: 'Dual Unit Tracking',
      description: 'Track medicines in both strips/packs and individual units simultaneously.',
      image: '/images/web-images/f2.png'
    },
    {
      icon: AlertTriangle,
      title: 'Smart Alerts',
      description: 'Automated low stock alerts and reorder notifications.',
      image: '/images/web-images/f3.png'
    },
    {
      icon: Calendar,
      title: 'Expiry Management',
      description: 'Track expiry dates and get alerts for medicines nearing expiration.',
      image: '/images/web-images/f4.png'
    },
    {
      icon: BarChart3,
      title: 'Stock Analytics',
      description: 'Detailed insights into stock movement and inventory trends.',
      image: '/images/web-images/f5.png'
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
            Advanced{' '}
            <span className="text-primary-500">Inventory Management</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Never run out of stock again with our intelligent inventory management system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {inventoryFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-large transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-7 h-7 text-primary-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-3">{feature.title}</h3>
                  <p className="text-secondary-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InventoryFeaturesSection;
