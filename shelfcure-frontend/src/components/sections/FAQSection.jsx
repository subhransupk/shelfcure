import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(0);

  const faqs = [
    {
      question: 'How quickly can I get started with ShelfCure?',
      answer: 'You can get started immediately! Our onboarding process takes just 5-10 minutes to create your account and set up your pharmacy profile. Our team will then help you import your existing inventory and configure the system to match your needs. Most pharmacies are fully operational within 24-48 hours.'
    },
    {
      question: 'Does ShelfCure support multiple pharmacy locations?',
      answer: 'Yes! ShelfCure is designed with multi-store support from the ground up. You can manage multiple pharmacy locations from a single dashboard, with centralized inventory management, store-wise analytics, and role-based access control for different team members across locations.'
    },
    {
      question: 'How secure is my pharmacy data with ShelfCure?',
      answer: 'Data security is our top priority. We use enterprise-grade encryption, secure cloud infrastructure, regular automated backups, and comply with healthcare data protection standards. Your data is stored securely and is only accessible by authorized personnel with proper authentication.'
    },
    {
      question: 'What kind of training and support do you provide?',
      answer: 'We provide comprehensive training including video tutorials, live training sessions, detailed documentation, and 24/7 customer support. Our team offers personalized onboarding assistance and ongoing support to ensure you get the most out of ShelfCure.'
    },
    {
      question: 'Can I migrate my existing data to ShelfCure?',
      answer: 'Absolutely! We provide free data migration services to help you transfer your existing inventory, customer data, and transaction history from your current system. Our technical team will handle the migration process to ensure a smooth transition with zero data loss.'
    },
    {
      question: 'What payment methods do you accept for subscriptions?',
      answer: 'We accept all major payment methods including credit/debit cards, UPI, net banking, and digital wallets. We also offer flexible billing cycles (monthly, quarterly, or annual) with discounts for longer-term commitments. All payments are processed securely through encrypted payment gateways.'
    },
    {
      question: 'Is there a mobile app available?',
      answer: 'Yes! ShelfCure offers native mobile apps for both iOS and Android. The mobile app includes all core features like inventory checking, sales processing, customer management, and analytics. You can manage your pharmacy operations on-the-go with offline functionality for uninterrupted service.'
    },
    {
      question: 'How does the AI-powered Bill OCR feature work?',
      answer: 'Our AI-powered Bill OCR (Optical Character Recognition) automatically scans and digitizes paper bills, invoices, and receipts. It extracts key information like medicine names, quantities, prices, and supplier details, then automatically updates your inventory and financial records, saving hours of manual data entry.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? -1 : index);
  };

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Frequently Asked{' '}
            <span className="text-primary-500">Questions</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Got questions? We've got answers. Here are the most common questions 
            about ShelfCure and how it can help your pharmacy business.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-soft hover:shadow-medium transition-shadow duration-200"
            >
              {/* Question Header */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-secondary-900 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-primary-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-secondary-400" />
                  )}
                </div>
              </button>

              {/* Answer Content */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-0">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-secondary-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white p-8 rounded-2xl shadow-soft border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-secondary-900 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-secondary-600 mb-6">
              Our team is here to help! Get in touch with us for personalized assistance 
              and detailed answers to your specific questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary text-lg px-8 py-4">
                Contact Support
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                Schedule a Call
              </button>
            </div>
            <p className="text-sm text-secondary-500 mt-4">
              Average response time: Under 2 hours
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
