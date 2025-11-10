import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { TrendingUp, Users, Award, ArrowRight } from 'lucide-react';

const CaseStudiesPage = () => {
  const caseStudies = [
    {
      id: 1,
      title: 'Metro Pharmacy Chain - 40% Efficiency Gain',
      subtitle: 'Multi-store management transformation',
      image: '🏪',
      challenge: 'Managing inventory across 15 stores with manual processes',
      solution: 'Implemented ShelfCure for centralized inventory management',
      results: [
        '40% reduction in inventory management time',
        '25% decrease in stock wastage',
        '35% improvement in order accuracy'
      ],
      quote: 'ShelfCure transformed how we manage our stores. We now have real-time visibility across all locations.',
      author: 'Rajesh Kumar, Store Owner'
    },
    {
      id: 2,
      title: 'City Hospital Pharmacy - 50% Cost Reduction',
      subtitle: 'Hospital pharmacy optimization',
      image: '🏥',
      challenge: 'Complex inventory tracking for hospital pharmacy with high volume',
      solution: 'Deployed ShelfCure with custom configurations for hospital needs',
      results: [
        '50% reduction in operational costs',
        '99.5% inventory accuracy',
        '60% faster order processing'
      ],
      quote: 'The accuracy and speed improvements have been remarkable. Our staff can now focus on patient care.',
      author: 'Dr. Priya Sharma, Hospital Administrator'
    },
    {
      id: 3,
      title: 'Online Pharmacy Startup - 3x Growth',
      subtitle: 'Scaling e-commerce pharmacy operations',
      image: '📱',
      challenge: 'Managing rapid growth without proper inventory system',
      solution: 'Integrated ShelfCure with e-commerce platform',
      results: [
        '3x business growth in 6 months',
        '95% order fulfillment rate',
        '40% reduction in customer complaints'
      ],
      quote: 'ShelfCure enabled us to scale without hiring additional staff. It\'s been a game-changer.',
      author: 'Amit Patel, Founder'
    },
    {
      id: 4,
      title: 'Rural Pharmacy Network - Digital Transformation',
      subtitle: 'Bringing digital solutions to rural areas',
      image: '🌾',
      challenge: 'Limited technical resources in rural pharmacy network',
      solution: 'Implemented user-friendly ShelfCure with local support',
      results: [
        '100% adoption across 20 pharmacies',
        '45% increase in sales',
        'Improved customer satisfaction'
      ],
      quote: 'Even with limited technical knowledge, our team found ShelfCure easy to use and incredibly helpful.',
      author: 'Suresh Reddy, Network Manager'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Case Studies</h1>
          <p className="text-xl text-primary-100">See how ShelfCure transformed pharmacy businesses</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-2">500+</h3>
              <p className="text-gray-600">Pharmacies Transformed</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-2">10,000+</h3>
              <p className="text-gray-600">Active Users</p>
            </div>
            <div className="text-center">
              <Award className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-2">98%</h3>
              <p className="text-gray-600">Customer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {caseStudies.map((study, index) => (
              <div
                key={study.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${
                  index % 2 === 1 ? 'lg:grid-cols-2 lg:auto-cols-fr' : ''
                }`}
              >
                {/* Image */}
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg h-64 flex items-center justify-center text-8xl">
                    {study.image}
                  </div>
                </div>

                {/* Content */}
                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <h3 className="text-3xl font-bold mb-2">{study.title}</h3>
                  <p className="text-primary-600 font-semibold mb-4">{study.subtitle}</p>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Challenge</h4>
                    <p className="text-gray-600">{study.challenge}</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Solution</h4>
                    <p className="text-gray-600">{study.solution}</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Results</h4>
                    <ul className="space-y-2">
                      {study.results.map((result, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-primary-600">
                    <p className="text-gray-700 italic mb-2">"{study.quote}"</p>
                    <p className="text-sm font-semibold text-gray-900">— {study.author}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Pharmacy?</h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of pharmacies that have already improved their operations with ShelfCure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="btn-secondary text-white">
              Get Started Today
            </a>
            <a href="/contact" className="btn-secondary border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary-600">
              Schedule a Demo
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CaseStudiesPage;

