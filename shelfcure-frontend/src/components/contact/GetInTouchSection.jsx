import React from 'react';
import { ArrowRight, Clock, Shield, Users, Star, MessageCircle, Phone, Mail } from 'lucide-react';

const GetInTouchSection = () => {
  const contactPromises = [
    {
      icon: Clock,
      title: 'Quick Response',
      description: 'We respond to all inquiries within 2 hours during business hours'
    },
    {
      icon: Shield,
      title: 'Secure Communication',
      description: 'All communications are encrypted and your data is kept confidential'
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Our support team has deep expertise in pharmacy operations'
    },
    {
      icon: Star,
      title: 'Satisfaction Guaranteed',
      description: 'We\'re committed to resolving your questions and concerns completely'
    }
  ];

  const quickActions = [
    {
      icon: MessageCircle,
      title: 'Start Live Chat',
      description: 'Get instant help from our support team',
      action: 'Chat Now',
      color: 'bg-primary-500 hover:bg-primary-600'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak directly with our team',
      action: 'Call Now',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Mail,
      title: 'Send Email',
      description: 'Send us a detailed message',
      action: 'Email Us',
      color: 'bg-green-500 hover:bg-green-600'
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
            Ready to Get{' '}
            <span className="text-green-200">Started?</span>
          </h2>
          
          <p className="text-lg md:text-xl text-primary-100 mb-12 leading-relaxed max-w-3xl mx-auto">
            Whether you have questions, need a demo, or want to start your ShelfCure journey, 
            we're here to help. Choose the contact method that works best for you.
          </p>

          {/* Quick Action Buttons */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-primary-100 text-sm mb-4">{action.description}</p>
                <button className="bg-white text-primary-600 hover:bg-primary-50 font-medium px-6 py-2 rounded-lg transition-colors duration-200 text-sm">
                  {action.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Promises */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {contactPromises.map((promise, index) => (
            <div
              key={index}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <promise.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">{promise.title}</h3>
              <p className="text-primary-100 text-sm leading-relaxed">{promise.description}</p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Let's Transform Your Pharmacy Together
          </h3>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of successful pharmacies using ShelfCure. Get started today 
            and see the difference modern technology can make for your business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="bg-white text-primary-600 hover:bg-primary-50 font-bold text-xl px-12 py-5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Start Free Trial
              <ArrowRight className="w-6 h-6 ml-2 inline" />
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold text-xl px-12 py-5 rounded-xl transition-all duration-200">
              Schedule Demo
            </button>
          </div>

          <div className="text-center">
            <p className="text-primary-200 mb-4">
              Questions? We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm">
              <a href="tel:+911234567890" className="text-white hover:text-green-200 font-medium transition-colors duration-200">
                📞 +91 12345 67890
              </a>
              <a href="mailto:support@shelfcure.com" className="text-white hover:text-green-200 font-medium transition-colors duration-200">
                ✉️ support@shelfcure.com
              </a>
              <span className="text-primary-200">
                💬 Live chat available 24/7
              </span>
            </div>
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

export default GetInTouchSection;
