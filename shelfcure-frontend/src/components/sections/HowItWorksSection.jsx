import React from 'react';
import { UserPlus, Settings, TrendingUp } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Sign Up & Setup',
      description: 'Create your account in minutes and set up your pharmacy profile with our guided onboarding process.',
      details: [
        'Quick 5-minute registration',
        'Pharmacy profile setup',
        'Team member invitations',
        'Initial configuration'
      ]
    },
    {
      number: 2,
      icon: Settings,
      title: 'Configure & Customize',
      description: 'Customize the system to match your pharmacy needs, import your inventory, and configure your preferences.',
      details: [
        'Import existing inventory',
        'Set up payment methods',
        'Configure tax settings',
        'Customize workflows'
      ]
    },
    {
      number: 3,
      icon: TrendingUp,
      title: 'Start Growing',
      description: 'Begin using all features to streamline operations, increase efficiency, and grow your pharmacy business.',
      details: [
        'Process sales & billing',
        'Track inventory in real-time',
        'Generate analytics reports',
        'Scale your operations'
      ]
    }
  ];

  return (
    <section id="how-it-works" className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Get Started in{' '}
            <span className="text-primary-500">3 Simple Steps</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Our streamlined onboarding process gets you up and running quickly, 
            so you can start benefiting from ShelfCure immediately.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200"></div>
          
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Mobile Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-primary-400 to-primary-200"></div>
                )}
                
                <div className="text-center lg:text-center">
                  {/* Step Number Circle */}
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-primary-500 text-white rounded-full text-xl font-bold mb-6 shadow-lg">
                    {step.number}
                    {/* Pulse Animation */}
                    <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20"></div>
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <step.icon className="w-6 h-6 text-primary-500" />
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-secondary-900">
                      {step.title}
                    </h3>
                    <p className="text-secondary-600 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Details List */}
                    <ul className="text-left space-y-2 bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center gap-3 text-sm text-secondary-600">
                          <div className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0"></div>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 bg-white p-8 rounded-2xl shadow-soft border border-gray-100">
          <h3 className="text-2xl font-bold text-secondary-900 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-secondary-600 mb-6">
            Join hundreds of pharmacies already using ShelfCure to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary text-lg px-8 py-4">
              Start Free Trial
            </button>
            <button className="btn-secondary text-lg px-8 py-4">
              Schedule Demo
            </button>
          </div>
          <p className="text-sm text-secondary-500 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
