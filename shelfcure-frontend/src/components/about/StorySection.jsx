import React from 'react';
import { BookOpen, Lightbulb, Users, Rocket } from 'lucide-react';

const StorySection = () => {
  const storyPoints = [
    {
      icon: Lightbulb,
      title: 'The Problem',
      description: 'We noticed pharmacy owners struggling with outdated systems, manual processes, and inefficient workflows that hindered their ability to serve patients effectively.'
    },
    {
      icon: BookOpen,
      title: 'The Research',
      description: 'Our team spent months understanding the pain points, interviewing pharmacy owners, and studying the healthcare technology landscape.'
    },
    {
      icon: Users,
      title: 'The Team',
      description: 'We assembled a diverse team of healthcare experts, software engineers, and design professionals passionate about making a difference.'
    },
    {
      icon: Rocket,
      title: 'The Solution',
      description: 'ShelfCure was born - a comprehensive MERN stack platform designed specifically for modern pharmacy management needs.'
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Our{' '}
            <span className="text-primary-500">Story</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Every great solution starts with a problem worth solving. Here's how ShelfCure came to life.
          </p>
        </div>

        {/* Main Story Content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left Column - Image */}
          <div className="relative">
            <div className="relative">
              <img 
                src="/images/web-images/hero2.png" 
                alt="Our Story" 
                className="w-full h-auto rounded-2xl shadow-large"
              />
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary-500" />
              </div>
            </div>
          </div>

          {/* Right Column - Story Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              Founded in 2023
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900">
              From Frustration to Innovation
            </h3>
            
            <div className="space-y-4 text-secondary-600 leading-relaxed">
              <p>
                It all started when our founder visited a local pharmacy and witnessed the owner 
                struggling with multiple disconnected systems, paper-based inventory tracking, 
                and hours of manual data entry every day.
              </p>
              
              <p>
                That moment sparked a question: "Why should healthcare providers waste time on 
                administrative tasks when they could be focusing on patient care?"
              </p>
              
              <p>
                We realized that while other industries had embraced digital transformation, 
                many pharmacies were still operating with outdated tools that limited their 
                potential to grow and serve their communities effectively.
              </p>
            </div>

            {/* Quote */}
            <div className="bg-primary-50 border-l-4 border-primary-500 p-6 rounded-r-xl">
              <blockquote className="text-secondary-700 italic text-lg">
                "We didn't just want to build another software. We wanted to create a platform 
                that would genuinely transform how pharmacies operate and help them thrive in 
                the digital age."
              </blockquote>
              <cite className="text-primary-600 font-semibold mt-3 block">
                - ShelfCure Founding Team
              </cite>
            </div>
          </div>
        </div>

        {/* Story Timeline */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {storyPoints.map((point, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connecting Line (Desktop) */}
              {index < storyPoints.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-primary-100 transform translate-x-4"></div>
              )}
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-large hover:border-primary-200 transition-all duration-300 group-hover:-translate-y-2">
                {/* Icon */}
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-500 transition-colors duration-300">
                  <point.icon className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-300" />
                </div>
                
                {/* Content */}
                <h4 className="text-xl font-bold text-secondary-900 mb-3">
                  {point.title}
                </h4>
                <p className="text-secondary-600 leading-relaxed">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-secondary-900 mb-4">
            Want to Be Part of Our Story?
          </h3>
          <p className="text-secondary-600 mb-6 max-w-2xl mx-auto">
            Join hundreds of pharmacies that have already transformed their operations with ShelfCure.
          </p>
          <div className="flex justify-center">
            <button className="btn-primary text-lg px-8 py-4">
              Start Your Journey
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
