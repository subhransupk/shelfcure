import React from 'react';
import { UserPlus, Settings, TrendingUp, ArrowRight } from 'lucide-react';

const ProcessOverviewSection = () => {
  const processSteps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Sign Up & Setup',
      description: 'Create your account and set up your pharmacy profile in just 5 minutes.',
      features: ['Quick registration', 'Pharmacy profile setup', 'Team invitations', 'Basic configuration'],
      color: 'from-primary-400 to-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      number: 2,
      icon: Settings,
      title: 'Configure & Import',
      description: 'Customize the system to match your needs and import your existing data.',
      features: ['Import inventory', 'Set up payment methods', 'Configure tax settings', 'Customize workflows'],
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      number: 3,
      icon: TrendingUp,
      title: 'Operate & Grow',
      description: 'Start using all features to streamline operations and grow your business.',
      features: ['Process sales', 'Track inventory', 'Generate reports', 'Scale operations'],
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Three Simple{' '}
            <span className="text-primary-500">Steps</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Our streamlined process gets you from signup to full operation in no time. 
            Each step is designed to be intuitive and efficient.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-green-200"></div>
          
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {processSteps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Mobile Connecting Line */}
                {index < processSteps.length - 1 && (
                  <div className="lg:hidden absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-primary-400 to-primary-200"></div>
                )}
                
                <div className={`${step.bgColor} rounded-3xl p-8 hover:shadow-large transition-all duration-300 group-hover:-translate-y-2`}>
                  {/* Step Number Circle */}
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-white rounded-full text-xl font-bold mb-6 shadow-lg">
                    <span className={`bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                      {step.number}
                    </span>
                    {/* Pulse Animation */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-full animate-ping opacity-20`}></div>
                  </div>

                  {/* Icon */}
                  <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-secondary-600 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2">
                      {step.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3 text-sm text-secondary-600">
                          <div className={`w-2 h-2 bg-gradient-to-r ${step.color} rounded-full flex-shrink-0`}></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Estimate */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">5 Minutes</div>
              <div className="text-secondary-600">Average Setup Time</div>
            </div>
            
            <ArrowRight className="w-6 h-6 text-secondary-400 rotate-90 md:rotate-0" />
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">24 Hours</div>
              <div className="text-secondary-600">Full Implementation</div>
            </div>
            
            <ArrowRight className="w-6 h-6 text-secondary-400 rotate-90 md:rotate-0" />
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">Ongoing</div>
              <div className="text-secondary-600">Growth & Support</div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-bold text-secondary-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-secondary-600 mb-6 max-w-2xl mx-auto">
              Join hundreds of pharmacies that have already streamlined their operations with ShelfCure.
            </p>
            <div className="flex justify-center">
              <button className="btn-primary text-lg px-8 py-4">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessOverviewSection;
