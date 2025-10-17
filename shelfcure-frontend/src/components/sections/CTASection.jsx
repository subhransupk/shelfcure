import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Phone, CheckCircle, Star, Zap, Shield, Clock, Users } from 'lucide-react';

const CTASection = () => {
  const trialFeatures = [
    '30-day free trial',
    'No credit card required',
    'Full AI features access',
    'Cancel anytime',
    'Free data migration'
  ];

  const supportFeatures = [
    'Free setup assistance',
    'Complete data migration',
    'Comprehensive training',
    '24/7 priority support',
    'Dedicated success manager'
  ];

  return (
    <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-green-600 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-white/5 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full filter blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating Icons */}
        <motion.div
          className="absolute top-1/4 right-1/4 text-white/10"
          animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap className="w-16 h-16" />
        </motion.div>
        <motion.div
          className="absolute bottom-1/4 left-1/4 text-white/10"
          animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Shield className="w-12 h-12" />
        </motion.div>
      </div>

      <div className="relative z-10 container-max section-padding">
        <motion.div
          className="text-center max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium mb-6 border border-white/20"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Star className="w-4 h-4 fill-current text-yellow-300" />
            Trusted by 500+ Pharmacies Across India
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            className="text-3xl md:text-4xl lg:text-6xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Ready to Transform Your{' '}
            <span className="text-green-200 relative">
              Pharmacy Business?
              <motion.svg
                className="absolute -bottom-2 left-0 w-full h-3 text-green-300"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 1 }}
              >
                <motion.path
                  d="M2 10C50 2 100 2 150 6C200 10 250 4 298 6"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </motion.svg>
            </span>
          </motion.h2>

          <motion.p
            className="text-lg md:text-xl text-primary-100 mb-12 leading-relaxed max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Join thousands of successful pharmacies using ShelfCure's AI-powered platform to streamline operations,
            increase efficiency, and grow their business. Experience the future of pharmacy management today!
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.a
              href="/register"
              className="bg-white text-primary-600 hover:bg-primary-50 font-bold text-lg px-10 py-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl group"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Free Trial
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.a>
            <motion.a
              href="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold text-lg px-10 py-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 group"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Phone className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Talk to Sales
            </motion.a>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            className="grid md:grid-cols-2 gap-8 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Trial Features */}
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-400 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Free Trial Includes</h3>
              </div>
              <ul className="space-y-4">
                {trialFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span className="text-primary-100">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Support Features */}
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">We'll Help You Succeed</h3>
              </div>
              <ul className="space-y-4">
                {supportFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span className="text-primary-100">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="grid md:grid-cols-4 gap-8 items-center">
              {/* Rating */}
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex justify-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.2, delay: 0.9 + i * 0.1 }}
                    >
                      <Star className="w-6 h-6 text-yellow-300 fill-current" />
                    </motion.div>
                  ))}
                </div>
                <div className="text-3xl font-bold mb-1">4.9/5</div>
                <div className="text-primary-200 text-sm">Customer Rating</div>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-bold mb-1">500+</div>
                <div className="text-primary-200 text-sm">Happy Pharmacies</div>
              </motion.div>

              {/* Uptime */}
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-bold mb-1">99.9%</div>
                <div className="text-primary-200 text-sm">Uptime Guarantee</div>
              </motion.div>

              {/* Support */}
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex justify-center mb-2">
                  <Clock className="w-8 h-8 text-green-300" />
                </div>
                <div className="text-lg font-bold mb-1">24/7</div>
                <div className="text-primary-200 text-sm">Support Available</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom Text */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <p className="text-primary-200 text-lg mb-4">
              Questions? We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-lg">
              <motion.a
                href="tel:+911234567890"
                className="text-white font-semibold hover:text-green-200 transition-colors duration-200 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Phone className="w-5 h-5" />
                +91 12345 67890
              </motion.a>
              <span className="hidden sm:block text-primary-300">•</span>
              <motion.a
                href="mailto:support@shelfcure.com"
                className="text-white font-semibold hover:text-green-200 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
              >
                support@shelfcure.com
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
