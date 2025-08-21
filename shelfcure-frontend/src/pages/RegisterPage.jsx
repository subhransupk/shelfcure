import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RegisterHeroSection from '../components/register/RegisterHeroSection';
import RegisterFormSection from '../components/register/RegisterFormSection';
import RegisterBenefitsSection from '../components/register/RegisterBenefitsSection';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* Register Hero Section */}
      <RegisterHeroSection />
      
      {/* Register Form Section */}
      <RegisterFormSection />
      
      {/* Register Benefits Section */}
      <RegisterBenefitsSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RegisterPage;
