import React from 'react';
import { Play, ArrowDown, Zap, Clock, CheckCircle } from 'lucide-react';

const HowItWorksHeroSection = () => {
  const quickStats = [
    { icon: Clock, label: '5 Minutes', description: 'Setup Time' },
    { icon: Zap, label: '3 Steps', description: 'To Get Started' },
    { icon: CheckCircle, label: '24/7', description: 'Support Available' }
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
              How It Works
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 leading-tight">
                Simple Steps to{' '}
                <span className="text-primary-500 relative">
                  Transform
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
                Your Pharmacy
              </h1>
              
              <p className="text-lg md:text-xl text-secondary-600 leading-relaxed max-w-2xl">
                Discover how ShelfCure's intuitive platform makes pharmacy management effortless. 
                From setup to daily operations, we've designed every step to be simple and efficient.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6">
              {quickStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <stat.icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="text-lg font-bold text-secondary-900">{stat.label}</div>
                  <div className="text-sm text-secondary-600">{stat.description}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn-primary text-lg px-8 py-4">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                Start Free Trial
              </button>
            </div>

            {/* Scroll Indicator */}
            <div className="flex items-center gap-3 text-secondary-500 pt-8">
              <span className="text-sm">See the complete process</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Process Visual */}
            <div className="relative">
              <img 
                src="/images/web-images/hero4.png" 
                alt="How ShelfCure Works" 
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              
              {/* Floating Process Steps */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-lg animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-sm font-medium text-secondary-700">Setup</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-8 bg-white p-4 rounded-2xl shadow-lg animate-float animation-delay-1000">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="text-sm font-medium text-secondary-700">Configure</span>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-lg animate-float animation-delay-2000">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="text-sm font-medium text-secondary-700">Grow</span>
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

export default HowItWorksHeroSection;
