import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQContactSection = () => {
  const [openFAQ, setOpenFAQ] = useState(0);

  const contactFAQs = [
    {
      question: 'What is the best way to contact ShelfCure support?',
      answer: 'For general inquiries, our live chat is the fastest option with responses under 2 minutes. For technical issues, email support provides detailed assistance within 2 hours. For urgent matters, call our phone support during business hours.'
    },
    {
      question: 'How quickly can I expect a response to my inquiry?',
      answer: 'Response times vary by channel: Live chat (under 2 minutes), Phone support (immediate during business hours), Email support (within 2 hours), and Emergency support (immediate 24/7 for critical issues).'
    },
    {
      question: 'Do you offer support in languages other than English?',
      answer: 'Yes! We provide support in Hindi, Marathi, Gujarati, Tamil, Telugu, and Bengali. Our multilingual support team can assist you in your preferred language during business hours.'
    },
    {
      question: 'Can I schedule a demo or consultation?',
      answer: 'Absolutely! You can schedule a personalized demo through our website, by calling our sales team, or by filling out the contact form. We offer both virtual and in-person consultations based on your preference.'
    },
    {
      question: 'What information should I include when contacting support?',
      answer: 'Please include your pharmacy name, contact details, a detailed description of your issue or question, any error messages you\'re seeing, and the urgency level. Screenshots or videos can also be very helpful.'
    },
    {
      question: 'Is there a cost for technical support?',
      answer: 'Basic technical support is included with all ShelfCure subscriptions at no additional cost. Premium support with faster response times and dedicated account management is available for enterprise customers.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? -1 : index);
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 mb-6">
            Contact{' '}
            <span className="text-primary-500">FAQ</span>
          </h2>
          <p className="text-lg text-secondary-600 leading-relaxed">
            Quick answers to common questions about contacting ShelfCure and getting support.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* FAQ Items */}
          <div className="space-y-4 mb-16">
            {contactFAQs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden hover:shadow-medium transition-all duration-200"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-secondary-900 pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {openFAQ === index ? (
                      <ChevronUp className="w-6 h-6 text-primary-500" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-secondary-400" />
                    )}
                  </div>
                </button>

                {/* Answer Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-8 pb-6">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-secondary-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Still Have Questions */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-3xl p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-secondary-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Can't find the answer you're looking for? Our friendly support team is here to help. 
              Reach out to us through any of our contact channels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary text-lg px-8 py-4">
                Contact Support
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                Browse All FAQs
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQContactSection;
