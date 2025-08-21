import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Users, Building, Clock } from 'lucide-react';

const StatsSection = () => {
  const [counters, setCounters] = useState({
    pharmacies: 0,
    customers: 0,
    transactions: 0,
    uptime: 0
  });
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);

  const targetValues = React.useMemo(() => ({
    pharmacies: 500,
    customers: 50000,
    transactions: 1000000,
    uptime: 99.9
  }), []);

  const stats = [
    {
      icon: Building,
      key: 'pharmacies',
      label: 'Pharmacies Served',
      suffix: '+',
      color: 'text-primary-500',
      bgColor: 'bg-primary-100'
    },
    {
      icon: Users,
      key: 'customers',
      label: 'Happy Customers',
      suffix: '+',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      icon: TrendingUp,
      key: 'transactions',
      label: 'Transactions Processed',
      suffix: '+',
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    {
      icon: Clock,
      key: 'uptime',
      label: 'Uptime Guarantee',
      suffix: '%',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    }
  ];

  const animateCounters = React.useCallback(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setCounters({
        pharmacies: Math.floor(targetValues.pharmacies * easeOutQuart),
        customers: Math.floor(targetValues.customers * easeOutQuart),
        transactions: Math.floor(targetValues.transactions * easeOutQuart),
        uptime: Math.floor(targetValues.uptime * easeOutQuart * 10) / 10
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounters(targetValues);
      }
    }, stepDuration);
  }, [targetValues]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateCounters();
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, animateCounters]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  return (
    <section ref={sectionRef} className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Our{' '}
            <span className="text-primary-500">Impact</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Numbers that reflect our commitment to transforming healthcare technology.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-large hover:border-primary-200 transition-all duration-300 hover:-translate-y-2"
            >
              {/* Icon */}
              <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>

              {/* Number */}
              <div className="mb-4">
                <span className={`text-4xl md:text-5xl font-bold ${stat.color}`}>
                  {stat.key === 'uptime' ? counters[stat.key] : formatNumber(counters[stat.key])}
                </span>
                <span className={`text-2xl font-bold ${stat.color}`}>
                  {stat.suffix}
                </span>
              </div>

              {/* Label */}
              <p className="text-secondary-600 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16 bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-secondary-900 mb-4">
            Growing Every Day
          </h3>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            These numbers represent real pharmacies, real people, and real impact. 
            Every day, we're helping more healthcare providers deliver better patient care.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
