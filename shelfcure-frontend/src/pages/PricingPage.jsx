import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PricingSection from '../components/sections/PricingSection';

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Main Content with padding for fixed header */}
      <div className="pt-20">
        {/* Pricing Section */}
        <PricingSection />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PricingPage;

