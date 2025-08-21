import React from 'react';
import { Shield, Clock, Users, BarChart, Smartphone, Gift, CheckCircle, Star } from 'lucide-react';

const RegisterBenefitsSection = () => {
  const benefits = [
    {
      icon: Clock,
      title: '30-Day Free Trial',
      description: 'Start with a full-featured free trial. No credit card required.',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with HIPAA compliance and data protection.',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: '24/7 customer support with dedicated onboarding assistance.',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: BarChart,
      title: 'Advanced Analytics',
      description: 'Real-time insights and reports to grow your pharmacy business.',
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Smartphone,
      title: 'Mobile Access',
      description: 'Manage your pharmacy from anywhere with our mobile apps.',
      color: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      icon: Gift,
      title: 'Special Offers',
      description: 'Get exclusive discounts and offers for new store owners.',
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Owner, Kumar Medical Store',
      image: '/api/placeholder/60/60',
      rating: 5,
      quote: 'ShelfCure transformed my pharmacy operations. The registration was simple and I was up and running in minutes!'
    },
    {
      name: 'Priya Sharma',
      role: 'Manager, HealthPlus Pharmacy',
      image: '/api/placeholder/60/60',
      rating: 5,
      quote: 'The two-step registration process was smooth and the onboarding support was excellent.'
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Why Store Owners{' '}
            <span className="text-primary-500">Choose ShelfCure</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Join thousands of successful pharmacy owners who have transformed their business with ShelfCure.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`${benefit.bgColor} rounded-3xl p-8 hover:shadow-large transition-all duration-300 hover:-translate-y-2 group`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-r ${benefit.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-secondary-900 mb-4 group-hover:text-primary-600 transition-colors duration-300">
                {benefit.title}
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Success Stories */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Success Stories
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              See what other store owners are saying about their ShelfCure experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-medium transition-all duration-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-600">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary-900">{testimonial.name}</h4>
                    <p className="text-secondary-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-secondary-700 italic">
                  "{testimonial.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>

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
