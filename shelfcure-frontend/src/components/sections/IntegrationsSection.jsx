import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Smartphone,
  Cloud,
  Zap,
  ArrowRight,
  CheckCircle,
  Globe,
  Database,
  Shield
} from 'lucide-react';

const IntegrationsSection = () => {
  const integrations = [
    {
      name: "WhatsApp Business",
      description: "Send automated notifications, order updates, and customer communications",
      icon: MessageCircle,
      color: "green",
      features: ["Order notifications", "Low stock alerts", "Customer updates", "Automated messages"]
    },
    {
      name: "Payment Gateways",
      description: "Accept payments through multiple channels with secure processing",
      icon: CreditCard,
      color: "blue",
      features: ["UPI payments", "Card processing", "Digital wallets", "EMI options"]
    },
    {
      name: "GST & Billing",
      description: "Automated GST calculations and compliant invoice generation",
      icon: FileText,
      color: "purple",
      features: ["GST compliance", "E-invoicing", "Tax reports", "Audit trails"]
    },
    {
      name: "Analytics & BI",
      description: "Advanced business intelligence and performance analytics",
      icon: BarChart3,
      color: "orange",
      features: ["Sales analytics", "Inventory insights", "Performance metrics", "Custom reports"]
    },
    {
      name: "Mobile Apps",
      description: "Native mobile applications for iOS and Android platforms",
      icon: Smartphone,
      color: "indigo",
      features: ["Store management", "Sales on-the-go", "Inventory checks", "Real-time sync"]
    },
    {
      name: "Cloud Storage",
      description: "Secure cloud backup and data synchronization across devices",
      icon: Cloud,
      color: "cyan",
      features: ["Auto backups", "Data sync", "Secure storage", "99.9% uptime"]
    }
  ];

  const stats = [
    { number: "50+", label: "Integrations Available" },
    { number: "99.9%", label: "API Uptime" },
    { number: "24/7", label: "Integration Support" },
    { number: "< 5min", label: "Setup Time" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
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

  const getColorClasses = (color) => {
    const colorMap = {
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' }
    };
    return colorMap[color] || colorMap.green;
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-primary-500" />
            <span className="text-primary-500 font-medium">Seamless Integrations</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-4">
            Connect Everything{' '}
            <span className="text-primary-500">You Need</span>
          </h2>
          <p className="text-lg md:text-xl text-secondary-600 max-w-3xl mx-auto">
            ShelfCure integrates seamlessly with your existing tools and services. 
            From payment gateways to communication platforms, we've got you covered.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-500 mb-2">
                {stat.number}
              </div>
              <div className="text-secondary-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Integration Cards */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {integrations.map((integration, index) => {
            const IconComponent = integration.icon;
            const colors = getColorClasses(integration.color);
            
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-soft hover:shadow-large transition-all duration-300 p-6 border border-gray-100 h-full">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${colors.bg} p-3 rounded-xl ${colors.border} border`}>
                      <IconComponent className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-secondary-900 mb-2">
                        {integration.name}
                      </h3>
                      <p className="text-secondary-600 text-sm leading-relaxed">
                        {integration.description}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {integration.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span className="text-secondary-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hover Effect */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-primary-500 text-sm font-medium">
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* API Section */}
        <motion.div
          className="bg-gradient-to-r from-secondary-900 to-secondary-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Developer-Friendly APIs</h3>
              </div>
              <p className="text-white/90 mb-6 leading-relaxed">
                Build custom integrations with our comprehensive REST APIs. 
                Complete documentation, SDKs, and dedicated developer support.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">REST APIs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">Secure Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">Complete Documentation</span>
                </div>
              </div>
            </div>

            <div className="bg-black/20 rounded-2xl p-6 font-mono text-sm">
              <div className="text-primary-400 mb-2">// Example API Call</div>
              <div className="text-white/80">
                <span className="text-blue-400">fetch</span>
                <span className="text-white">(</span>
                <span className="text-green-400">'https://api.shelfcure.com/v1/inventory'</span>
                <span className="text-white">, {`{`}</span>
              </div>
              <div className="text-white/80 ml-4">
                <span className="text-orange-400">method</span>
                <span className="text-white">: </span>
                <span className="text-green-400">'GET'</span>
                <span className="text-white">,</span>
              </div>
              <div className="text-white/80 ml-4">
                <span className="text-orange-400">headers</span>
                <span className="text-white">: {`{`}</span>
              </div>
              <div className="text-white/80 ml-8">
                <span className="text-green-400">'Authorization'</span>
                <span className="text-white">: </span>
                <span className="text-green-400">'Bearer token'</span>
              </div>
              <div className="text-white/80 ml-4">
                <span className="text-white">{`}`}</span>
              </div>
              <div className="text-white/80">
                <span className="text-white">{`})`}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <motion.a
              href="/contact"
              className="bg-white text-secondary-900 font-medium py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200 inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore API Documentation
              <ArrowRight className="w-4 h-4" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
