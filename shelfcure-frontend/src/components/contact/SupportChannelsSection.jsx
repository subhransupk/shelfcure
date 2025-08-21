import React from 'react';
import { BookOpen, Video, Users, FileText, Download, ExternalLink } from 'lucide-react';

const SupportChannelsSection = () => {
  const supportResources = [
    {
      icon: BookOpen,
      title: 'Knowledge Base',
      description: 'Comprehensive guides and documentation to help you get the most out of ShelfCure.',
      stats: '200+ Articles',
      features: ['Step-by-step guides', 'Video tutorials', 'Best practices', 'Troubleshooting'],
      action: 'Browse Articles',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch detailed video guides covering all ShelfCure features and workflows.',
      stats: '50+ Videos',
      features: ['Feature walkthroughs', 'Setup guides', 'Advanced tips', 'Use case examples'],
      action: 'Watch Videos',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Users,
      title: 'Community Forum',
      description: 'Connect with other pharmacy owners and share experiences, tips, and solutions.',
      stats: '1000+ Members',
      features: ['Peer discussions', 'Expert answers', 'Feature requests', 'Success stories'],
      action: 'Join Community',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Technical documentation, API references, and integration guides for developers.',
      stats: '100+ Pages',
      features: ['API documentation', 'Integration guides', 'Technical specs', 'Code examples'],
      action: 'View Docs',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Self-Service{' '}
            <span className="text-primary-500">Resources</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Prefer to find answers on your own? We've got you covered with extensive 
            resources, tutorials, and community support.
          </p>
        </div>

        {/* Support Resources Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {supportResources.map((resource, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-large hover:bg-white transition-all duration-300 hover:-translate-y-2 group"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 ${resource.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <resource.icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                      {resource.title}
                    </h3>
                    <span className="text-sm font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full">
                      {resource.stats}
                    </span>
                  </div>
                  <p className="text-secondary-600 leading-relaxed">
                    {resource.description}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="font-semibold text-secondary-900 mb-3">What's Included:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {resource.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2 text-sm text-secondary-600">
                      <div className="w-1.5 h-1.5 bg-primary-400 rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button className="btn-secondary w-full justify-center group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                {resource.action}
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Quick Access Tools */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Quick Access Tools
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Get instant access to the most commonly needed resources and tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* System Status */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">
                System Status
              </h4>
              <p className="text-secondary-600 text-sm mb-4">
                Check real-time system status and uptime information.
              </p>
              <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                View Status Page →
              </button>
            </div>

            {/* Download Center */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-blue-500" />
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">
                Download Center
              </h4>
              <p className="text-secondary-600 text-sm mb-4">
                Access mobile apps, user guides, and other downloadable resources.
              </p>
              <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Browse Downloads →
              </button>
            </div>

            {/* Feature Requests */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">
                Feature Requests
              </h4>
              <p className="text-secondary-600 text-sm mb-4">
                Submit ideas for new features or improvements to ShelfCure.
              </p>
              <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Submit Request →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SupportChannelsSection;
