import React from 'react';
import { ArrowDown, Sparkles, Heart, Target } from 'lucide-react';

const AboutHeroSection = () => {
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
              <Sparkles className="w-4 h-4" />
              About ShelfCure
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 leading-tight">
                Transforming{' '}
                <span className="text-primary-500 relative">
                  Healthcare
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
                Through Innovation
              </h1>
              
              <p className="text-lg md:text-xl text-secondary-600 leading-relaxed max-w-2xl">
                We're on a mission to revolutionize pharmacy management with cutting-edge technology, 
                empowering healthcare providers to deliver exceptional patient care while growing their businesses.
              </p>
            </div>

            {/* Key Points */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-1">Patient-Centered</h3>
                  <p className="text-secondary-600 text-sm">Improving healthcare accessibility and quality</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-1">Innovation-Driven</h3>
                  <p className="text-secondary-600 text-sm">Leveraging latest technology for better outcomes</p>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="flex items-center gap-3 text-secondary-500 pt-8">
              <span className="text-sm">Discover our story</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative">
              <img 
                src="/images/web-images/ab1.png" 
                alt="About ShelfCure" 
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              
              {/* Floating Cards */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-lg animate-float">
                <div className="text-2xl font-bold text-primary-600">500+</div>
                <div className="text-sm text-secondary-600">Pharmacies</div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-lg animate-float animation-delay-1000">
                <div className="text-2xl font-bold text-blue-600">99.9%</div>
                <div className="text-sm text-secondary-600">Uptime</div>
              </div>
              
              <div className="absolute top-1/2 -right-8 bg-primary-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                <Heart className="w-6 h-6" />
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

export default AboutHeroSection;
