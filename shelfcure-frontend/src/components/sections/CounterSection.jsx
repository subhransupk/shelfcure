import React, { useState, useEffect, useRef } from 'react';

const CounterSection = () => {
  const [counters, setCounters] = useState({
    pharmacies: 0,
    medicines: 0,
    transactions: 0,
    uptime: 0
  });
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);

  const targetValues = React.useMemo(() => ({
    pharmacies: 500,
    medicines: 50000,
    transactions: 1000000,
    uptime: 99
  }), []);

  const animateCounters = React.useCallback(() => {
    const duration = 2000; // 2 seconds
    const steps = 60; // 60 steps for smooth animation
    const stepDuration = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setCounters({
        pharmacies: Math.floor(targetValues.pharmacies * easeOutQuart),
        medicines: Math.floor(targetValues.medicines * easeOutQuart),
        transactions: Math.floor(targetValues.transactions * easeOutQuart),
        uptime: Math.floor(targetValues.uptime * easeOutQuart)
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
    <section ref={sectionRef} className="bg-primary-500 text-white section-padding">
      <div className="container-max">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Happy Pharmacies */}
          <div className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold">
              {formatNumber(counters.pharmacies)}+
            </div>
            <div className="text-primary-100 text-lg font-medium">
              Happy Pharmacies
            </div>
            <div className="text-primary-200 text-sm">
              Trusted by pharmacy owners nationwide
            </div>
          </div>

          {/* Medicines Managed */}
          <div className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold">
              {formatNumber(counters.medicines)}+
            </div>
            <div className="text-primary-100 text-lg font-medium">
              Medicines Managed
            </div>
            <div className="text-primary-200 text-sm">
              Complete inventory tracking
            </div>
          </div>

          {/* Transactions Processed */}
          <div className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold">
              {formatNumber(counters.transactions)}+
            </div>
            <div className="text-primary-100 text-lg font-medium">
              Transactions Processed
            </div>
            <div className="text-primary-200 text-sm">
              Seamless billing operations
            </div>
          </div>

          {/* Uptime */}
          <div className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold">
              {counters.uptime}%
            </div>
            <div className="text-primary-100 text-lg font-medium">
              Uptime
            </div>
            <div className="text-primary-200 text-sm">
              Reliable 24/7 availability
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-1"></div>
      </div>
    </section>
  );
};

export default CounterSection;
