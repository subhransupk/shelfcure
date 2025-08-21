import React from 'react';
import { Heart, Shield, Zap, Users, Target, Lightbulb } from 'lucide-react';

const ValuesSection = () => {
  const values = [
    {
      icon: Heart,
      title: 'Patient-Centric',
      description: 'Every decision we make is guided by how it will improve patient care and healthcare outcomes.',
      color: 'from-red-400 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'We maintain the highest standards of data security and privacy to earn and keep our customers\' trust.',
      color: 'from-blue-400 to-indigo-500'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We embrace cutting-edge technology and creative solutions to solve complex healthcare challenges.',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'We believe in the power of teamwork, both within our company and with our pharmacy partners.',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: Target,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from product development to customer support.',
      color: 'from-purple-400 to-violet-500'
    },
    {
      icon: Lightbulb,
      title: 'Continuous Learning',
      description: 'We foster a culture of learning, growth, and adaptation in our rapidly evolving industry.',
      color: 'from-cyan-400 to-blue-500'
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Our{' '}
            <span className="text-primary-500">Values</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            These core values shape our culture, guide our decisions, and define who we are as a company.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div
              key={index}
              className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-large hover:border-primary-200 transition-all duration-300 hover:-translate-y-2"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
              
              {/* Icon */}
              <div className={`relative w-16 h-16 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <value.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-xl font-bold text-secondary-900 mb-4 group-hover:text-primary-600 transition-colors duration-300">
                  {value.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Values in Action */}
        <div className="mt-20 bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Values in Action
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              See how our values translate into real impact for our customers and community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Action 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-primary-500" />
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">
                24/7 Support
              </h4>
              <p className="text-secondary-600 text-sm">
                Our patient-centric approach means we're always available when pharmacies need us most.
              </p>
            </div>

            {/* Action 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-blue-500" />
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">
                Data Protection
              </h4>
              <p className="text-secondary-600 text-sm">
                Enterprise-grade security ensures patient data and pharmacy information stays protected.
              </p>
            </div>

            {/* Action 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-green-500" />
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">
                Continuous Innovation
              </h4>
              <p className="text-secondary-600 text-sm">
                Regular updates and new features based on customer feedback and industry needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;
