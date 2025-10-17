import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ArrowRight, Play, Shield, Users, Clock, Star, TrendingUp, Zap, Bot, Sparkles, Pill, BarChart3, MessageSquare, Camera, Package, CreditCard } from 'lucide-react';

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const controls = useAnimation();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const floatingIcons = [
    { icon: Bot, color: 'text-primary-400', delay: 0, x: '10%', y: '20%' },
    { icon: Pill, color: 'text-primary-300', delay: 0.5, x: '85%', y: '15%' },
    { icon: BarChart3, color: 'text-primary-400', delay: 1, x: '15%', y: '70%' },
    { icon: MessageSquare, color: 'text-primary-300', delay: 1.5, x: '80%', y: '75%' },
    { icon: Camera, color: 'text-primary-400', delay: 2, x: '5%', y: '45%' },
    { icon: Package, color: 'text-primary-300', delay: 2.5, x: '90%', y: '45%' },
    { icon: CreditCard, color: 'text-primary-400', delay: 3, x: '50%', y: '10%' },
    { icon: Sparkles, color: 'text-primary-300', delay: 3.5, x: '45%', y: '85%' }
  ];

  return (
    <section id="home" className="relative overflow-hidden min-h-screen flex items-center">
      {/* Clean Professional Background */}
      <div className="absolute inset-0 bg-white">
        {/* Subtle Animated Mesh Gradient */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x / window.innerWidth * 100}% ${mousePosition.y / window.innerHeight * 100}%, rgba(34, 197, 94, 0.2) 0%, transparent 60%)`
          }}
        />

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0">
          {/* Subtle Geometric Elements */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-48 h-48 opacity-20"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full text-primary-400 fill-current">
              <polygon points="50,5 85,25 85,75 50,95 15,75 15,25" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.1" />
            </svg>
          </motion.div>

          {/* Clean Circle */}
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-32 h-32 rounded-full border border-primary-400/30 opacity-40"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -180, -360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Minimal Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }} />
          </div>
        </div>

        {/* Floating Feature Icons */}
        {floatingIcons.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={index}
              className={`absolute ${item.color} opacity-20`}
              style={{ left: item.x, top: item.y }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: [0, 1, 1.1, 1],
                rotate: [0, 180, 360],
                y: [-20, 20, -20],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: item.delay,
                ease: "easeInOut"
              }}
            >
              <IconComponent className="w-8 h-8" />
            </motion.div>
          );
        })}

        {/* Subtle Particle System */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary-400 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-30, -80, -30],
                opacity: [0, 0.3, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* 3D Floating Cards */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {/* AI Assistant Card */}
        <motion.div
          className="absolute top-20 right-20 bg-gradient-to-br from-white to-primary-50 backdrop-blur-sm border border-primary-200 rounded-2xl p-4 shadow-2xl"
          initial={{ opacity: 0, y: -50, rotateX: -15 }}
          animate={{
            opacity: 1,
            y: [0, -8, 0],
            rotateX: [-15, -12, -15],
            rotateY: [0, 3, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary-400" />
            <div>
              <div className="text-secondary-800 text-sm font-semibold">AI Assistant</div>
              <div className="text-primary-600 text-xs">Processing...</div>
            </div>
          </div>
          <div className="mt-2 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary-400 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Sales Analytics Card */}
        <motion.div
          className="absolute bottom-32 left-16 bg-gradient-to-br from-white to-primary-50 backdrop-blur-sm border border-primary-200 rounded-2xl p-4 shadow-2xl"
          initial={{ opacity: 0, x: -50, rotateY: 15 }}
          animate={{
            opacity: 1,
            x: [0, 8, 0],
            rotateY: [15, 12, 15],
            rotateX: [0, -3, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary-400" />
            <div>
              <div className="text-secondary-800 text-sm font-semibold">₹2,45,000</div>
              <div className="text-primary-600 text-xs">Today's Sales</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary-400" />
            <span className="text-primary-600 text-xs">+23%</span>
          </div>
        </motion.div>

        {/* Inventory Alert Card */}
        <motion.div
          className="absolute top-1/2 right-12 bg-gradient-to-br from-white to-orange-50 backdrop-blur-sm border border-orange-200 rounded-2xl p-4 shadow-2xl"
          initial={{ opacity: 0, scale: 0.8, rotateZ: -10 }}
          animate={{
            opacity: 1,
            scale: [1, 1.02, 1],
            rotateZ: [-10, -7, -10],
            y: [0, -8, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="flex items-center gap-3">
            <Pill className="w-8 h-8 text-orange-500" />
            <div>
              <div className="text-secondary-800 text-sm font-semibold">Low Stock</div>
              <div className="text-orange-600 text-xs">12 medicines</div>
            </div>
          </div>
          <motion.div
            className="mt-2 w-full bg-orange-200 rounded-full h-1"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, delay: 3 }}
          >
            <motion.div
              className="bg-primary-400 h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "30%" }}
              transition={{ duration: 1.5, delay: 3.5 }}
            />
          </motion.div>
        </motion.div>
      </div>

      <div className="container-max section-padding relative z-10">
        <motion.div
          className="grid lg:grid-cols-5 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column - Main Content (60%) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-100 to-emerald-100 backdrop-blur-sm border border-primary-300 text-secondary-800 px-6 py-3 rounded-full text-sm font-medium shadow-lg"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-primary-400" />
              </motion.div>
              <span className="bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent font-semibold">
                #1 AI-Powered Pharmacy Platform
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.div variants={itemVariants} className="space-y-8 text-left">
              <div className="relative">
                <h1 className="text-5xl md:text-6xl lg:text-8xl font-black leading-[0.9] tracking-tight">
                  <motion.div
                    className="block overflow-hidden"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <motion.span
                      className="block text-secondary-900 relative"
                      animate={{
                        textShadow: [
                          "0 0 20px rgba(34, 197, 94, 0.3)",
                          "0 0 40px rgba(34, 197, 94, 0.5)",
                          "0 0 20px rgba(34, 197, 94, 0.3)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      Transform
                    </motion.span>
                  </motion.div>

                  <motion.div
                    className="block overflow-hidden"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <motion.span
                      className="block relative"
                      style={{
                        background: "linear-gradient(45deg, #22c55e, #10b981, #06d6a0, #22c55e)",
                        backgroundSize: "300% 300%",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text"
                      }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      Pharmacy
                      <motion.div
                        className="absolute -inset-4 bg-gradient-to-r from-primary-400/30 via-emerald-400/30 to-teal-400/30 blur-2xl rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.7, 0.3],
                          rotate: [0, 180, 360]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.span>
                  </motion.div>

                  <motion.div
                    className="block overflow-hidden"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <motion.span
                      className="block text-secondary-900 relative"
                      animate={{
                        textShadow: [
                          "0 0 20px rgba(59, 130, 246, 0.3)",
                          "0 0 40px rgba(59, 130, 246, 0.5)",
                          "0 0 20px rgba(59, 130, 246, 0.3)"
                        ]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    >
                      Business
                      <motion.div
                        className="absolute -top-4 -right-4 w-12 h-12"
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.3, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Zap className="w-full h-full text-yellow-400 drop-shadow-lg" />
                      </motion.div>
                    </motion.span>
                  </motion.div>
                </h1>

                {/* Clean "AI" Badge */}
                <motion.div
                  className="absolute -top-8 right-0 lg:right-20"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{
                    scale: 1,
                    rotate: 0,
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: 1.5,
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <div className="relative">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-full font-bold text-xl shadow-2xl border-2 border-primary-300">
                      <div className="flex items-center gap-2">
                        <Bot className="w-6 h-6" />
                        AI Powered
                      </div>
                    </div>
                    <motion.div
                      className="absolute -inset-2 bg-gradient-to-r from-primary-400/40 to-primary-500/40 rounded-full blur-lg"
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.4, 0.6, 0.4]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                </motion.div>
              </div>

              <motion.p
                className="text-xl md:text-2xl text-secondary-700 max-w-3xl leading-relaxed font-light"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                The world's most advanced{' '}
                <motion.span
                  className="text-primary-400 font-semibold"
                  animate={{
                    textShadow: [
                      "0 0 10px rgba(34, 197, 94, 0.3)",
                      "0 0 15px rgba(34, 197, 94, 0.5)",
                      "0 0 10px rgba(34, 197, 94, 0.3)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  AI-powered pharmacy management system
                </motion.span>{' '}
                with intelligent OCR, dual-unit inventory, multi-store operations, and real-time analytics.
                <br />
                <motion.span
                  className="text-primary-600 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                >
                  Join 500+ pharmacies already revolutionizing healthcare.
                </motion.span>
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              {/* Primary CTA - Start Free Trial */}
              <motion.div className="relative group">
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-300"
                />
                <motion.a
                  href="/register"
                  className="relative flex items-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xl font-bold px-10 py-5 rounded-2xl shadow-2xl overflow-hidden group"
                  whileHover={{
                    scale: 1.05,
                    y: -3,
                    boxShadow: "0 25px 50px -12px rgba(34, 197, 94, 0.4)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <span>Start Free Trial</span>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </motion.div>
                </motion.a>
              </motion.div>

              {/* Secondary CTA - Watch Demo */}
              <motion.div className="relative group">
                <motion.button
                  className="relative flex items-center gap-3 bg-secondary-100 backdrop-blur-sm border-2 border-secondary-300 text-secondary-800 text-xl font-semibold px-10 py-5 rounded-2xl shadow-2xl overflow-hidden hover:bg-secondary-200 transition-all duration-300"
                  whileHover={{
                    scale: 1.05,
                    y: -3,
                    borderColor: "rgba(75, 85, 99, 0.4)",
                    boxShadow: "0 25px 50px -12px rgba(75, 85, 99, 0.2)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full shadow-lg"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Play className="w-6 h-6 text-white ml-1" />
                  </motion.div>
                  <span>Watch Demo</span>

                  {/* Ripple effect */}
                  <motion.div
                    className="absolute inset-0 border-2 border-white/30 rounded-2xl"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-8 pt-8 border-t border-gray-200"
            >
              <div className="flex items-center gap-2 text-secondary-600">
                <Shield className="w-5 h-5 text-primary-500" />
                <span className="font-medium">99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-600">
                <Users className="w-5 h-5 text-primary-500" />
                <span className="font-medium">500+ Happy Pharmacies</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-600">
                <Clock className="w-5 h-5 text-primary-500" />
                <span className="font-medium">24/7 Support</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Visual (40%) */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 relative"
          >
            {/* Main Dashboard Image */}
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {/* Custom Animated Dashboard */}
              <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                {/* Dashboard Header */}
                <motion.div
                  className="flex items-center justify-between mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.2 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-12 h-12 bg-gradient-to-r from-primary-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      <Bot className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <div className="text-secondary-800 font-bold text-lg">ShelfCure AI</div>
                      <div className="text-secondary-600 text-sm">Dashboard</div>
                    </div>
                  </div>
                  <motion.div
                    className="flex gap-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  </motion.div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <motion.div
                    className="bg-gradient-to-br from-primary-50 to-primary-100 backdrop-blur-sm border border-primary-200 rounded-2xl p-4"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 2.4, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.05, rotate: 2 }}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-primary-400" />
                      <div>
                        <motion.div
                          className="text-2xl font-bold text-secondary-800"
                          animate={{
                            textContent: ["₹0", "₹1,45,000", "₹2,45,000"]
                          }}
                          transition={{ duration: 3, delay: 2.5 }}
                        >
                          ₹2,45,000
                        </motion.div>
                        <div className="text-primary-200 text-sm">Today's Sales</div>
                      </div>
                    </div>
                    <motion.div
                      className="mt-2 flex items-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3 }}
                    >
                      <TrendingUp className="w-4 h-4 text-primary-400" />
                      <span className="text-primary-600 text-sm">+23%</span>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm border border-blue-200 rounded-2xl p-4"
                    initial={{ scale: 0, rotate: 10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 2.6, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.05, rotate: -2 }}
                  >
                    <div className="flex items-center gap-3">
                      <Pill className="w-8 h-8 text-blue-500" />
                      <div>
                        <motion.div
                          className="text-2xl font-bold text-secondary-800"
                          animate={{
                            textContent: ["0", "1,234", "2,456"]
                          }}
                          transition={{ duration: 3, delay: 2.7 }}
                        >
                          2,456
                        </motion.div>
                        <div className="text-blue-600 text-sm">Medicines</div>
                      </div>
                    </div>
                    <motion.div
                      className="mt-2 w-full bg-blue-200 rounded-full h-2"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, delay: 3.2 }}
                    >
                      <motion.div
                        className="bg-primary-400 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "78%" }}
                        transition={{ duration: 1.5, delay: 3.5 }}
                      />
                    </motion.div>
                  </motion.div>
                </div>

                {/* AI Chat Interface */}
                <motion.div
                  className="bg-gradient-to-br from-gray-50 to-gray-100 backdrop-blur-sm border border-gray-200 rounded-2xl p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.8 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-5 h-5 text-primary-400" />
                    <span className="text-secondary-800 font-medium text-sm">AI Assistant</span>
                    <motion.div
                      className="ml-auto flex gap-1"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-primary-400 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                  >
                    <div className="bg-primary-100 text-primary-700 text-sm p-2 rounded-lg">
                      "Show me today's low stock medicines"
                    </div>
                    <motion.div
                      className="bg-gray-200 text-gray-700 text-sm p-2 rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 3.5 }}
                    >
                      Found 12 medicines with low stock. Generating reorder suggestions...
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Floating Elements Around Dashboard */}
              <motion.div
                className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center shadow-lg opacity-80"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg opacity-70"
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 90, 180],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <MessageSquare className="w-4 h-4 text-gray-300" />
              </motion.div>

              <motion.div
                className="absolute top-1/4 -left-6 w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg opacity-60"
                animate={{
                  x: [0, 8, 0],
                  rotate: [0, -45, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Shield className="w-4 h-4 text-white" />
              </motion.div>



              {/* Stats Overlay */}
              <motion.div
                className="absolute bottom-4 left-4 bg-white backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-medium"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <div className="text-2xl font-bold text-primary-600">₹2.4L</div>
                <div className="text-sm text-secondary-600">Monthly Revenue</div>
              </motion.div>

              {/* Additional Stats */}
              <motion.div
                className="absolute top-4 right-4 bg-white backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-medium"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                <div className="text-lg font-bold text-green-600">+24%</div>
                <div className="text-xs text-secondary-600">Growth</div>
              </motion.div>
            </motion.div>

            {/* Glow Effect Around Dashboard */}
            <motion.div
              className="absolute -inset-8 bg-gradient-to-r from-primary-400/20 via-emerald-400/20 to-teal-400/20 rounded-3xl blur-3xl"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
