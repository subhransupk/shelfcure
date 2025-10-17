import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  MessageSquare, 
  FileText, 
  Camera, 
  BarChart3, 
  ShoppingCart,
  Users,
  Package,
  Zap,
  Sparkles,
  ArrowRight,
  Play
} from 'lucide-react';

const AIAssistantSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const aiFeatures = [
    {
      id: 0,
      title: "Conversational Store Management",
      description: "Ask anything in natural language and let AI handle complex store operations seamlessly.",
      icon: MessageSquare,
      example: "Show me today's sales report and low stock medicines",
      color: "primary"
    },
    {
      id: 1,
      title: "Purchase Bill OCR",
      description: "Upload supplier bills and automatically extract medicine details, quantities, and prices.",
      icon: FileText,
      example: "Extract all medicines from this supplier invoice",
      color: "blue"
    },
    {
      id: 2,
      title: "Prescription OCR",
      description: "Scan prescriptions to auto-populate sales cart with prescribed medicines and dosages.",
      icon: Camera,
      example: "Add medicines from this prescription to cart",
      color: "green"
    },
    {
      id: 3,
      title: "Smart Analytics",
      description: "Get instant insights and recommendations based on your store's performance data.",
      icon: BarChart3,
      example: "What are my best-selling medicines this month?",
      color: "purple"
    }
  ];

  const capabilities = [
    { icon: ShoppingCart, text: "Sales Management" },
    { icon: Package, text: "Inventory Control" },
    { icon: Users, text: "Customer Service" },
    { icon: BarChart3, text: "Analytics & Reports" },
    { icon: FileText, text: "Document Processing" },
    { icon: Zap, text: "Automated Tasks" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl"
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
          className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"
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
            <Sparkles className="w-6 h-6 text-primary-400" />
            <span className="text-primary-400 font-medium">AI-Powered Intelligence</span>
            <Sparkles className="w-6 h-6 text-primary-400" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Meet Your AI{' '}
            <span className="text-primary-400">Store Assistant</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Revolutionary AI that understands your pharmacy business and executes complex operations 
            through simple conversations. No training required.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {aiFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              const isActive = activeFeature === index;
              
              return (
                <motion.div
                  key={feature.id}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/10 border border-primary-400/30' 
                      : 'bg-white/5 hover:bg-white/8 border border-transparent'
                  }`}
                  onClick={() => setActiveFeature(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      isActive ? 'bg-primary-500' : 'bg-white/10'
                    }`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-300 mb-3">{feature.description}</p>
                      <div className="bg-black/20 rounded-lg p-3 border-l-4 border-primary-400">
                        <p className="text-sm text-primary-200 font-mono">
                          "{feature.example}"
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right Side - Demo/Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Chat Interface Mockup */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Chat Header */}
              <div className="bg-primary-500 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white">ShelfCure AI Assistant</h4>
                  <p className="text-primary-100 text-sm">Online • Ready to help</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-6 space-y-4 h-80 overflow-y-auto bg-gray-50">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-xs">
                    <p className="text-secondary-800 text-sm">
                      Hi! I'm your AI assistant. I can help you manage inventory, process sales, analyze data, and much more. What would you like to do today?
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="bg-primary-500 rounded-2xl rounded-tr-sm p-4 shadow-sm max-w-xs">
                    <p className="text-white text-sm">
                      Show me today's sales and which medicines are running low
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-secondary-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-secondary-600" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-xs">
                    <p className="text-secondary-800 text-sm mb-2">
                      Here's your sales summary for today:
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs">
                      <div className="flex justify-between mb-1">
                        <span>Total Sales:</span>
                        <span className="font-bold text-green-600">₹12,450</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Transactions:</span>
                        <span className="font-bold">23</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Low Stock Items:</span>
                        <span className="font-bold text-orange-600">5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typing Indicator */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask me anything about your store..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-secondary-800 text-sm"
                    disabled
                  />
                  <button className="bg-primary-500 text-white p-3 rounded-lg">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Capabilities */}
            <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 space-y-2">
              {capabilities.map((capability, index) => {
                const IconComponent = capability.icon;
                return (
                  <motion.div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2 text-sm"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <IconComponent className="w-4 h-4 text-primary-400" />
                    <span className="whitespace-nowrap">{capability.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/register"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try AI Assistant Free
              <Zap className="w-5 h-5" />
            </motion.a>
            <motion.button
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium py-4 px-8 rounded-lg transition-all duration-200 flex items-center gap-2 justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-5 h-5" />
              Watch AI Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AIAssistantSection;
