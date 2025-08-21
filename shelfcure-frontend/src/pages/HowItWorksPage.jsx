import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HowItWorksHeroSection from '../components/howitworks/HowItWorksHeroSection';
import ProcessOverviewSection from '../components/howitworks/ProcessOverviewSection';
import DetailedStepsSection from '../components/howitworks/DetailedStepsSection';
import FeaturesInActionSection from '../components/howitworks/FeaturesInActionSection';
import IntegrationSection from '../components/howitworks/IntegrationSection';
import OnboardingSection from '../components/howitworks/OnboardingSection';
import SupportSection from '../components/howitworks/SupportSection';
import GetStartedSection from '../components/howitworks/GetStartedSection';

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* How It Works Hero Section */}
      <HowItWorksHeroSection />
      
      {/* Process Overview Section */}
      <ProcessOverviewSection />
      
      {/* Detailed Steps Section */}
      <DetailedStepsSection />
      
      {/* Features in Action Section */}
      <FeaturesInActionSection />
      
      {/* Integration Section */}
      <IntegrationSection />
      
      {/* Onboarding Section */}
      <OnboardingSection />
      
      {/* Support Section */}
      <SupportSection />
      
      {/* Get Started Section */}
      <GetStartedSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
