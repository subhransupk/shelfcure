import React from 'react';
import { MessageCircle, Phone, Mail, ArrowDown, Clock, Users, Headphones } from 'lucide-react';

const ContactHeroSection = () => {
  const quickContact = [
    { icon: Phone, label: '+91 12345 67890', description: 'Call us directly' },
    { icon: Mail, label: 'support@shelfcure.com', description: 'Send us an email' },
    { icon: MessageCircle, label: 'Live Chat', description: 'Chat with our team' }
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
              <Headphones className="w-4 h-4" />
              Contact Us
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 leading-tight">
                Let's{' '}
                <span className="text-primary-500 relative">
                  Connect
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
                & Grow Together
              </h1>
              
              <p className="text-lg md:text-xl text-secondary-600 leading-relaxed max-w-2xl">
                Have questions about ShelfCure? Want to see a demo? Need technical support? 
                We're here to help you succeed. Reach out to us through any channel that works best for you.
              </p>
            </div>

            {/* Quick Contact Options */}
            <div className="space-y-4">
              {quickContact.map((contact, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-1 cursor-pointer group">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-200">
                    <contact.icon className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <div className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-200">
                      {contact.label}
                    </div>
                    <div className="text-sm text-secondary-600">
                      {contact.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Response Time */}
            <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-primary-500" />
                <span className="font-semibold text-secondary-900">Quick Response Guarantee</span>
              </div>
              <p className="text-secondary-600 text-sm">
                We typically respond to all inquiries within 2 hours during business hours. 
                For urgent support, call us directly for immediate assistance.
              </p>
            </div>

            {/* Scroll Indicator */}
            <div className="flex items-center gap-3 text-secondary-500 pt-8">
              <span className="text-sm">Explore all contact options</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Contact Visual */}
            <div className="relative">
              <img
                src="/images/web-images/hero3.png"
                alt="Contact ShelfCure"
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              
              {/* Floating Contact Elements */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-lg animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-secondary-700">Online Now</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-8 bg-white p-4 rounded-2xl shadow-lg animate-float animation-delay-1000">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-600">2 min</div>
                  <div className="text-xs text-secondary-600">Avg Response</div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-primary-500 text-white p-4 rounded-2xl shadow-lg animate-float animation-delay-2000">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">24/7 Support</span>
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

export default ContactHeroSection;
