import React from 'react';
import { Calendar, Rocket, Users, Award, Globe, Zap } from 'lucide-react';

const TimelineSection = () => {
  const timelineEvents = [
    {
      year: '2023',
      quarter: 'Q1',
      icon: Rocket,
      title: 'ShelfCure Founded',
      description: 'Started with a vision to transform pharmacy management through technology.',
      color: 'bg-primary-500'
    },
    {
      year: '2023',
      quarter: 'Q2',
      icon: Users,
      title: 'First 50 Pharmacies',
      description: 'Onboarded our first 50 pharmacy partners and gathered valuable feedback.',
      color: 'bg-blue-500'
    },
    {
      year: '2023',
      quarter: 'Q3',
      icon: Zap,
      title: 'AI Features Launch',
      description: 'Introduced AI-powered Bill OCR and automated inventory management.',
      color: 'bg-green-500'
    },
    {
      year: '2023',
      quarter: 'Q4',
      icon: Award,
      title: '500+ Pharmacies',
      description: 'Reached 500+ pharmacy partners and processed 1M+ transactions.',
      color: 'bg-purple-500'
    },
    {
      year: '2024',
      quarter: 'Q1',
      icon: Globe,
      title: 'Multi-City Expansion',
      description: 'Expanded operations to 10+ major cities across India.',
      color: 'bg-orange-500'
    },
    {
      year: '2024',
      quarter: 'Q2',
      icon: Calendar,
      title: 'Future Vision',
      description: 'Planning international expansion and advanced healthcare integrations.',
      color: 'bg-pink-500'
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Our{' '}
            <span className="text-primary-500">Journey</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            From a simple idea to transforming healthcare technology across India.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200 hidden lg:block"></div>

          <div className="space-y-12">
            {timelineEvents.map((event, index) => (
              <div
                key={index}
                className={`flex items-center ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } flex-col lg:gap-16 gap-8`}
              >
                {/* Content Card */}
                <div className="lg:w-1/2 w-full">
                  <div className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 ${event.color} rounded-xl flex items-center justify-center`}>
                        <event.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-secondary-500 font-medium">
                          {event.year} {event.quarter}
                        </div>
                        <h3 className="text-xl font-bold text-secondary-900">
                          {event.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-secondary-600 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Timeline Node */}
                <div className="relative lg:block hidden">
                  <div className={`w-6 h-6 ${event.color} rounded-full border-4 border-white shadow-lg`}></div>
                  <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full`}></div>
                </div>

                {/* Spacer for opposite side */}
                <div className="lg:w-1/2 w-full lg:block hidden"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Future Vision */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4">
            The Journey Continues
          </h3>
          <p className="text-primary-100 max-w-2xl mx-auto mb-6">
            We're just getting started. Our roadmap includes exciting new features, 
            international expansion, and deeper healthcare ecosystem integrations.
          </p>
          <button className="bg-white text-primary-600 hover:bg-primary-50 font-bold px-8 py-4 rounded-xl transition-colors duration-200">
            Join Our Journey
          </button>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
