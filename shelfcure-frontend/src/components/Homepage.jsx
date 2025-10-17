import React from 'react';
import Header from './Header';
import Footer from './Footer';
import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import CounterSection from './sections/CounterSection';
import FeaturesSection from './sections/FeaturesSection';
import HowItWorksSection from './sections/HowItWorksSection';
import TestimonialsSection from './sections/TestimonialsSection';
import FAQSection from './sections/FAQSection';
import SecuritySection from './sections/SecuritySection';
import CTASection from './sections/CTASection';
import PricingSection from './sections/PricingSection';
import AIAssistantSection from './sections/AIAssistantSection';
import UserTypesSection from './sections/UserTypesSection';
import IntegrationsSection from './sections/IntegrationsSection';

const Homepage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <AboutSection />

      {/* Counter Section */}
      <CounterSection />

      {/* User Types Section */}
      <UserTypesSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* AI Assistant Section */}
      <AIAssistantSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Security Section */}
      <SecuritySection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Homepage;
