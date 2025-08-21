import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContactHeroSection from '../components/contact/ContactHeroSection';
import ContactFormSection from '../components/contact/ContactFormSection';
import ContactInfoSection from '../components/contact/ContactInfoSection';
import SupportChannelsSection from '../components/contact/SupportChannelsSection';
import OfficeLocationSection from '../components/contact/OfficeLocationSection';
import FAQContactSection from '../components/contact/FAQContactSection';
import GetInTouchSection from '../components/contact/GetInTouchSection';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* Contact Hero Section */}
      <ContactHeroSection />
      
      {/* Contact Form Section */}
      <ContactFormSection />
      
      {/* Contact Info Section */}
      <ContactInfoSection />
      
      {/* Support Channels Section */}
      <SupportChannelsSection />
      
      {/* Office Location Section */}
      <OfficeLocationSection />
      
      {/* FAQ Contact Section */}
      <FAQContactSection />
      
      {/* Get In Touch Section */}
      <GetInTouchSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ContactPage;
