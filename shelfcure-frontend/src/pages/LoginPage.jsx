import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginHeroSection from '../components/login/LoginHeroSection';
import LoginFormSection from '../components/login/LoginFormSection';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* Login Hero Section */}
      <LoginHeroSection />
      
      {/* Login Form Section */}
      <LoginFormSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LoginPage;
