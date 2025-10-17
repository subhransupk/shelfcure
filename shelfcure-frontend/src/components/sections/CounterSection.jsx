import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Store, Package, CreditCard, Shield, TrendingUp, Users, Clock, Star } from 'lucide-react';

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
    uptime: 99.9
  }), []);

  const stats = [
    {
      key: 'pharmacies',
      icon: Store,
      title: 'Happy Pharmacies',
      subtitle: 'Trusted by pharmacy owners nationwide',
      suffix: '+',
      color: 'text-green-300'
    },
    {
      key: 'medicines',
      icon: Package,
      title: 'Medicines Managed',
      subtitle: 'Complete inventory tracking system',
      suffix: '+',
      color: 'text-blue-300'
    },
    {
      key: 'transactions',
      icon: CreditCard,
      title: 'Transactions Processed',
      subtitle: 'Seamless billing operations daily',
      suffix: '+',
      color: 'text-purple-300'
    },
    {
      key: 'uptime',
      icon: Shield,
      title: 'System Uptime',
      subtitle: 'Reliable 24/7 availability guaranteed',
      suffix: '%',
      color: 'text-yellow-300'
    }
  ];

  const animateCounters = React.useCallback(() => {
    const duration = 2500; // 2.5 seconds
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
        uptime: Math.floor(targetValues.uptime * easeOutQuart * 10) / 10 // For decimal precision
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
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, animateCounters]);


  const formatNumber = (num, key) => {
    if (key === 'uptime') {
      return num.toFixed(1);
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section ref={sectionRef} className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white section-padding relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full filter blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating Icons */}
        <motion.div
          className="absolute top-20 right-1/4 text-white/10"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <TrendingUp className="w-16 h-16" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 left-1/4 text-white/10"
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Star className="w-12 h-12" />
        </motion.div>
      </div>

      <div className="container-max relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Trusted by Pharmacies Across India
          </h2>
          <p className="text-primary-100 text-lg">
            Join thousands of pharmacy professionals who trust ShelfCure
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.key}
                variants={itemVariants}
                className="text-center space-y-4 group"
              >
                {/* Icon */}
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 group-hover:bg-white/20 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <IconComponent className={`w-8 h-8 ${stat.color}`} />
                </motion.div>

                {/* Counter */}
                <motion.div
                  className="text-4xl md:text-5xl font-bold"
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {formatNumber(counters[stat.key], stat.key)}{stat.suffix}
                </motion.div>

                {/* Title */}
                <div className="text-white text-lg font-medium">
                  {stat.title}
                </div>

                {/* Subtitle */}
                <div className="text-primary-100 text-sm leading-relaxed">
                  {stat.subtitle}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Message */}
        <motion.div
          className="text-center mt-12 pt-8 border-t border-white/20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-primary-100 text-lg">
            Ready to join the growing community of successful pharmacies?
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CounterSection;
