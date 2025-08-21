import React from 'react';
import { Target, Eye, Compass, Zap } from 'lucide-react';

const MissionVisionSection = () => {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Mission &{' '}
            <span className="text-primary-500">Vision</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Our purpose drives everything we do, and our vision guides where we're heading.
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Mission Card */}
          <div className="relative group">
            <div className="bg-white rounded-3xl p-8 shadow-soft hover:shadow-large transition-all duration-300 group-hover:-translate-y-2">
              {/* Icon */}
              <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-500 transition-colors duration-300">
                <Target className="w-10 h-10 text-primary-500 group-hover:text-white transition-colors duration-300" />
              </div>
              
              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-secondary-900">
                  Our Mission
                </h3>
                <p className="text-lg text-secondary-600 leading-relaxed">
                  To empower pharmacy owners with intelligent, user-friendly technology that 
                  simplifies operations, improves efficiency, and drives business growth while 
                  enhancing patient care quality.
                </p>
                
                {/* Mission Points */}
                <ul className="space-y-3 mt-6">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-secondary-600">Streamline pharmacy operations through automation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-secondary-600">Improve patient care and medication management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-secondary-600">Enable data-driven business decisions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Vision Card */}
          <div className="relative group">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-8 text-white shadow-soft hover:shadow-large transition-all duration-300 group-hover:-translate-y-2">
              {/* Icon */}
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors duration-300">
                <Eye className="w-10 h-10 text-white" />
              </div>
              
              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold">
                  Our Vision
                </h3>
                <p className="text-lg text-primary-100 leading-relaxed">
                  To become the leading healthcare technology platform in India, transforming 
                  how pharmacies operate and setting new standards for patient care and 
                  business efficiency across the healthcare ecosystem.
                </p>
                
                {/* Vision Points */}
                <ul className="space-y-3 mt-6">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-primary-100">Leading healthcare technology platform in India</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-primary-100">Setting new industry standards for efficiency</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-primary-100">Expanding across the healthcare ecosystem</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Core Principles */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Our Core Principles
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              These fundamental principles guide our decisions and shape our culture.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Principle 1 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Compass className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-secondary-900 mb-2">
                  Customer-Centric Innovation
                </h4>
                <p className="text-secondary-600 leading-relaxed">
                  Every feature we build starts with understanding our customers' real needs 
                  and challenges. We innovate not for the sake of technology, but to solve 
                  genuine problems.
                </p>
              </div>
            </div>

            {/* Principle 2 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-secondary-900 mb-2">
                  Continuous Improvement
                </h4>
                <p className="text-secondary-600 leading-relaxed">
                  We believe in the power of iteration and continuous learning. Every day 
                  is an opportunity to make our platform better, our service more reliable, 
                  and our impact more meaningful.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionVisionSection;
