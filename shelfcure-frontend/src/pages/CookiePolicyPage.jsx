import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Cookie, Settings, BarChart3, Lock } from 'lucide-react';

const CookiePolicyPage = () => {
  const cookieTypes = [
    {
      icon: Lock,
      name: 'Essential Cookies',
      description: 'These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.'
    },
    {
      icon: BarChart3,
      name: 'Analytics Cookies',
      description: 'We use analytics cookies to understand how visitors interact with our website. This helps us improve our services and user experience.'
    },
    {
      icon: Settings,
      name: 'Preference Cookies',
      description: 'These cookies remember your preferences and settings to provide a personalized experience when you visit our website.'
    },
    {
      icon: Cookie,
      name: 'Marketing Cookies',
      description: 'Marketing cookies are used to track visitors across websites to display relevant advertisements and measure campaign effectiveness.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-xl text-primary-100">Learn how we use cookies to enhance your experience.</p>
        </div>
      </section>

      {/* Last Updated */}
      <section className="bg-gray-50 py-8 border-b">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Types of Cookies We Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cookieTypes.map((cookie, index) => {
              const Icon = cookie.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                  <Icon className="w-12 h-12 text-primary-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{cookie.name}</h3>
                  <p className="text-gray-600">{cookie.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Policy */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Cookie Policy Details</h2>
          
          <div className="space-y-8 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold mb-3">What are Cookies?</h3>
              <p>Cookies are small text files that are stored on your device when you visit a website. They help websites remember information about your visit, such as your preferences and login information. Cookies are widely used to make websites work more efficiently and to provide information to the owners of the site.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">How We Use Cookies</h3>
              <p className="mb-3">ShelfCure uses cookies for various purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To remember your login information and preferences</li>
                <li>To analyze how you use our website</li>
                <li>To improve our website functionality and user experience</li>
                <li>To deliver targeted advertising</li>
                <li>To prevent fraud and enhance security</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Third-Party Cookies</h3>
              <p>We may allow third-party service providers to place cookies on your device for analytics, advertising, and other purposes. These third parties have their own privacy policies governing their use of cookies.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Managing Cookies</h3>
              <p className="mb-3">You can control and manage cookies in several ways:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Most web browsers allow you to refuse cookies or alert you when cookies are being sent</li>
                <li>You can delete cookies from your device at any time</li>
                <li>You can opt-out of certain types of cookies through your browser settings</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold mb-2">Important Note</h3>
              <p>Please note that if you disable cookies, some features of ShelfCure may not function properly. We recommend keeping cookies enabled for the best experience.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
              <p>If you have questions about our cookie policy, please contact us at:</p>
              <p className="mt-2 font-semibold">privacy@shelfcure.com</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CookiePolicyPage;

