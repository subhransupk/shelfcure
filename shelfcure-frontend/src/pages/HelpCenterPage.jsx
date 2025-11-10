import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Search, HelpCircle, MessageSquare, BookOpen, Zap, Users } from 'lucide-react';

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      icon: Zap,
      title: 'Getting Started',
      description: 'Learn the basics of ShelfCure and set up your account',
      articles: [
        'Creating your first store',
        'Adding medicines to inventory',
        'Processing your first sale',
        'Understanding user roles'
      ]
    },
    {
      icon: BookOpen,
      title: 'Inventory Management',
      description: 'Master inventory tracking and management features',
      articles: [
        'Adding and editing medicines',
        'Managing stock levels',
        'Tracking expiry dates',
        'Handling returns and adjustments'
      ]
    },
    {
      icon: Users,
      title: 'Sales & Customers',
      description: 'Manage sales transactions and customer relationships',
      articles: [
        'Creating sales orders',
        'Managing customer profiles',
        'Viewing purchase history',
        'Generating invoices'
      ]
    },
    {
      icon: MessageSquare,
      title: 'Support & Billing',
      description: 'Get help with subscriptions and billing',
      articles: [
        'Subscription plans explained',
        'Payment methods',
        'Invoice management',
        'Billing support'
      ]
    }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.'
    },
    {
      question: 'Can I manage multiple stores?',
      answer: 'Yes! Store Owners can manage multiple stores based on their subscription plan. Each store has its own inventory and sales data.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept credit cards, debit cards, and bank transfers. All payments are processed securely.'
    },
    {
      question: 'How do I export my data?',
      answer: 'You can export sales, inventory, and customer data from the Analytics section in your store panel.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use industry-leading encryption and security measures to protect your data. All data is backed up regularly.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach our support team via email at support@shelfcure.com or through the live chat feature in your dashboard.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-primary-100 mb-8">Find answers to your questions and get support</p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-primary-200" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-primary-500 text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <Icon className="w-12 h-12 text-primary-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                  <p className="text-gray-600 mb-6">{category.description}</p>
                  <ul className="space-y-2">
                    {category.articles.map((article, idx) => (
                      <li key={idx} className="text-primary-600 hover:text-primary-700 cursor-pointer flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
                        {article}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary-600" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 ml-7">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-12 rounded-lg border border-primary-200 text-center">
            <MessageSquare className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
            <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
              Our support team is here to help. Contact us via email or use the live chat feature in your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@shelfcure.com" className="btn-primary">
                Email Support
              </a>
              <a href="/contact" className="btn-secondary">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenterPage;

