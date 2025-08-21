import React from 'react';
import { Zap, ArrowDown, Package, CreditCard, BarChart, Smartphone } from 'lucide-react';

const FeaturesHeroSection = () => {
  const featureHighlights = [
    { icon: Package, label: 'Inventory', description: 'Smart tracking' },
    { icon: CreditCard, label: 'Billing', description: 'Quick & easy' },
    { icon: BarChart, label: 'Analytics', description: 'Real-time insights' },
    { icon: Smartphone, label: 'Mobile', description: 'Anywhere access' }
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
              <Zap className="w-4 h-4" />
              Powerful Features
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 leading-tight">
                Everything You Need to{' '}
                <span className="text-primary-500 relative">
                  Succeed
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
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-secondary-600 leading-relaxed max-w-2xl">
                Discover the comprehensive suite of features that make ShelfCure the most powerful 
                pharmacy management system. From inventory tracking to AI-powered insights, 
                we've got everything covered.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {featureHighlights.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 hover:bg-primary-500 hover:text-white transition-all duration-200 group cursor-pointer">
                    <feature.icon className="w-7 h-7 text-primary-500 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div className="font-semibold text-secondary-900 mb-1">{feature.label}</div>
                  <div className="text-sm text-secondary-600">{feature.description}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn-primary text-lg px-8 py-4">
                Start Free Trial
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                Watch Demo
              </button>
            </div>

            {/* Scroll Indicator */}
            <div className="flex items-center gap-3 text-secondary-500 pt-8">
              <span className="text-sm">Explore all features below</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Features Visual */}
            <div className="relative">
              <img 
                src="/images/web-images/f1.png" 
                alt="ShelfCure Features" 
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              
              {/* Floating Feature Elements */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-lg animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-secondary-700">Live Updates</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-8 bg-white p-4 rounded-2xl shadow-lg animate-float animation-delay-1000">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-600">50+</div>
                  <div className="text-xs text-secondary-600">Features</div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-primary-500 text-white p-4 rounded-2xl shadow-lg animate-float animation-delay-2000">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-medium">AI Powered</span>
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

export default FeaturesHeroSection;
