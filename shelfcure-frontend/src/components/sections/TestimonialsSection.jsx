import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, MapPin, Store } from 'lucide-react';

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
      quote: 'ShelfCure has completely transformed how we manage our pharmacy. The AI-powered Bill OCR feature saves us hours every day, and the dual unit inventory system is incredibly accurate. Our revenue increased by 30% in just 3 months!',
      image: '/api/placeholder/60/60',
      role: 'Store Owner',
      stores: 2,
      highlight: 'AI Bill OCR'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      pharmacy: 'HealthCare Plus',
      location: 'Delhi, NCR',
      rating: 5,
      quote: 'The multi-store support is fantastic! I can manage all five of my pharmacy locations from one dashboard. The analytics help me make data-driven decisions, and the WhatsApp integration keeps customers happy.',
      image: '/api/placeholder/60/60',
      role: 'Store Owner',
      stores: 5,
      highlight: 'Multi-Store Management'
    },
    {
      id: 3,
      name: 'Mohammed Ali',
      pharmacy: 'City Pharmacy',
      location: 'Bangalore, Karnataka',
      rating: 5,
      quote: 'The AI Store Assistant is like having a tech-savvy manager 24/7. I can ask it anything in plain English and it handles everything - from inventory checks to sales reports. Customer support is exceptional too!',
      image: '/api/placeholder/60/60',
      role: 'Store Manager',
      stores: 1,
      highlight: 'AI Store Assistant'
    },
    {
      id: 4,
      name: 'Dr. Sunita Patel',
      pharmacy: 'Wellness Pharmacy',
      location: 'Ahmedabad, Gujarat',
      rating: 5,
      quote: 'The prescription OCR and automated reorder features are game-changers. No more manual data entry errors, and we never run out of essential medicines. The ROI was visible within the first month.',
      image: '/api/placeholder/60/60',
      role: 'Store Owner',
      stores: 3,
      highlight: 'Prescription OCR'
    },
    {
      id: 5,
      name: 'Arjun Reddy',
      pharmacy: 'MedPlus Corner',
      location: 'Hyderabad, Telangana',
      rating: 5,
      quote: 'Implementation was smooth, training was comprehensive, and the mobile app is perfect for on-the-go management. The affiliate program also helps us earn extra income. Highly recommend ShelfCure!',
      image: '/api/placeholder/60/60',
      role: 'Store Manager & Affiliate',
      stores: 1,
      highlight: 'Mobile App & Affiliate Program'
    },
    {
      id: 6,
      name: 'Kavita Joshi',
      pharmacy: 'Joshi Medicals',
      location: 'Pune, Maharashtra',
      rating: 5,
      quote: 'The rack management system and expiry alerts have eliminated medicine wastage completely. The system is so intuitive that even our non-tech staff use it confidently. Best investment for our pharmacy!',
      image: '/api/placeholder/60/60',
      role: 'Store Owner',
      stores: 2,
      highlight: 'Rack Management'
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
    <section className="section-padding bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-max relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Loved by{' '}
            <span className="text-primary-500">Pharmacy Professionals</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Join thousands of satisfied pharmacy owners and managers who have transformed
            their operations with ShelfCure's AI-powered platform.
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Testimonial */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="bg-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-large border border-gray-100"
            >
              {/* Background Gradient */}
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-50 to-transparent opacity-50" />

              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-16 h-16 text-primary-200" />

              <div className="relative z-10">
                {/* Highlight Badge */}
                <div className="flex justify-center mb-6">
                  <div className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                    ⭐ {testimonials[currentSlide].highlight}
                  </div>
                </div>

                {/* Stars */}
                <div className="flex justify-center mb-6">
                  {renderStars(testimonials[currentSlide].rating)}
                </div>

                {/* Quote */}
                <blockquote className="text-lg md:text-xl text-secondary-700 text-center leading-relaxed mb-8 font-medium max-w-4xl mx-auto">
                  "{testimonials[currentSlide].quote}"
                </blockquote>

                {/* Customer Info */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  {/* Avatar */}
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">
                      {testimonials[currentSlide].name.charAt(0)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="text-center md:text-left">
                    <div className="font-bold text-xl text-secondary-900 mb-1">
                      {testimonials[currentSlide].name}
                    </div>
                    <div className="text-primary-600 font-medium mb-1">
                      {testimonials[currentSlide].pharmacy}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-secondary-500 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {testimonials[currentSlide].location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Store className="w-4 h-4" />
                        {testimonials[currentSlide].stores} Store{testimonials[currentSlide].stores > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-primary-500 text-sm font-medium mt-1">
                      {testimonials[currentSlide].role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <motion.button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white shadow-large rounded-full flex items-center justify-center hover:bg-primary-50 transition-all duration-200 hover:scale-110"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6 text-secondary-600" />
          </motion.button>
          <motion.button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white shadow-large rounded-full flex items-center justify-center hover:bg-primary-50 transition-all duration-200 hover:scale-110"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-6 h-6 text-secondary-600" />
          </motion.button>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-primary-500 w-8'
                    : 'bg-gray-300 hover:bg-primary-300 w-3'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-white rounded-2xl p-8 shadow-soft border border-gray-100 max-w-2xl mx-auto">
            <p className="text-secondary-600 mb-6 text-lg">
              Trusted by <span className="font-bold text-primary-600">500+</span> pharmacies across India
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-primary-600">4.9/5</div>
                <div className="flex">
                  {renderStars(5)}
                </div>
              </div>
              <div className="text-secondary-500">Based on 200+ verified reviews</div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">98%</div>
                <div className="text-secondary-500 text-sm">Customer Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">30%</div>
                <div className="text-secondary-500 text-sm">Average Revenue Increase</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">24/7</div>
                <div className="text-secondary-500 text-sm">Support Available</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
