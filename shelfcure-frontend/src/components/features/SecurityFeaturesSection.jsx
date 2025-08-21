import React from 'react';
import { Shield, Lock, Key, Eye, FileCheck, UserCheck, AlertTriangle, CheckCircle } from 'lucide-react';

const SecurityFeaturesSection = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'Data Encryption',
      description: 'All data is encrypted using 256-bit SSL encryption both in transit and at rest.',
      features: ['256-bit SSL encryption', 'End-to-end security', 'Encrypted backups', 'Secure data transfer'],
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Key,
      title: 'Access Control',
      description: 'Role-based permissions ensure only authorized users can access sensitive information.',
      features: ['Role-based permissions', 'User authentication', 'Session management', 'Access logging'],
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Eye,
      title: 'Audit Trail',
      description: 'Complete audit trail of all system activities for compliance and security monitoring.',
      features: ['Activity logging', 'User tracking', 'Change history', 'Compliance reports'],
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: FileCheck,
      title: 'Compliance',
      description: 'Built-in compliance features to meet healthcare and pharmacy regulatory requirements.',
      features: ['HIPAA compliance', 'Data privacy laws', 'Regulatory reporting', 'Documentation'],
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const securityCertifications = [
    { icon: CheckCircle, title: 'ISO 27001', description: 'Information security management' },
    { icon: Shield, title: 'SOC 2 Type II', description: 'Security and availability controls' },
    { icon: Lock, title: 'GDPR Compliant', description: 'Data protection regulation' },
    { icon: UserCheck, title: 'HIPAA Ready', description: 'Healthcare data protection' }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Enterprise-Grade{' '}
            <span className="text-primary-500">Security</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Your pharmacy data is protected with bank-level security measures and compliance
            standards that meet the strictest healthcare regulations.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className={`${feature.bgColor} rounded-3xl p-8 hover:shadow-large transition-all duration-300 hover:-translate-y-2 group`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Feature List */}
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-3 text-sm text-secondary-600">
                      <div className={`w-2 h-2 bg-gradient-to-r ${feature.color} rounded-full flex-shrink-0`}></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Security Certifications */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Security Certifications
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              We maintain the highest security standards with industry-recognized certifications.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {securityCertifications.map((cert, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500 transition-colors duration-200">
                  <cert.icon className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-200" />
                </div>
                <h4 className="font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                  {cert.title}
                </h4>
                <p className="text-secondary-600 text-sm">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Security Promise */}
        <div className="text-center mt-16 bg-gradient-to-r from-green-500 to-green-600 text-white p-8 rounded-2xl">
          <div className="max-w-2xl mx-auto">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-4">
              Your Data Security is Our Priority
            </h3>
            <p className="text-green-100 leading-relaxed">
              We understand that your pharmacy data is sensitive and critical to your business.
              That's why we've implemented multiple layers of security to ensure your information
              is always protected and accessible only to authorized users.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityFeaturesSection;
