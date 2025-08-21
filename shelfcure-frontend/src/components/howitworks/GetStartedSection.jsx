import React from 'react';
import { ArrowRight, CheckCircle, Clock, Shield, Users } from 'lucide-react';

const GetStartedSection = () => {
  const trialFeatures = [
    'Full feature access for 14 days',
    'No credit card required',
    'Free data migration assistance',
    'Personal onboarding session',
    'Cancel anytime, no questions asked'
  ];

  const steps = [
    {
      number: 1,
      title: 'Sign Up',
      description: 'Create your free account in under 2 minutes'
    },
    {
      number: 2,
      title: 'Setup Call',
      description: 'Schedule a personalized onboarding session'
    },
    {
      number: 3,
      title: 'Start Using',
      description: 'Begin transforming your pharmacy operations'
    }
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-primary-500 via-primary-600 to-green-600 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-1"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-white to-transparent opacity-20 transform skew-y-1"></div>
      </div>

      <div className="relative z-10 container-max">
        {/* Main CTA */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Ready to Transform Your{' '}
            <span className="text-green-200">Pharmacy?</span>
          </h2>
          
          <p className="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed max-w-3xl mx-auto">
            Join hundreds of successful pharmacies using ShelfCure. Start your free trial today 
            and see the difference modern technology can make.
          </p>

          {/* Quick Steps */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white text-primary-600 rounded-full flex items-center justify-center font-bold text-lg">
                  {step.number}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">{step.title}</div>
                  <div className="text-primary-200 text-sm">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-primary-200 hidden md:block" />
                )}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button className="bg-white text-primary-600 hover:bg-primary-50 font-bold text-xl px-12 py-5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 mb-8">
            Start Your Free Trial
            <ArrowRight className="w-6 h-6 ml-2 inline" />
          </button>
        </div>

        {/* Trial Features */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Features */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Your Free Trial Includes
            </h3>
            <ul className="space-y-4">
              {trialFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-primary-100">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column - Guarantees */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Our Guarantees
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Data Security</h4>
                  <p className="text-primary-200 text-sm">Enterprise-grade security for all your pharmacy data</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">99.9% Uptime</h4>
                  <p className="text-primary-200 text-sm">Reliable service you can count on every day</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Expert Support</h4>
                  <p className="text-primary-200 text-sm">Dedicated support team with pharmacy expertise</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Contact */}
        <div className="text-center mt-16">
          <p className="text-primary-200 text-lg mb-4">
            Have questions before getting started?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold px-8 py-4 rounded-xl transition-all duration-200">
              Schedule a Demo
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold px-8 py-4 rounded-xl transition-all duration-200">
              Talk to Sales
            </button>
          </div>
          <p className="text-primary-200 text-sm mt-4">
            Call us at{' '}
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

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
      <div className="absolute top-1/2 left-5 w-12 h-12 bg-white/10 rounded-full animate-ping"></div>
    </section>
  );
};

export default GetStartedSection;
