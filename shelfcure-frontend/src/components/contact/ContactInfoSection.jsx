import React from 'react';
import { Mail, Phone, MapPin, Clock, MessageCircle, Video, Headphones, Globe } from 'lucide-react';

const ContactInfoSection = () => {
  const contactMethods = [
    {
      icon: Phone,
      title: 'Phone Support',
      primary: '+91 12345 67890',
      secondary: 'Toll-free: 1800-123-4567',
      availability: 'Mon-Fri: 9:00 AM - 6:00 PM IST',
      description: 'Speak directly with our support team for immediate assistance.',
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Mail,
      title: 'Email Support',
      primary: 'support@shelfcure.com',
      secondary: 'sales@shelfcure.com',
      availability: 'Response within 2 hours',
      description: 'Send detailed inquiries and get comprehensive responses.',
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      primary: 'Available on website',
      secondary: 'In-app chat support',
      availability: '24/7 Available',
      description: 'Get instant help through our live chat system.',
      color: 'bg-primary-100 text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      icon: Video,
      title: 'Video Call Support',
      primary: 'Screen sharing available',
      secondary: 'One-on-one sessions',
      availability: 'By appointment',
      description: 'Get personalized help with screen sharing and video calls.',
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const officeInfo = [
    {
      icon: MapPin,
      title: 'Head Office',
      address: 'ShelfCure Technologies Pvt. Ltd.',
      details: 'Business District, Mumbai, Maharashtra 400001, India',
      hours: 'Mon-Fri: 9:00 AM - 6:00 PM IST'
    },
    {
      icon: Globe,
      title: 'Service Areas',
      address: 'Pan-India Coverage',
      details: 'Serving pharmacies across all major cities in India',
      hours: 'Remote support available 24/7'
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Multiple Ways to{' '}
            <span className="text-primary-500">Reach Us</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Choose the contact method that works best for you. We're available through 
            multiple channels to ensure you get the help you need, when you need it.
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {contactMethods.map((method, index) => (
            <div
              key={index}
              className={`${method.bgColor} rounded-2xl p-6 hover:shadow-large transition-all duration-300 hover:-translate-y-2 group cursor-pointer`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 ${method.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <method.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                  {method.title}
                </h3>
                
                <div className="space-y-1">
                  <p className="font-semibold text-secondary-800 text-sm">
                    {method.primary}
                  </p>
                  <p className="text-secondary-600 text-sm">
                    {method.secondary}
                  </p>
                </div>

                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-secondary-500" />
                    <span className="text-xs font-medium text-secondary-700">
                      {method.availability}
                    </span>
                  </div>
                  <p className="text-xs text-secondary-600">
                    {method.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Office Information */}
        <div className="grid md:grid-cols-2 gap-8">
          {officeInfo.map((office, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-large transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <office.icon className="w-6 h-6 text-primary-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-2">
                    {office.title}
                  </h3>
                  <div className="space-y-2">
                    <p className="font-semibold text-secondary-800">
                      {office.address}
                    </p>
                    <p className="text-secondary-600">
                      {office.details}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-secondary-500">
                      <Clock className="w-4 h-4" />
                      <span>{office.hours}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Contact */}
        <div className="mt-16 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-3xl p-8 md:p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Emergency Support
            </h3>
            <p className="text-red-100 mb-6 leading-relaxed">
              Experiencing a critical issue that's affecting your pharmacy operations? 
              Our emergency support team is available 24/7 for urgent matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-red-600 hover:bg-red-50 font-bold px-8 py-4 rounded-xl transition-colors duration-200">
                Call Emergency Line
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-red-600 font-bold px-8 py-4 rounded-xl transition-all duration-200">
                Emergency Chat
              </button>
            </div>
            <p className="text-red-200 text-sm mt-4">
              Emergency support is available for critical system issues only
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactInfoSection;
