import React from 'react';
import { Users, BookOpen, Video, MessageCircle, CheckCircle, Clock } from 'lucide-react';

const OnboardingSection = () => {
  const onboardingSteps = [
    {
      icon: Users,
      title: 'Personal Onboarding Call',
      duration: '30 minutes',
      description: 'One-on-one session with our onboarding specialist to understand your needs.',
      included: ['Needs assessment', 'Custom setup plan', 'Timeline discussion', 'Q&A session']
    },
    {
      icon: Video,
      title: 'Live Training Session',
      duration: '45 minutes',
      description: 'Interactive training session covering all features and best practices.',
      included: ['Feature walkthrough', 'Hands-on practice', 'Best practices', 'Team training']
    },
    {
      icon: BookOpen,
      title: 'Documentation & Resources',
      duration: 'Self-paced',
      description: 'Access to comprehensive guides, video tutorials, and knowledge base.',
      included: ['User manuals', 'Video tutorials', 'FAQ database', 'Best practices guide']
    },
    {
      icon: MessageCircle,
      title: 'Ongoing Support',
      duration: '24/7',
      description: 'Continuous support through multiple channels whenever you need help.',
      included: ['24/7 chat support', 'Email assistance', 'Phone support', 'Screen sharing']
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Complete{' '}
            <span className="text-primary-500">Onboarding</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            We don't just give you software - we ensure you're completely comfortable 
            and confident using ShelfCure from day one.
          </p>
        </div>

        {/* Onboarding Steps */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {onboardingSteps.map((step, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-large hover:bg-white transition-all duration-300 hover:-translate-y-2 group"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-300">
                  <step.icon className="w-7 h-7 text-primary-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900 mb-1 group-hover:text-primary-600 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-secondary-500">
                    <Clock className="w-4 h-4" />
                    <span>{step.duration}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-secondary-600 leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Included Items */}
              <div>
                <h4 className="font-semibold text-secondary-900 mb-3">What's Included:</h4>
                <ul className="space-y-2">
                  {step.included.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-3 text-sm text-secondary-600">
                      <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Onboarding Timeline */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Your Onboarding Timeline
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Here's what you can expect during your first week with ShelfCure.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Day 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                Day 1
              </div>
              <h4 className="font-bold text-secondary-900 mb-2">Account Setup</h4>
              <p className="text-secondary-600 text-sm">Account creation, profile setup, and initial configuration</p>
            </div>

            {/* Day 2-3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-sm">
                Day 2-3
              </div>
              <h4 className="font-bold text-secondary-900 mb-2">Data Migration</h4>
              <p className="text-secondary-600 text-sm">Import existing data and configure system settings</p>
            </div>

            {/* Day 4-5 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-sm">
                Day 4-5
              </div>
              <h4 className="font-bold text-secondary-900 mb-2">Training & Testing</h4>
              <p className="text-secondary-600 text-sm">Team training sessions and system testing</p>
            </div>

            {/* Day 6-7 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-sm">
                Day 6-7
              </div>
              <h4 className="font-bold text-secondary-900 mb-2">Go Live</h4>
              <p className="text-secondary-600 text-sm">Start using ShelfCure for daily operations</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnboardingSection;
