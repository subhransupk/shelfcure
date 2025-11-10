import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Calendar, Clock, Users, PlayCircle, ArrowRight } from 'lucide-react';

const WebinarsPage = () => {
  const [selectedWebinar, setSelectedWebinar] = useState(null);

  const upcomingWebinars = [
    {
      id: 1,
      title: 'Mastering Inventory Management',
      date: '2024-02-15',
      time: '3:00 PM IST',
      duration: '60 minutes',
      speaker: 'Rajesh Kumar',
      speakerTitle: 'Pharmacy Operations Expert',
      description: 'Learn advanced inventory management techniques to reduce waste and improve profitability.',
      attendees: 245,
      image: '📊'
    },
    {
      id: 2,
      title: 'Digital Transformation for Pharmacies',
      date: '2024-02-22',
      time: '2:00 PM IST',
      duration: '75 minutes',
      speaker: 'Priya Sharma',
      speakerTitle: 'Digital Strategy Consultant',
      description: 'Explore how to digitize your pharmacy operations and improve customer experience.',
      attendees: 312,
      image: '💻'
    },
    {
      id: 3,
      title: 'Scaling Your Pharmacy Business',
      date: '2024-03-01',
      time: '4:00 PM IST',
      duration: '90 minutes',
      speaker: 'Amit Patel',
      speakerTitle: 'Business Growth Strategist',
      description: 'Strategic insights for expanding your pharmacy operations and entering new markets.',
      attendees: 189,
      image: '📈'
    },
    {
      id: 4,
      title: 'Customer Retention Strategies',
      date: '2024-03-08',
      time: '3:30 PM IST',
      duration: '60 minutes',
      speaker: 'Emma Davis',
      speakerTitle: 'Customer Experience Manager',
      description: 'Build loyalty and increase repeat customers with proven retention strategies.',
      attendees: 267,
      image: '👥'
    }
  ];

  const pastWebinars = [
    {
      id: 5,
      title: 'Getting Started with ShelfCure',
      date: '2024-01-25',
      speaker: 'John Smith',
      views: 1250,
      image: '🚀'
    },
    {
      id: 6,
      title: 'Advanced Analytics for Pharmacies',
      date: '2024-01-18',
      speaker: 'Lisa Anderson',
      views: 892,
      image: '📉'
    },
    {
      id: 7,
      title: 'Compliance and Regulations',
      date: '2024-01-11',
      speaker: 'David Wilson',
      views: 654,
      image: '⚖️'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Webinars & Training</h1>
          <p className="text-xl text-primary-100">Learn from industry experts and maximize your ShelfCure experience</p>
        </div>
      </section>

      {/* Upcoming Webinars */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Upcoming Webinars</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {upcomingWebinars.map((webinar) => (
              <div
                key={webinar.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header Image */}
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 h-40 flex items-center justify-center text-5xl">
                  {webinar.image}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3">{webinar.title}</h3>
                  
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-600" />
                      {new Date(webinar.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary-600" />
                      {webinar.time} • {webinar.duration}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-600" />
                      {webinar.attendees} registered
                    </div>
                  </div>

                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm font-semibold text-gray-900">{webinar.speaker}</p>
                    <p className="text-xs text-gray-600">{webinar.speakerTitle}</p>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{webinar.description}</p>

                  <button className="w-full btn-primary">
                    Register Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Webinars */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Past Webinars</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pastWebinars.map((webinar) => (
              <div
                key={webinar.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {/* Video Thumbnail */}
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 h-40 flex items-center justify-center text-4xl relative overflow-hidden">
                  {webinar.image}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{webinar.title}</h3>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <p className="mb-1">{webinar.speaker}</p>
                    <p className="text-xs">
                      {new Date(webinar.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{webinar.views} views</span>
                    <ArrowRight className="w-4 h-4 text-primary-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-primary-50 to-primary-100 p-12 rounded-lg border border-primary-200">
            <h2 className="text-3xl font-bold mb-4">Never Miss a Webinar</h2>
            <p className="text-gray-700 mb-8">
              Subscribe to our newsletter to get notifications about upcoming webinars and training sessions.
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <button className="btn-primary">Subscribe</button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WebinarsPage;

