import React from 'react';
import { MapPin, Clock, Phone, Mail, Car, Train, Plane } from 'lucide-react';

const OfficeLocationSection = () => {
  const officeDetails = {
    name: 'ShelfCure Technologies Pvt. Ltd.',
    address: 'Business District, Bandra Kurla Complex',
    city: 'Mumbai, Maharashtra 400051',
    country: 'India',
    phone: '+91 12345 67890',
    email: 'office@shelfcure.com',
    hours: {
      weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM',
      weekend: 'Saturday: 10:00 AM - 2:00 PM',
      closed: 'Sunday: Closed'
    }
  };

  const directions = [
    {
      icon: Car,
      method: 'By Car',
      description: 'Parking available in the building basement',
      details: 'Take the Western Express Highway to BKC exit'
    },
    {
      icon: Train,
      method: 'By Train',
      description: 'Kurla station is the nearest railway station',
      details: '10 minutes walk from Kurla station'
    },
    {
      icon: Plane,
      method: 'By Air',
      description: 'Mumbai Airport is 8 km away',
      details: '20-30 minutes by taxi depending on traffic'
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Visit Our{' '}
            <span className="text-primary-500">Office</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            We'd love to meet you in person! Visit our Mumbai office for demos, 
            consultations, or just to say hello to the ShelfCure team.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Office Information */}
          <div className="space-y-8">
            {/* Address Card */}
            <div className="bg-white rounded-2xl p-8 shadow-soft">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-2">
                    Office Address
                  </h3>
                  <div className="space-y-1 text-secondary-600">
                    <p className="font-semibold">{officeDetails.name}</p>
                    <p>{officeDetails.address}</p>
                    <p>{officeDetails.city}</p>
                    <p>{officeDetails.country}</p>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary-500" />
                  <span className="text-secondary-700">{officeDetails.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-500" />
                  <span className="text-secondary-700">{officeDetails.email}</span>
                </div>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-white rounded-2xl p-8 shadow-soft">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-4">
                    Office Hours
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-secondary-700">Weekdays</span>
                      <span className="font-medium text-secondary-900">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-secondary-700">Saturday</span>
                      <span className="font-medium text-secondary-900">10:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-secondary-700">Sunday</span>
                      <span className="font-medium text-red-600">Closed</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-primary-700 text-sm">
                  💡 <strong>Pro Tip:</strong> Schedule an appointment in advance to ensure 
                  someone from our team is available to meet with you.
                </p>
              </div>
            </div>

            {/* Directions */}
            <div className="bg-white rounded-2xl p-8 shadow-soft">
              <h3 className="text-xl font-bold text-secondary-900 mb-6">
                How to Reach Us
              </h3>
              <div className="space-y-4">
                {directions.map((direction, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <direction.icon className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-secondary-900 mb-1">
                        {direction.method}
                      </h4>
                      <p className="text-secondary-600 text-sm mb-1">
                        {direction.description}
                      </p>
                      <p className="text-secondary-500 text-xs">
                        {direction.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="space-y-8">
            {/* Interactive Map */}
            <div className="bg-white rounded-2xl p-8 shadow-soft">
              <h3 className="text-xl font-bold text-secondary-900 mb-6">
                Find Us on Map
              </h3>
              
              {/* Map Placeholder */}
              <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center mb-6">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Interactive Map</p>
                  <p className="text-gray-400 text-sm">Click to open in Google Maps</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="btn-primary flex-1 justify-center">
                  Open in Google Maps
                </button>
                <button className="btn-secondary flex-1 justify-center">
                  Get Directions
                </button>
              </div>
            </div>

            {/* Schedule Visit */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4">
                Schedule Your Visit
              </h3>
              <p className="text-primary-100 mb-6">
                Planning to visit our office? Schedule an appointment to ensure 
                we can give you our full attention and provide the best experience.
              </p>
              <div className="space-y-4">
                <button className="bg-white text-primary-600 hover:bg-primary-50 font-medium px-6 py-3 rounded-lg transition-colors duration-200 w-full">
                  Schedule Appointment
                </button>
                <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium px-6 py-3 rounded-lg transition-all duration-200 w-full">
                  Request Office Tour
                </button>
              </div>
            </div>

            {/* Nearby Amenities */}
            <div className="bg-white rounded-2xl p-8 shadow-soft">
              <h3 className="text-xl font-bold text-secondary-900 mb-6">
                Nearby Amenities
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <span className="text-secondary-600">Restaurants & Cafes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <span className="text-secondary-600">Shopping Mall</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <span className="text-secondary-600">ATM & Banks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <span className="text-secondary-600">Metro Station</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfficeLocationSection;
