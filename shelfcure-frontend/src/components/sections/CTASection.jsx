import React from 'react';
import { ArrowRight, Phone, CheckCircle, Star } from 'lucide-react';

const CTASection = () => {
  const trialFeatures = [
    '14-day free trial',
    'No credit card required',
    'Full feature access',
    'Cancel anytime'
  ];

  const supportFeatures = [
    'Free setup assistance',
    'Data migration included',
    'Training & onboarding',
    '24/7 customer support'
  ];

  return (
    <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-green-600 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-1"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-white to-transparent opacity-20 transform skew-y-1"></div>
      </div>

      <div className="relative z-10 container-max section-padding">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Ready to Transform Your{' '}
            <span className="text-green-200">Pharmacy Business?</span>
          </h2>
          
          <p className="text-lg md:text-xl text-primary-100 mb-12 leading-relaxed max-w-3xl mx-auto">
            Join hundreds of successful pharmacies using ShelfCure to streamline operations, 
            increase efficiency, and grow their business. Start your journey today!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <button className="bg-white text-primary-600 hover:bg-primary-50 font-bold text-lg px-10 py-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Start Free Trial
              <ArrowRight className="w-6 h-6" />
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold text-lg px-10 py-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-3">
              <Phone className="w-6 h-6" />
              Talk to Sales
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Trial Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-center">Free Trial Includes</h3>
              <ul className="space-y-3">
                {trialFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span className="text-primary-100">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-center">We'll Help You Succeed</h3>
              <ul className="space-y-3">
                {supportFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span className="text-primary-100">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Rating */}
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-300 fill-current" />
                  ))}
                </div>
                <div className="text-2xl font-bold">4.9/5</div>
                <div className="text-primary-200">Customer Rating</div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-16 bg-white/30"></div>

              {/* Stats */}
              <div className="text-center">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-primary-200">Happy Pharmacies</div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-16 bg-white/30"></div>

              {/* Uptime */}
              <div className="text-center">
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-primary-200">Uptime Guarantee</div>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="mt-8 text-center">
            <p className="text-primary-200 text-lg">
              Questions? Call us at{' '}
              <a href="tel:+911234567890" className="text-white font-semibold hover:underline">
                +91 12345 67890
              </a>{' '}
              or email{' '}
              <a href="mailto:support@shelfcure.com" className="text-white font-semibold hover:underline">
                support@shelfcure.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
      <div className="absolute top-1/2 left-5 w-12 h-12 bg-white/10 rounded-full animate-ping"></div>
    </section>
  );
};

export default CTASection;
