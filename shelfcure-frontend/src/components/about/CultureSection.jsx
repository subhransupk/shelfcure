import React from 'react';
import { Coffee, Gamepad2, BookOpen, Award, Music, Palette } from 'lucide-react';

const CultureSection = () => {
  const cultureHighlights = [
    {
      icon: Coffee,
      title: 'Coffee & Code',
      description: 'Weekly coffee sessions where we discuss ideas, share knowledge, and bond as a team.',
      color: 'bg-amber-100 text-amber-600'
    },
    {
      icon: BookOpen,
      title: 'Learning Fridays',
      description: 'Dedicated time every Friday for learning new technologies and sharing insights.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Award,
      title: 'Innovation Awards',
      description: 'Monthly recognition for creative solutions and outstanding contributions.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Gamepad2,
      title: 'Game Nights',
      description: 'Regular team gaming sessions to unwind and strengthen team bonds.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Music,
      title: 'Music & Mood',
      description: 'Collaborative playlists and music corners to keep the energy high.',
      color: 'bg-pink-100 text-pink-600'
    },
    {
      icon: Palette,
      title: 'Creative Corner',
      description: 'Space for artistic expression and creative thinking beyond code.',
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Our{' '}
            <span className="text-primary-500">Culture</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            We believe that great products come from great teams, and great teams thrive in a positive, 
            supportive culture.
          </p>
        </div>

        {/* Culture Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {cultureHighlights.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-large hover:border-primary-200 transition-all duration-300 hover:-translate-y-2 group"
            >
              {/* Icon */}
              <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-secondary-900 mb-3 group-hover:text-primary-600 transition-colors duration-300">
                {item.title}
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Culture Values */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              What Makes Us Different
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Our culture is built on trust, creativity, and the shared mission of improving healthcare through technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Culture Stat 1 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                100%
              </div>
              <div className="text-secondary-600 font-medium">
                Remote Friendly
              </div>
            </div>

            {/* Culture Stat 2 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                4.8/5
              </div>
              <div className="text-secondary-600 font-medium">
                Employee Satisfaction
              </div>
            </div>

            {/* Culture Stat 3 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                20+
              </div>
              <div className="text-secondary-600 font-medium">
                Learning Hours/Month
              </div>
            </div>

            {/* Culture Stat 4 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                95%
              </div>
              <div className="text-secondary-600 font-medium">
                Retention Rate
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-soft max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 text-yellow-400 fill-current">⭐</div>
                ))}
              </div>
              <blockquote className="text-lg text-secondary-700 italic leading-relaxed">
                "Working at ShelfCure has been an incredible journey. The team is supportive, 
                the work is meaningful, and every day brings new opportunities to learn and grow. 
                I'm proud to be part of a company that's making a real difference in healthcare."
              </blockquote>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold">AS</span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-secondary-900">Arjun Singh</div>
                <div className="text-secondary-500 text-sm">Senior Developer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CultureSection;
