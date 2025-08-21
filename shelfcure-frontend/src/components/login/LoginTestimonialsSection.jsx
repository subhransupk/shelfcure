import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const LoginTestimonialsSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Owner, Kumar Medical Store',
      location: 'Mumbai, Maharashtra',
      image: '/api/placeholder/80/80',
      rating: 5,
      quote: 'ShelfCure has completely transformed how we manage our pharmacy. The login process is seamless, and having access to real-time data from anywhere has been a game-changer for our business.',
      highlight: 'Increased efficiency by 40%'
    },
    {
      name: 'Priya Sharma',
      role: 'Manager, HealthPlus Pharmacy',
      location: 'Delhi, India',
      image: '/api/placeholder/80/80',
      rating: 5,
      quote: 'The security features give us complete peace of mind. We can manage multiple locations with different user permissions, and the system is incredibly reliable.',
      highlight: 'Managing 5 locations seamlessly'
    },
    {
      name: 'Dr. Amit Patel',
      role: 'Founder, Wellness Pharmacy Chain',
      location: 'Ahmedabad, Gujarat',
      image: '/api/placeholder/80/80',
      rating: 5,
      quote: 'What impressed me most is how easy it is to get started. The login system is intuitive, and our staff adapted to the platform within days. Customer service is exceptional.',
      highlight: 'Staff training completed in 2 days'
    }
  ];

  // Auto-advance testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Trusted by{' '}
            <span className="text-primary-500">Pharmacy Owners</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            See what pharmacy owners are saying about their experience with ShelfCure.
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            {/* Background Quote Icon */}
            <div className="absolute top-8 right-8 opacity-10">
              <Quote className="w-24 h-24 text-primary-500" />
            </div>

            {/* Testimonial Content */}
            <div className="relative z-10">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                {/* User Info */}
                <div className="text-center md:text-left">
                  <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto md:mx-0 mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-1">
                    {testimonials[currentTestimonial].name}
                  </h3>
                  <p className="text-primary-600 font-medium mb-1">
                    {testimonials[currentTestimonial].role}
                  </p>
                  <p className="text-secondary-500 text-sm mb-4">
                    {testimonials[currentTestimonial].location}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex justify-center md:justify-start gap-1 mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Highlight */}
                  <div className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                    {testimonials[currentTestimonial].highlight}
                  </div>
                </div>

                {/* Quote */}
                <div className="md:col-span-2">
                  <blockquote className="text-lg md:text-xl text-secondary-700 leading-relaxed italic mb-6">
                    "{testimonials[currentTestimonial].quote}"
                  </blockquote>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-large flex items-center justify-center text-secondary-600 hover:text-primary-500 hover:shadow-xl transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-large flex items-center justify-center text-secondary-600 hover:text-primary-500 hover:shadow-xl transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentTestimonial
                    ? 'bg-primary-500 w-8'
                    : 'bg-secondary-300 hover:bg-secondary-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">500+</div>
            <div className="text-secondary-600">Happy Pharmacies</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">4.9/5</div>
            <div className="text-secondary-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">99.9%</div>
            <div className="text-secondary-600">Uptime Guarantee</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginTestimonialsSection;
