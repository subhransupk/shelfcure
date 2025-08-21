import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: 'Dr. Rajesh Kumar',
      pharmacy: 'Kumar Medical Store',
      location: 'Mumbai, Maharashtra',
      rating: 5,
      quote: 'ShelfCure has completely transformed how we manage our pharmacy. The AI-powered Bill OCR feature saves us hours every day, and the inventory management is incredibly accurate.',
      image: '/api/placeholder/60/60'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      pharmacy: 'HealthCare Plus',
      location: 'Delhi, NCR',
      rating: 5,
      quote: 'The multi-store support is fantastic! I can manage all three of my pharmacy locations from one dashboard. The analytics help me make better business decisions.',
      image: '/api/placeholder/60/60'
    },
    {
      id: 3,
      name: 'Mohammed Ali',
      pharmacy: 'City Pharmacy',
      location: 'Bangalore, Karnataka',
      rating: 5,
      quote: 'Customer support is exceptional, and the mobile app allows me to check inventory and sales even when I\'m not at the store. Highly recommend ShelfCure!',
      image: '/api/placeholder/60/60'
    },
    {
      id: 4,
      name: 'Dr. Sunita Patel',
      pharmacy: 'Wellness Pharmacy',
      location: 'Ahmedabad, Gujarat',
      rating: 5,
      quote: 'The doctor commission tracking feature is exactly what we needed. It\'s automated, accurate, and saves us from manual calculations. Great ROI on our investment.',
      image: '/api/placeholder/60/60'
    },
    {
      id: 5,
      name: 'Arjun Reddy',
      pharmacy: 'MedPlus Corner',
      location: 'Hyderabad, Telangana',
      rating: 5,
      quote: 'Implementation was smooth, and the training provided was comprehensive. Our staff adapted quickly, and we saw immediate improvements in efficiency.',
      image: '/api/placeholder/60/60'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            What Our{' '}
            <span className="text-primary-500">Customers Say</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Don't just take our word for it. Here's what pharmacy owners across India 
            are saying about their experience with ShelfCure.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial */}
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <Quote className="absolute top-6 right-6 w-12 h-12 text-primary-200" />
            
            <div className="relative z-10">
              {/* Stars */}
              <div className="flex justify-center mb-6">
                {renderStars(testimonials[currentSlide].rating)}
              </div>

              {/* Quote */}
              <blockquote className="text-lg md:text-xl text-secondary-700 text-center leading-relaxed mb-8 font-medium">
                "{testimonials[currentSlide].quote}"
              </blockquote>

              {/* Customer Info */}
              <div className="flex items-center justify-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-lg">
                    {testimonials[currentSlide].name.charAt(0)}
                  </span>
                </div>
                
                {/* Details */}
                <div className="text-center">
                  <div className="font-bold text-secondary-900">
                    {testimonials[currentSlide].name}
                  </div>
                  <div className="text-primary-600 font-medium">
                    {testimonials[currentSlide].pharmacy}
                  </div>
                  <div className="text-secondary-500 text-sm">
                    {testimonials[currentSlide].location}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-medium rounded-full flex items-center justify-center hover:bg-primary-50 transition-colors duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-secondary-600" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-medium rounded-full flex items-center justify-center hover:bg-primary-50 transition-colors duration-200"
          >
            <ChevronRight className="w-6 h-6 text-secondary-600" />
          </button>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide
                    ? 'bg-primary-500 w-8'
                    : 'bg-gray-300 hover:bg-primary-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-16">
          <p className="text-secondary-600 mb-4">
            Trusted by 500+ pharmacies across India
          </p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-secondary-400">4.9/5</div>
            <div className="flex">
              {renderStars(5)}
            </div>
            <div className="text-secondary-400">Based on 200+ reviews</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
