import React from 'react';
import { MessageCircle, Phone, Mail, BookOpen, Video, Users } from 'lucide-react';

const SupportSection = () => {
  const supportChannels = [
    {
      icon: MessageCircle,
      title: '24/7 Live Chat',
      description: 'Instant help through our in-app chat system with real human support agents.',
      availability: 'Available 24/7',
      responseTime: 'Under 2 minutes',
      color: 'bg-primary-100 text-primary-500'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Direct phone line to our technical support team for urgent issues.',
      availability: 'Mon-Fri 9AM-6PM',
      responseTime: 'Immediate',
      color: 'bg-blue-100 text-blue-500'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Detailed email support for complex queries and feature requests.',
      availability: 'Available 24/7',
      responseTime: 'Under 2 hours',
      color: 'bg-green-100 text-green-500'
    },
    {
      icon: Video,
      title: 'Screen Sharing',
      description: 'One-on-one screen sharing sessions for personalized assistance.',
      availability: 'By appointment',
      responseTime: 'Same day',
      color: 'bg-purple-100 text-purple-500'
    }
  ];

  const supportResources = [
    {
      icon: BookOpen,
      title: 'Knowledge Base',
      description: 'Comprehensive documentation and guides',
      count: '200+ Articles'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides for all features',
      count: '50+ Videos'
    },
    {
      icon: Users,
      title: 'Community Forum',
      description: 'Connect with other pharmacy owners',
      count: '1000+ Members'
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Always{' '}
            <span className="text-primary-500">Supported</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Our dedicated support team is here to help you succeed every step of the way. 
            Get help when you need it, how you need it.
          </p>
        </div>

        {/* Support Channels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {supportChannels.map((channel, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-2 group text-center"
            >
              {/* Icon */}
              <div className={`w-14 h-14 ${channel.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <channel.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">
                {channel.title}
              </h3>
              <p className="text-secondary-600 text-sm leading-relaxed mb-4">
                {channel.description}
              </p>

              {/* Details */}
              <div className="space-y-2 text-xs">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="font-medium text-secondary-700">{channel.availability}</span>
                </div>
                <div className="bg-primary-50 p-2 rounded-lg">
                  <span className="font-medium text-primary-700">Response: {channel.responseTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Support Resources */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Self-Service Resources
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Prefer to find answers on your own? We've got you covered with extensive resources.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {supportResources.map((resource, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <resource.icon className="w-8 h-8 text-primary-500" />
                </div>
                <h4 className="text-lg font-bold text-secondary-900 mb-2">
                  {resource.title}
                </h4>
                <p className="text-secondary-600 text-sm mb-3">
                  {resource.description}
                </p>
                <div className="text-primary-600 font-semibold text-sm">
                  {resource.count}
                </div>
              </div>
            ))}
          </div>

          {/* Support Promise */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-2xl text-center">
            <h4 className="text-xl font-bold text-secondary-900 mb-4">
              Our Support Promise
            </h4>
            <p className="text-secondary-600 max-w-2xl mx-auto mb-6">
              We're committed to your success. If you're not completely satisfied with our support, 
              we'll work with you until you are - that's our guarantee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Contact Support
              </button>
              <button className="btn-secondary">
                Browse Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SupportSection;
