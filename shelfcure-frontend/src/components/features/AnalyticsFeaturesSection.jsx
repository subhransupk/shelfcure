import React from 'react';
import { BarChart, TrendingUp, PieChart, Calendar, Download, Eye, Target, DollarSign } from 'lucide-react';

const AnalyticsFeaturesSection = () => {
  const analyticsFeatures = [
    {
      icon: BarChart,
      title: 'Sales Analytics',
      description: 'Track sales performance with detailed charts and graphs showing trends over time.',
      features: ['Daily/Monthly/Yearly reports', 'Product performance', 'Revenue tracking', 'Profit margins'],
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: PieChart,
      title: 'Inventory Insights',
      description: 'Understand your inventory patterns with comprehensive stock analysis and forecasting.',
      features: ['Stock movement analysis', 'Fast/Slow moving items', 'Reorder predictions', 'Expiry tracking'],
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: TrendingUp,
      title: 'Business Growth',
      description: 'Monitor your pharmacy\'s growth with key performance indicators and benchmarks.',
      features: ['Growth metrics', 'Customer retention', 'Market trends', 'Competitive analysis'],
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Target,
      title: 'Custom Reports',
      description: 'Create personalized reports tailored to your specific business needs and requirements.',
      features: ['Custom dashboards', 'Scheduled reports', 'Export options', 'Data filtering'],
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const reportTypes = [
    { icon: Calendar, title: 'Daily Reports', description: 'End-of-day summaries' },
    { icon: DollarSign, title: 'Financial Reports', description: 'Revenue and profit analysis' },
    { icon: Eye, title: 'Audit Reports', description: 'Compliance and tracking' },
    { icon: Download, title: 'Export Options', description: 'PDF, Excel, CSV formats' }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Powerful{' '}
            <span className="text-primary-500">Analytics & Reports</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Make data-driven decisions with comprehensive analytics and customizable reports
            that give you deep insights into your pharmacy operations.
          </p>
        </div>

        {/* Analytics Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {analyticsFeatures.map((feature, index) => (
            <div
              key={index}
              className={`${feature.bgColor} rounded-3xl p-8 hover:shadow-large transition-all duration-300 hover:-translate-y-2 group`}
            >
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

        {/* Report Types */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Report Types Available
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Generate various types of reports to meet your business and compliance needs.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {reportTypes.map((report, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500 transition-colors duration-200">
                  <report.icon className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-200" />
                </div>
                <h4 className="font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                  {report.title}
                </h4>
                <p className="text-secondary-600 text-sm">
                  {report.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsFeaturesSection;
