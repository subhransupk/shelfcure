import React from 'react';
import { CheckCircle, Users } from 'lucide-react';

const RegisterBenefitsSection = () => {

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Registration Steps */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Simple Registration Process
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Get started with ShelfCure in just a few simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h4 className="font-bold text-secondary-900 mb-2">Personal Details</h4>
              <p className="text-secondary-600 text-sm">Enter your basic information and create secure credentials</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h4 className="font-bold text-secondary-900 mb-2">Business Details</h4>
              <p className="text-secondary-600 text-sm">Add your store information and business details</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h4 className="font-bold text-secondary-900 mb-2">Account Created</h4>
              <p className="text-secondary-600 text-sm">Your account is ready and 30-day trial begins</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h4 className="font-bold text-secondary-900 mb-2">Onboarding</h4>
              <p className="text-secondary-600 text-sm">Get personalized setup assistance from our team</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-2xl">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Transform Your Pharmacy?
            </h3>
            <p className="text-primary-100 mb-6 leading-relaxed">
              Join the growing community of successful pharmacy owners using ShelfCure. 
              Start your free trial today and see the difference modern technology can make.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 hover:bg-primary-50 font-bold px-8 py-4 rounded-xl transition-colors duration-200">
                Start Registration
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold px-8 py-4 rounded-xl transition-all duration-200">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterBenefitsSection;
