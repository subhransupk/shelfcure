import React from 'react';
import { UserPlus, Shield, Clock, Gift, ArrowDown } from 'lucide-react';

const RegisterHeroSection = () => {
  const registrationBenefits = [
    { icon: Shield, label: 'Secure', description: 'Protected data' },
    { icon: Clock, label: 'Quick Setup', description: '5 min registration' },
    { icon: Gift, label: 'Free Trial', description: '30 days free' }
  ];

  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-blue-50 overflow-hidden pt-16 lg:pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container-max section-padding">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
              <UserPlus className="w-4 h-4" />
              Store Owner Registration
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 leading-tight">
                Start Your{' '}
                <span className="text-primary-500 relative">
                  Journey
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-primary-200"
                    viewBox="0 0 300 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10C50 2 100 2 150 6C200 10 250 4 298 6"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{' '}
                with ShelfCure
              </h1>
              
              <p className="text-lg md:text-xl text-secondary-600 leading-relaxed max-w-2xl">
                Join thousands of pharmacy owners who have transformed their business with ShelfCure. 
                Create your account in just a few minutes and start your free trial today.
              </p>
            </div>

            {/* Registration Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {registrationBenefits.map((benefit, index) => (
                <div key={index} className="text-center sm:text-left">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto sm:mx-0 mb-3">
                    <benefit.icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="font-semibold text-secondary-900 mb-1">{benefit.label}</div>
                  <div className="text-sm text-secondary-600">{benefit.description}</div>
                </div>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-primary-500" />
                <span className="font-semibold text-secondary-900">100% Secure Registration</span>
              </div>
              <p className="text-secondary-600 text-sm">
                Your information is protected with enterprise-grade security. We never share your data 
                with third parties and you can cancel anytime.
              </p>
            </div>

            {/* Scroll Indicator */}
            <div className="flex items-center gap-3 text-secondary-500 pt-8">
              <span className="text-sm">Complete registration form below</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Registration Visual */}
            <div className="relative">
              <img 
                src="/images/web-images/hero9.png" 
                alt="Store Owner Registration" 
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              
              {/* Floating Registration Elements */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-lg animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-secondary-700">Quick Setup</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-8 bg-white p-4 rounded-2xl shadow-lg animate-float animation-delay-1000">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-600">30 Days</div>
                  <div className="text-xs text-secondary-600">Free Trial</div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-primary-500 text-white p-4 rounded-2xl shadow-lg animate-float animation-delay-2000">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  <span className="text-sm font-medium">Join 1000+ Stores</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
};

export default RegisterHeroSection;
