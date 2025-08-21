import React from 'react';
import { Shield, Lock, Database, Award, CheckCircle } from 'lucide-react';

const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'Data Protection',
      description: 'Enterprise-grade encryption and secure data handling protocols protect your sensitive pharmacy information.',
      features: [
        'End-to-end encryption',
        'SSL/TLS security',
        'Data anonymization',
        'Privacy compliance'
      ]
    },
    {
      icon: Lock,
      title: 'Secure Access',
      description: 'Multi-factor authentication and role-based access control ensure only authorized personnel can access your data.',
      features: [
        'Multi-factor authentication',
        'Role-based permissions',
        'Session management',
        'Access logging'
      ]
    },
    {
      icon: Database,
      title: 'Backup & Recovery',
      description: 'Automated daily backups and disaster recovery systems ensure your data is always safe and recoverable.',
      features: [
        'Automated daily backups',
        'Point-in-time recovery',
        'Disaster recovery plan',
        'Data redundancy'
      ]
    },
    {
      icon: Award,
      title: 'Compliance',
      description: 'Full compliance with healthcare data protection standards and industry regulations for pharmacy management.',
      features: [
        'Healthcare compliance',
        'Data protection laws',
        'Industry standards',
        'Regular audits'
      ]
    }
  ];

  const trustIndicators = [
    { label: '99.9% Uptime', value: 'Guaranteed' },
    { label: 'Data Centers', value: 'Multiple Locations' },
    { label: 'Security Audits', value: 'Regular' },
    { label: 'Compliance', value: '100%' }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Your Data is{' '}
            <span className="text-primary-500">Safe & Secure</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            We understand the importance of data security in healthcare. That's why we've 
            implemented enterprise-grade security measures to protect your pharmacy data.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className="text-center group hover:transform hover:-translate-y-2 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-500 transition-colors duration-300">
                <feature.icon className="w-10 h-10 text-primary-500 group-hover:text-white transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-secondary-900">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2 text-sm">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center justify-center gap-2 text-secondary-600">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-2">
                  {indicator.value}
                </div>
                <div className="text-secondary-600 font-medium">
                  {indicator.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Certifications */}
        <div className="text-center bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-secondary-900 mb-6">
            Security Certifications & Standards
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 mb-6">
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-soft">
              <Shield className="w-6 h-6 text-primary-500" />
              <span className="font-semibold text-secondary-700">ISO 27001</span>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-soft">
              <Lock className="w-6 h-6 text-primary-500" />
              <span className="font-semibold text-secondary-700">SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-soft">
              <Database className="w-6 h-6 text-primary-500" />
              <span className="font-semibold text-secondary-700">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-soft">
              <Award className="w-6 h-6 text-primary-500" />
              <span className="font-semibold text-secondary-700">HIPAA Ready</span>
            </div>
          </div>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Our security infrastructure meets the highest industry standards and is regularly 
            audited by third-party security experts to ensure your data remains protected.
          </p>
        </div>


      </div>
    </section>
  );
};

export default SecuritySection;
