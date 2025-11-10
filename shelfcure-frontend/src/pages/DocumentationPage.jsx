import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BookOpen, Code, Database, Zap, Users, Settings } from 'lucide-react';

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const docs = [
    {
      id: 'overview',
      icon: BookOpen,
      title: 'Getting Started',
      sections: [
        { heading: 'Introduction', content: 'ShelfCure is a comprehensive medicine store management system built with modern technologies.' },
        { heading: 'System Requirements', content: 'Modern web browser, stable internet connection, and basic computer knowledge.' },
        { heading: 'Account Setup', content: 'Create your account, verify email, and set up your first store in minutes.' }
      ]
    },
    {
      id: 'api',
      icon: Code,
      title: 'API Documentation',
      sections: [
        { heading: 'Authentication', content: 'All API requests require authentication using JWT tokens.' },
        { heading: 'Endpoints', content: 'RESTful API endpoints for medicines, sales, purchases, customers, and more.' },
        { heading: 'Rate Limiting', content: 'API requests are rate-limited to 1000 requests per hour per user.' }
      ]
    },
    {
      id: 'inventory',
      icon: Database,
      title: 'Inventory Management',
      sections: [
        { heading: 'Adding Medicines', content: 'Add medicines with details like name, dosage, batch number, and expiry date.' },
        { heading: 'Stock Tracking', content: 'Track stock levels in both strips and individual units.' },
        { heading: 'Expiry Management', content: 'Automatic alerts for medicines nearing expiry dates.' }
      ]
    },
    {
      id: 'sales',
      icon: Zap,
      title: 'Sales Management',
      sections: [
        { heading: 'Creating Sales', content: 'Process sales transactions with automatic invoice generation.' },
        { heading: 'Customer Management', content: 'Maintain customer profiles and purchase history.' },
        { heading: 'Returns', content: 'Handle sales returns and adjustments easily.' }
      ]
    },
    {
      id: 'users',
      icon: Users,
      title: 'User Management',
      sections: [
        { heading: 'Roles & Permissions', content: 'Different roles: Store Owner, Store Manager, and Staff with specific permissions.' },
        { heading: 'Staff Management', content: 'Add and manage staff members with role-based access.' },
        { heading: 'Activity Logs', content: 'Track all user activities for security and audit purposes.' }
      ]
    },
    {
      id: 'settings',
      icon: Settings,
      title: 'Configuration',
      sections: [
        { heading: 'Store Settings', content: 'Configure store details, GST, and discount rules.' },
        { heading: 'Payment Settings', content: 'Set up payment methods and billing preferences.' },
        { heading: 'Notifications', content: 'Configure email and SMS notifications for important events.' }
      ]
    }
  ];

  const activeDoc = docs.find(doc => doc.id === activeTab);
  const Icon = activeDoc?.icon;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-primary-100">Complete guide to using ShelfCure</p>
        </div>
      </section>

      {/* Documentation Content */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-20">
                <h3 className="text-lg font-semibold mb-4">Documentation</h3>
                <nav className="space-y-2">
                  {docs.map((doc) => {
                    const DocIcon = doc.icon;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setActiveTab(doc.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                          activeTab === doc.id
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <DocIcon className="w-4 h-4" />
                        {doc.title}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white">
                <div className="flex items-center gap-3 mb-8">
                  {Icon && <Icon className="w-8 h-8 text-primary-600" />}
                  <h2 className="text-3xl font-bold">{activeDoc?.title}</h2>
                </div>

                <div className="space-y-8">
                  {activeDoc?.sections.map((section, index) => (
                    <div key={index} className="border-l-4 border-primary-600 pl-6">
                      <h3 className="text-xl font-semibold mb-3">{section.heading}</h3>
                      <p className="text-gray-600 leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>

                {/* Additional Resources */}
                <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <h3 className="text-lg font-semibold mb-3">Need More Help?</h3>
                  <p className="text-gray-700 mb-6">
                    Check out our Help Center for FAQs and common issues, or contact our support team.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/help-center" className="text-primary-600 hover:text-primary-700 font-semibold">
                      Visit Help Center →
                    </a>
                    <a href="/contact" className="text-primary-600 hover:text-primary-700 font-semibold">
                      Contact Support →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DocumentationPage;

