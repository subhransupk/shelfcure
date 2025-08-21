import React from 'react';
import { ArrowRight, MapPin, Clock, Users, Briefcase } from 'lucide-react';

const JoinUsSection = () => {
  const openPositions = [
    {
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Mumbai / Remote',
      type: 'Full-time',
      description: 'Join our engineering team to build scalable healthcare solutions using MERN stack.'
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Mumbai / Remote',
      type: 'Full-time',
      description: 'Lead product strategy and roadmap for our pharmacy management platform.'
    },
    {
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Mumbai / Remote',
      type: 'Full-time',
      description: 'Design intuitive user experiences for healthcare professionals and patients.'
    },
    {
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Mumbai / Remote',
      type: 'Full-time',
      description: 'Build and maintain our cloud infrastructure and deployment pipelines.'
    }
  ];

  const benefits = [
    {
      icon: MapPin,
      title: 'Flexible Location',
      description: 'Work from our Mumbai office or remotely from anywhere in India.'
    },
    {
      icon: Clock,
      title: 'Flexible Hours',
      description: 'Choose your working hours that fit your lifestyle and productivity.'
    },
    {
      icon: Users,
      title: 'Great Team',
      description: 'Work with passionate, talented individuals who care about making an impact.'
    },
    {
      icon: Briefcase,
      title: 'Growth Opportunities',
      description: 'Advance your career with mentorship, training, and leadership opportunities.'
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Join{' '}
            <span className="text-primary-500">Our Team</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Be part of a mission-driven team that's transforming healthcare technology. 
            We're always looking for talented individuals who share our passion.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 text-center shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">
                {benefit.title}
              </h3>
              <p className="text-secondary-600 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Open Positions */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Open Positions
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Explore our current job openings and find the perfect role to advance your career.
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-2xl p-6 hover:border-primary-200 hover:shadow-medium transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Position Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                        {position.title}
                      </h4>
                      <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                        {position.department}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {position.type}
                      </div>
                    </div>
                    
                    <p className="text-secondary-600 leading-relaxed">
                      {position.description}
                    </p>
                  </div>

                  {/* Apply Button */}
                  <div className="lg:ml-6">
                    <button className="btn-primary group-hover:bg-primary-600 transition-colors duration-300">
                      Apply Now
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Perfect Match */}
          <div className="text-center mt-12 p-8 bg-gray-50 rounded-2xl">
            <h4 className="text-xl font-bold text-secondary-900 mb-3">
              Don't See a Perfect Match?
            </h4>
            <p className="text-secondary-600 mb-6">
              We're always interested in connecting with talented individuals. 
              Send us your resume and let us know how you'd like to contribute.
            </p>
            <button className="btn-secondary">
              Send Your Resume
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4">
            Ready to Make an Impact?
          </h3>
          <p className="text-primary-100 max-w-2xl mx-auto mb-6">
            Join us in our mission to transform healthcare technology and make a meaningful 
            difference in the lives of patients and healthcare providers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary-600 hover:bg-primary-50 font-bold px-8 py-4 rounded-xl transition-colors duration-200">
              View All Positions
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold px-8 py-4 rounded-xl transition-all duration-200">
              Learn About Our Culture
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinUsSection;
