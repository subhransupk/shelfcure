import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  CreditCard,
  Users,
  BarChart,
  Shield,
  Smartphone,
  Check,
  Bot,
  MessageSquare,
  Camera,
  ArrowRight
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Package,
      title: 'Dual Unit Inventory',
      description: 'Revolutionary inventory system supporting both strips/packs and individual units with smart tracking.',
      benefits: [
        'Dual unit inventory (strips + individual)',
        'Real-time stock monitoring',
        'Automated low stock alerts',
        'Batch and expiry tracking',
        'Smart reorder suggestions'
      ],
      color: 'primary'
    },
    {
      icon: Bot,
      title: 'AI Store Assistant',
      description: 'Conversational AI that manages your entire store through natural language commands.',
      benefits: [
        'Natural language processing',
        'Complete store management',
        'Automated task execution',
        'Smart recommendations',
        '24/7 AI availability'
      ],
      color: 'blue'
    },
    {
      icon: Camera,
      title: 'AI-Powered OCR',
      description: 'Advanced OCR technology for purchase bills and prescription processing with high accuracy.',
      benefits: [
        'Purchase Bill OCR extraction',
        'Prescription OCR scanning',
        'Automatic data entry',
        'Multi-format support (PDF/JPG/PNG)',
        'Error-free data capture'
      ],
      color: 'green'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Integration',
      description: 'Seamless WhatsApp integration for customer communication and business notifications.',
      benefits: [
        'Automated customer notifications',
        'Order status updates',
        'Low stock alerts to suppliers',
        'Marketing campaigns',
        'Two-way communication'
      ],
      color: 'emerald'
    },
    {
      icon: BarChart,
      title: 'Advanced Analytics',
      description: 'Comprehensive analytics dashboard with AI-powered insights and predictive analytics.',
      benefits: [
        'Real-time sales analytics',
        'Profit margin analysis',
        'Customer behavior insights',
        'Predictive inventory planning',
        'Custom report generation'
      ],
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'Multi-Store Management',
      description: 'Centralized management system for multiple pharmacy locations with role-based access.',
      benefits: [
        'Unlimited store management',
        'Centralized dashboard',
        'Store-wise performance tracking',
        'Cross-store inventory insights',
        'Role-based permissions'
      ],
      color: 'orange'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      primary: { bg: 'bg-primary-100', hover: 'bg-primary-500', text: 'text-primary-500', hoverText: 'text-white' },
      blue: { bg: 'bg-blue-100', hover: 'bg-blue-500', text: 'text-blue-500', hoverText: 'text-white' },
      green: { bg: 'bg-green-100', hover: 'bg-green-500', text: 'text-green-500', hoverText: 'text-white' },
      emerald: { bg: 'bg-emerald-100', hover: 'bg-emerald-500', text: 'text-emerald-500', hoverText: 'text-white' },
      purple: { bg: 'bg-purple-100', hover: 'bg-purple-500', text: 'text-purple-500', hoverText: 'text-white' },
      orange: { bg: 'bg-orange-100', hover: 'bg-orange-500', text: 'text-orange-500', hoverText: 'text-white' }
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <section id="features" className="section-padding bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-max relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Powerful Features for{' '}
            <span className="text-primary-500">Modern Pharmacies</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Our comprehensive MERN stack solution combines cutting-edge AI technology
            with intuitive design to revolutionize pharmacy management.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                className="group"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-large hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 h-full">
                  {/* Icon */}
                  <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:${colors.hover} transition-colors duration-300`}>
                    <feature.icon className={`w-8 h-8 ${colors.text} group-hover:${colors.hoverText} transition-colors duration-300`} />
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
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-secondary-600 mb-6">
            Ready to transform your pharmacy operations with AI-powered features?
          </p>
          <motion.a
            href="/register"
            className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
