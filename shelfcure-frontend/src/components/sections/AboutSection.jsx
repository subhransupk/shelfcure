import React from 'react';
import { Target, Users, Award, Zap, Heart, Globe } from 'lucide-react';

const AboutSection = () => {
  const stats = [
    { number: '2023', label: 'Founded' },
    { number: '500+', label: 'Pharmacies Served' },
    { number: '50+', label: 'Team Members' },
    { number: '99.9%', label: 'Uptime' }
  ];

  const values = [
    {
      icon: Target,
      title: 'Innovation',
      description: 'We continuously innovate to bring cutting-edge technology solutions to the pharmacy industry.'
    },
    {
      icon: Users,
      title: 'Customer First',
      description: 'Our customers are at the heart of everything we do. Their success is our success.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our product and service delivery.'
    },
    {
      icon: Zap,
      title: 'Efficiency',
      description: 'We help pharmacies operate more efficiently through smart automation and streamlined processes.'
    },
    {
      icon: Heart,
      title: 'Care',
      description: 'We care deeply about improving healthcare accessibility and pharmacy operations.'
    },
    {
      icon: Globe,
      title: 'Impact',
      description: 'We aim to make a positive impact on the healthcare ecosystem across India and beyond.'
    }
  ];

  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            About{' '}
            <span className="text-primary-500">ShelfCure</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            We're on a mission to revolutionize pharmacy management through innovative technology, 
            helping pharmacy owners streamline operations and grow their businesses.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left Column - Story */}
          <div className="space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900">
              Transforming Pharmacy Operations with Technology
            </h3>
            <div className="space-y-4 text-secondary-600 leading-relaxed">
              <p>
                ShelfCure was born from a simple observation: pharmacy owners were struggling with 
                outdated, inefficient systems that hindered their ability to serve customers and 
                grow their businesses effectively.
              </p>
              <p>
                Our team of experienced developers and healthcare technology experts came together 
                to create a comprehensive MERN stack solution that addresses every aspect of 
                pharmacy management - from inventory tracking to sales analytics.
              </p>
              <p>
                Today, we're proud to serve over 500 pharmacies across India, helping them 
                streamline operations, reduce costs, and focus on what matters most: 
                providing excellent healthcare services to their communities.
              </p>
            </div>
            
            {/* Mission Statement */}
            <div className="bg-primary-50 p-6 rounded-xl border-l-4 border-primary-500">
              <h4 className="font-bold text-secondary-900 mb-2">Our Mission</h4>
              <p className="text-secondary-700">
                To empower pharmacy owners with intelligent, user-friendly technology that 
                simplifies operations, improves efficiency, and drives business growth.
              </p>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <img 
              src="/images/web-images/ab1.png" 
              alt="About ShelfCure" 
              className="w-full h-auto rounded-2xl shadow-large"
            />
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-large border border-gray-100">
              <div className="text-2xl font-bold text-primary-600">500+</div>
              <div className="text-sm text-secondary-600">Happy Customers</div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-secondary-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Our Core Values
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              These values guide everything we do and shape how we build products and serve our customers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary-500" />
                </div>
                <h4 className="text-xl font-bold text-secondary-900 mb-3">
                  {value.title}
                </h4>
                <p className="text-secondary-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-secondary-900 mb-4">
            Ready to Join Our Growing Community?
          </h3>
          <p className="text-secondary-600 mb-6 max-w-2xl mx-auto">
            Discover how ShelfCure can transform your pharmacy operations and help you 
            provide better service to your customers.
          </p>
          <button className="btn-primary text-lg px-8 py-4">
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
