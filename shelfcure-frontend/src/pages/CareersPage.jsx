import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Briefcase, Users, Zap, Heart, MapPin, DollarSign } from 'lucide-react';

const CareersPage = () => {
  const benefits = [
    { icon: Heart, title: 'Health Insurance', description: 'Comprehensive health coverage for you and your family' },
    { icon: Zap, title: 'Professional Growth', description: 'Continuous learning and career development opportunities' },
    { icon: Users, title: 'Great Team', description: 'Work with talented and passionate professionals' },
    { icon: DollarSign, title: 'Competitive Salary', description: 'Industry-competitive compensation packages' }
  ];

  const openPositions = [
    {
      title: 'Full Stack Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build scalable web applications using MERN stack'
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Bangalore',
      type: 'Full-time',
      description: 'Lead product strategy and roadmap for ShelfCure'
    },
    {
      title: 'Customer Success Manager',
      department: 'Sales & Support',
      location: 'Remote',
      type: 'Full-time',
      description: 'Help customers succeed with ShelfCure platform'
    },
    {
      title: 'UI/UX Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Design beautiful and intuitive user interfaces'
    },
    {
      title: 'DevOps Engineer',
      department: 'Infrastructure',
      location: 'Bangalore',
      type: 'Full-time',
      description: 'Manage and optimize our cloud infrastructure'
    },
    {
      title: 'Business Development Executive',
      department: 'Business',
      location: 'Remote',
      type: 'Full-time',
      description: 'Identify and pursue new business opportunities'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-primary-100">Help us revolutionize pharmacy management</p>
        </div>
      </section>

      {/* About Working at ShelfCure */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Join ShelfCure?</h2>
            <p className="text-gray-600 text-lg">
              We're on a mission to transform pharmacy management with innovative technology. 
              Join us and make a real impact on the healthcare industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-lg border border-gray-200 text-center hover:shadow-lg transition-shadow">
                  <Icon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Open Positions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                    <p className="text-gray-600 text-sm">{position.department}</p>
                  </div>
                  <Briefcase className="w-6 h-6 text-primary-600 flex-shrink-0" />
                </div>
                
                <p className="text-gray-700 mb-4">{position.description}</p>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    <MapPin className="w-4 h-4" />
                    {position.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {position.type}
                  </span>
                </div>
                
                <button className="w-full btn-primary text-center">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Don't see a position that fits?</h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals. Send us your resume and let's talk about how you can contribute to ShelfCure.
          </p>
          <a href="mailto:careers@shelfcure.com" className="btn-secondary">
            Send Your Resume
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;

