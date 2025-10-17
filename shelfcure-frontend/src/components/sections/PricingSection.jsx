import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Star, 
  Zap, 
  Crown, 
  ArrowRight,
  Store,
  Users,
  BarChart3,
  Shield,
  Headphones,
  Smartphone
} from 'lucide-react';

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: "Starter",
      description: "Perfect for single pharmacy stores",
      icon: Store,
      price: {
        monthly: 999,
        yearly: 9990
      },
      originalPrice: {
        monthly: 1499,
        yearly: 14990
      },
      popular: false,
      features: [
        "1 Store Management",
        "Basic Inventory System",
        "Sales & Billing",
        "Customer Management",
        "Basic Reports",
        "Email Support",
        "Mobile App Access"
      ],
      color: "blue",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      name: "Professional",
      description: "Ideal for growing pharmacy chains",
      icon: Users,
      price: {
        monthly: 1999,
        yearly: 19990
      },
      originalPrice: {
        monthly: 2999,
        yearly: 29990
      },
      popular: true,
      features: [
        "Up to 5 Stores",
        "Advanced Inventory with Dual Units",
        "AI Store Assistant",
        "Purchase Bill OCR",
        "Prescription OCR",
        "Advanced Analytics",
        "WhatsApp Integration",
        "Priority Support",
        "Staff Management",
        "Rack Management"
      ],
      color: "primary",
      gradient: "from-primary-500 to-primary-600"
    },
    {
      name: "Enterprise",
      description: "For large pharmacy chains & franchises",
      icon: Crown,
      price: {
        monthly: 3999,
        yearly: 39990
      },
      originalPrice: {
        monthly: 5999,
        yearly: 59990
      },
      popular: false,
      features: [
        "Unlimited Stores",
        "Full AI-Powered Suite",
        "Advanced OCR & Document Processing",
        "Multi-location Analytics",
        "B2B Affiliate Program",
        "Custom Integrations",
        "Dedicated Account Manager",
        "24/7 Phone Support",
        "Custom Training",
        "API Access",
        "White-label Options"
      ],
      color: "purple",
      gradient: "from-purple-500 to-purple-600"
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

  const savings = billingCycle === 'yearly' ? 33 : 0;

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2322c55e' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-4">
            Simple, Transparent{' '}
            <span className="text-primary-500">Pricing</span>
          </h2>
          <p className="text-lg md:text-xl text-secondary-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your pharmacy business. All plans include core features 
            with no hidden fees or setup costs.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-soft border border-gray-200">
            <button
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-800'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 relative ${
                billingCycle === 'yearly'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-800'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              {savings > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save {savings}%
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const currentPrice = plan.price[billingCycle];
            const originalPrice = plan.originalPrice[billingCycle];
            const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

            return (
              <motion.div
                key={index}
                variants={cardVariants}
                className={`relative group ${
                  plan.popular ? 'md:-mt-4 md:mb-4' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card */}
                <div className={`bg-white rounded-2xl shadow-soft hover:shadow-large transition-all duration-300 overflow-hidden h-full ${
                  plan.popular ? 'border-2 border-primary-200' : 'border border-gray-200'
                }`}>
                  {/* Header */}
                  <div className={`bg-gradient-to-r ${plan.gradient} p-6 text-white relative`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <p className="text-white/90 text-sm">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">₹{currentPrice.toLocaleString()}</span>
                        <span className="text-white/80">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/60 line-through text-sm">₹{originalPrice.toLocaleString()}</span>
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                          {discount}% OFF
                        </span>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                  </div>

                  {/* Features */}
                  <div className="p-6">
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                          <span className="text-secondary-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <motion.a
                      href="/register"
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg'
                          : 'bg-gray-100 text-secondary-700 hover:bg-gray-200'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Info */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
            <div className="flex items-center gap-3 justify-center">
              <Shield className="w-5 h-5 text-primary-500" />
              <span className="text-secondary-600 text-sm">30-day money back</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Zap className="w-5 h-5 text-primary-500" />
              <span className="text-secondary-600 text-sm">Instant activation</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Headphones className="w-5 h-5 text-primary-500" />
              <span className="text-secondary-600 text-sm">24/7 support</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Smartphone className="w-5 h-5 text-primary-500" />
              <span className="text-secondary-600 text-sm">Mobile optimized</span>
            </div>
          </div>

          <p className="text-secondary-600 mb-4">
            Need a custom plan for your enterprise? 
          </p>
          <motion.a
            href="/contact"
            className="text-primary-500 hover:text-primary-600 font-medium inline-flex items-center gap-2"
            whileHover={{ x: 5 }}
          >
            Contact our sales team
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
