import React from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  Users, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  BarChart3,
  Crown,
  UserCheck,
  Handshake
} from 'lucide-react';

const UserTypesSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.3
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const userTypes = [
    {
      title: "Store Owners",
      subtitle: "Scale Your Pharmacy Empire",
      description: "Manage multiple stores, track performance across locations, and grow your pharmacy business with comprehensive owner tools.",
      icon: Crown,
      color: "primary",
      features: [
        "Multi-store management dashboard",
        "Consolidated analytics & reporting",
        "Staff management across locations",
        "Subscription & billing control",
        "Cross-store inventory insights"
      ],
      bgGradient: "from-primary-500 to-primary-600",
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600"
    },
    {
      title: "Store Managers",
      subtitle: "Streamline Daily Operations",
      description: "Handle day-to-day pharmacy operations with AI-powered tools, smart inventory management, and seamless customer service.",
      icon: UserCheck,
      color: "blue",
      features: [
        "AI-powered store assistant",
        "Smart inventory management",
        "Quick sales & billing",
        "Customer purchase history",
        "Automated reorder alerts"
      ],
      bgGradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "B2B Affiliates (MRs)",
      subtitle: "Earn Recurring Commissions",
      description: "Join our affiliate program and earn recurring commissions by referring pharmacy stores to ShelfCure's comprehensive platform.",
      icon: Handshake,
      color: "green",
      features: [
        "Recurring commission structure",
        "Mobile-optimized affiliate panel",
        "Real-time referral tracking",
        "Marketing resources & QR codes",
        "Pharmacy onboarding support"
      ],
      bgGradient: "from-green-500 to-green-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-4">
            Built for Every{' '}
            <span className="text-primary-500">Pharmacy Professional</span>
          </h2>
          <p className="text-lg md:text-xl text-secondary-600 max-w-3xl mx-auto">
            Whether you're scaling multiple locations, managing daily operations, or building your affiliate network, 
            ShelfCure has the perfect solution for your role.
          </p>
        </motion.div>

        {/* User Type Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {userTypes.map((userType, index) => {
            const IconComponent = userType.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                className="group relative"
              >
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-soft hover:shadow-large transition-all duration-300 overflow-hidden h-full">
                  {/* Header with Gradient */}
                  <div className={`bg-gradient-to-r ${userType.bgGradient} p-6 text-white relative`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`${userType.iconBg} p-3 rounded-xl`}>
                        <IconComponent className={`w-6 h-6 ${userType.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{userType.title}</h3>
                        <p className="text-white/90 text-sm">{userType.subtitle}</p>
                      </div>
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-secondary-600 mb-6 leading-relaxed">
                      {userType.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-3">
                      {userType.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-secondary-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <motion.button
                      className={`w-full mt-6 bg-gradient-to-r ${userType.bgGradient} text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Learn More
                    </motion.button>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-secondary-600 mb-6">
            Ready to transform your pharmacy operations?
          </p>
          <motion.a
            href="/register"
            className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Today
            <TrendingUp className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default UserTypesSection;
