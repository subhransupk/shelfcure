import React from 'react';
import { ArrowRight, Play, Shield, Users, Clock } from 'lucide-react';

const HeroSection = () => {
  return (
    <section id="home" className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden pt-16 lg:pt-20">
      <div className="container-max section-padding">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left Column - Main Content (60%) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Main Headline */}
            <div className="space-y-4 text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 leading-tight">
                Revolutionize Your{' '}
                <span className="text-primary-500 relative">
                  Pharmacy Business
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
              <p className="text-lg md:text-xl text-secondary-600 max-w-2xl leading-relaxed">
                Complete MERN stack medicine store management system with AI-powered features,
                multi-store support, and comprehensive analytics. Transform your pharmacy operations today.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn-primary text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 text-secondary-600">
                <Shield className="w-5 h-5 text-primary-500" />
                <span className="font-medium">99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-600">
                <Users className="w-5 h-5 text-primary-500" />
                <span className="font-medium">500+ Happy Pharmacies</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-600">
                <Clock className="w-5 h-5 text-primary-500" />
                <span className="font-medium">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual (40%) */}
          <div className="lg:col-span-2 relative">
            {/* Dashboard Image */}
            <div className="relative">
              <img
                src="/images/web-images/hero1.png"
                alt="ShelfCure Dashboard"
                className="w-full h-auto rounded-2xl shadow-large border border-gray-200"
              />

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-primary-500 text-white p-3 rounded-full shadow-lg animate-bounce">
                <Shield className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                <Users className="w-6 h-6" />
              </div>

              {/* Stats Overlay */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-medium">
                <div className="text-2xl font-bold text-primary-600">₹2.4L</div>
                <div className="text-sm text-secondary-600">Monthly Revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-50 to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-gradient-to-tr from-primary-50 to-transparent opacity-30"></div>
    </section>
  );
};

export default HeroSection;
