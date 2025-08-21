import React from 'react';
import { Linkedin, Twitter, Mail } from 'lucide-react';

const TeamSection = () => {
  const teamMembers = [
    {
      name: 'Rajesh Kumar',
      role: 'CEO & Co-Founder',
      bio: 'Healthcare technology veteran with 10+ years of experience in digital transformation.',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        twitter: '#',
        email: 'rajesh@shelfcure.com'
      }
    },
    {
      name: 'Priya Sharma',
      role: 'CTO & Co-Founder',
      bio: 'Full-stack developer and AI specialist passionate about solving healthcare challenges.',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        twitter: '#',
        email: 'priya@shelfcure.com'
      }
    },
    {
      name: 'Dr. Amit Patel',
      role: 'Head of Product',
      bio: 'Pharmacist turned product manager, bridging the gap between technology and healthcare.',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        twitter: '#',
        email: 'amit@shelfcure.com'
      }
    },
    {
      name: 'Sneha Reddy',
      role: 'Head of Design',
      bio: 'UX/UI designer focused on creating intuitive experiences for healthcare professionals.',
      image: '/api/placeholder/300/300',
      social: {
        linkedin: '#',
        twitter: '#',
        email: 'sneha@shelfcure.com'
      }
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Meet Our{' '}
            <span className="text-primary-500">Team</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            The passionate individuals behind ShelfCure, working together to transform healthcare technology.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-2 group"
            >
              {/* Profile Image */}
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-primary-100 rounded-full mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                {/* Social Links Overlay */}
                <div className="absolute inset-0 bg-primary-500/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex gap-2">
                    <a
                      href={member.social.linkedin}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-primary-50 transition-colors duration-200"
                    >
                      <Linkedin className="w-4 h-4 text-primary-500" />
                    </a>
                    <a
                      href={member.social.twitter}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-primary-50 transition-colors duration-200"
                    >
                      <Twitter className="w-4 h-4 text-primary-500" />
                    </a>
                    <a
                      href={`mailto:${member.social.email}`}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-primary-50 transition-colors duration-200"
                    >
                      <Mail className="w-4 h-4 text-primary-500" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Member Info */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-secondary-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-primary-600 font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-secondary-600 text-sm leading-relaxed">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Team Culture */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-6">
                Why Our Team Loves Working at ShelfCure
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">
                      Meaningful Impact
                    </h4>
                    <p className="text-secondary-600 text-sm">
                      Every line of code we write directly improves healthcare delivery and patient outcomes.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">
                      Growth Opportunities
                    </h4>
                    <p className="text-secondary-600 text-sm">
                      We invest in our team's professional development and provide clear career progression paths.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">
                      Collaborative Culture
                    </h4>
                    <p className="text-secondary-600 text-sm">
                      We foster an environment where everyone's ideas are valued and innovation thrives.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative">
              <img 
                src="/images/web-images/hero3.png" 
                alt="Team Culture" 
                className="w-full h-auto rounded-2xl shadow-large"
              />
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-primary-500 text-white p-4 rounded-2xl shadow-lg">
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm text-primary-100">Team Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
