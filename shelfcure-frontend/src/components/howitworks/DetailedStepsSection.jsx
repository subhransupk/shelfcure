import React, { useState } from 'react';
import { ChevronRight, Check, Play, Download, Upload, Settings, BarChart, Users } from 'lucide-react';

const DetailedStepsSection = () => {
  const [activeStep, setActiveStep] = useState(0);

  const detailedSteps = [
    {
      id: 0,
      title: 'Account Creation & Setup',
      duration: '2-3 minutes',
      icon: Users,
      image: '/images/web-images/f1.png',
      description: 'Get started with ShelfCure by creating your account and setting up your pharmacy profile.',
      substeps: [
        { title: 'Create Account', description: 'Sign up with your email and create a secure password', completed: true },
        { title: 'Verify Email', description: 'Confirm your email address to activate your account', completed: true },
        { title: 'Pharmacy Profile', description: 'Add your pharmacy details, location, and license information', completed: true },
        { title: 'Team Setup', description: 'Invite team members and assign roles and permissions', completed: false }
      ]
    },
    {
      id: 1,
      title: 'System Configuration',
      duration: '5-10 minutes',
      icon: Settings,
      image: '/images/web-images/f2.png',
      description: 'Customize ShelfCure to match your pharmacy\'s specific needs and workflows.',
      substeps: [
        { title: 'Import Inventory', description: 'Upload your existing medicine inventory via CSV or manual entry', completed: false },
        { title: 'Payment Methods', description: 'Configure accepted payment methods and billing preferences', completed: false },
        { title: 'Tax Settings', description: 'Set up tax rates and compliance requirements for your location', completed: false },
        { title: 'Workflow Customization', description: 'Adjust workflows to match your pharmacy operations', completed: false }
      ]
    },
    {
      id: 2,
      title: 'Data Migration & Testing',
      duration: '10-15 minutes',
      icon: Upload,
      image: '/images/web-images/f3.png',
      description: 'Import your existing data and test the system to ensure everything works perfectly.',
      substeps: [
        { title: 'Data Import', description: 'Import customer data, supplier information, and transaction history', completed: false },
        { title: 'System Testing', description: 'Process test transactions and verify all features work correctly', completed: false },
        { title: 'Staff Training', description: 'Train your team on using the new system effectively', completed: false },
        { title: 'Go Live', description: 'Switch to ShelfCure for your daily pharmacy operations', completed: false }
      ]
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Detailed{' '}
            <span className="text-primary-500">Implementation</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Dive deeper into each step of the ShelfCure implementation process. 
            See exactly what happens at each stage.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left Column - Step Navigation */}
          <div className="space-y-4">
            {detailedSteps.map((step, index) => (
              <div
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-primary-500 text-white shadow-large'
                    : 'bg-white hover:bg-primary-50 hover:shadow-medium'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeStep === index ? 'bg-white/20' : 'bg-primary-100'
                  }`}>
                    <step.icon className={`w-6 h-6 ${
                      activeStep === index ? 'text-white' : 'text-primary-500'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-bold ${
                        activeStep === index ? 'text-white' : 'text-secondary-900'
                      }`}>
                        {step.title}
                      </h3>
                      <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                        activeStep === index ? 'rotate-90 text-white' : 'text-secondary-400'
                      }`} />
                    </div>
                    <p className={`text-sm ${
                      activeStep === index ? 'text-primary-100' : 'text-secondary-600'
                    }`}>
                      Duration: {step.duration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Step Details */}
          <div className="bg-white rounded-3xl p-8 shadow-soft">
            <div className="space-y-6">
              {/* Step Image */}
              <div className="relative">
                <img 
                  src={detailedSteps[activeStep].image} 
                  alt={detailedSteps[activeStep].title}
                  className="w-full h-64 object-cover rounded-2xl"
                />
                <div className="absolute top-4 right-4 bg-primary-500 text-white p-2 rounded-lg">
                  <Play className="w-5 h-5" />
                </div>
              </div>

              {/* Step Info */}
              <div>
                <h3 className="text-2xl font-bold text-secondary-900 mb-3">
                  {detailedSteps[activeStep].title}
                </h3>
                <p className="text-secondary-600 leading-relaxed mb-6">
                  {detailedSteps[activeStep].description}
                </p>
              </div>

              {/* Substeps */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-secondary-900">
                  What You'll Do:
                </h4>
                {detailedSteps[activeStep].substeps.map((substep, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      substep.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-secondary-900 mb-1">
                        {substep.title}
                      </h5>
                      <p className="text-sm text-secondary-600">
                        {substep.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-gray-100">
                <button className="btn-primary w-full justify-center">
                  <Download className="w-5 h-5" />
                  Download Step Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DetailedStepsSection;
