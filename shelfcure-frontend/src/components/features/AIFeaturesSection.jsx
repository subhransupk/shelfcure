import React from 'react';
import { Camera, Brain, Zap, TrendingUp, AlertTriangle, Search, Bot, Lightbulb } from 'lucide-react';

const AIFeaturesSection = () => {
  const aiFeatures = [
    {
      icon: Camera,
      title: 'AI Bill OCR',
      description: 'Automatically scan and digitize paper bills with 99% accuracy using advanced OCR technology.',
      features: ['Automatic text recognition', 'Data extraction', 'Error correction', 'Multi-language support'],
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      accuracy: '99%'
    },
    {
      icon: Brain,
      title: 'Smart Predictions',
      description: 'AI-powered demand forecasting helps you maintain optimal inventory levels.',
      features: ['Demand forecasting', 'Seasonal trends', 'Stock optimization', 'Reorder suggestions'],
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      accuracy: '95%'
    },
    {
      icon: Search,
      title: 'Intelligent Search',
      description: 'Find medicines quickly with AI-powered search that understands context and synonyms.',
      features: ['Smart autocomplete', 'Synonym recognition', 'Fuzzy matching', 'Voice search'],
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      accuracy: '98%'
    },
    {
      icon: AlertTriangle,
      title: 'Predictive Alerts',
      description: 'Get intelligent alerts for stock shortages, expiry dates, and business anomalies.',
      features: ['Smart notifications', 'Anomaly detection', 'Risk assessment', 'Proactive alerts'],
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-50',
      accuracy: '97%'
    }
  ];

  const aiCapabilities = [
    { icon: Bot, title: 'Automated Workflows', description: 'AI handles routine tasks automatically' },
    { icon: Lightbulb, title: 'Smart Insights', description: 'AI discovers hidden patterns in your data' },
    { icon: TrendingUp, title: 'Growth Optimization', description: 'AI suggests ways to improve performance' },
    { icon: Zap, title: 'Real-time Processing', description: 'AI processes data instantly as it comes in' }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            AI-Powered{' '}
            <span className="text-primary-500">Intelligence</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Harness the power of artificial intelligence to automate tasks, predict trends,
            and make smarter decisions for your pharmacy business.
          </p>
        </div>

        {/* AI Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {aiFeatures.map((feature, index) => (
            <div
              key={index}
              className={`${feature.bgColor} rounded-3xl p-8 hover:shadow-large transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden`}
            >
              {/* Accuracy Badge */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-secondary-900">
                {feature.accuracy} Accurate
              </div>

              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Feature List */}
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-3 text-sm text-secondary-600">
                      <div className={`w-2 h-2 bg-gradient-to-r ${feature.color} rounded-full flex-shrink-0`}></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* AI Capabilities */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              AI Capabilities
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Our AI engine continuously learns and improves to provide better insights and automation.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {aiCapabilities.map((capability, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500 transition-colors duration-200">
                  <capability.icon className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-200" />
                </div>
                <h4 className="font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                  {capability.title}
                </h4>
                <p className="text-secondary-600 text-sm">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIFeaturesSection;
