import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Lock, Eye, Users, Database, AlertCircle } from 'lucide-react';

const PrivacyPolicyPage = () => {
  const sections = [
    {
      icon: Shield,
      title: 'Data Protection',
      content: 'We implement industry-leading security measures to protect your personal and business data. All data is encrypted in transit and at rest using modern encryption standards.'
    },
    {
      icon: Lock,
      title: 'Information Security',
      content: 'Your information is stored on secure servers with restricted access. We conduct regular security audits and maintain compliance with international data protection standards.'
    },
    {
      icon: Eye,
      title: 'Transparency',
      content: 'We are transparent about how we collect, use, and share your data. You have full control over your personal information and can request access or deletion at any time.'
    },
    {
      icon: Users,
      title: 'User Rights',
      content: 'You have the right to access, modify, or delete your personal data. We respect your privacy choices and never sell your information to third parties.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-primary-100">Your privacy is our priority. Learn how we protect your data.</p>
        </div>
      </section>

      {/* Last Updated */}
      <section className="bg-gray-50 py-8 border-b">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </section>

      {/* Key Principles */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Privacy Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                  <Icon className="w-12 h-12 text-primary-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
                  <p className="text-gray-600">{section.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Policy */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Detailed Privacy Policy</h2>
          
          <div className="space-y-8 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-600" />
                Information We Collect
              </h3>
              <p className="mb-3">We collect information you provide directly to us, such as:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account registration information (name, email, phone)</li>
                <li>Store and business information</li>
                <li>Payment and billing information</li>
                <li>Medicine inventory and sales data</li>
                <li>Customer and supplier information</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary-600" />
                How We Use Your Information
              </h3>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure security</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Data Retention</h3>
              <p>We retain your personal data for as long as necessary to provide our services and fulfill the purposes outlined in this policy. You can request deletion of your data at any time.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
              <p>If you have questions about this privacy policy, please contact us at:</p>
              <p className="mt-2 font-semibold">privacy@shelfcure.com</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;

