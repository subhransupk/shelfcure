import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FeaturesHeroSection from '../components/features/FeaturesHeroSection';
import CoreFeaturesSection from '../components/features/CoreFeaturesSection';
import InventoryFeaturesSection from '../components/features/InventoryFeaturesSection';
import SalesFeaturesSection from '../components/features/SalesFeaturesSection';
import AnalyticsFeaturesSection from '../components/features/AnalyticsFeaturesSection';
import AIFeaturesSection from '../components/features/AIFeaturesSection';
import IntegrationFeaturesSection from '../components/features/IntegrationFeaturesSection';
import SecurityFeaturesSection from '../components/features/SecurityFeaturesSection';
import MobileFeaturesSection from '../components/features/MobileFeaturesSection';
import FeatureComparisonSection from '../components/features/FeatureComparisonSection';

const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* Features Hero Section */}
      <FeaturesHeroSection />
      
      {/* Core Features Section */}
      <CoreFeaturesSection />
      
      {/* Inventory Features Section */}
      <InventoryFeaturesSection />
      
      {/* Sales Features Section */}
      <SalesFeaturesSection />
      
      {/* Analytics Features Section */}
      <AnalyticsFeaturesSection />
      
      {/* AI Features Section */}
      <AIFeaturesSection />
      
      {/* Integration Features Section */}
      <IntegrationFeaturesSection />
      
      {/* Security Features Section */}
      <SecurityFeaturesSection />
      
      {/* Mobile Features Section */}
      <MobileFeaturesSection />
      
      {/* Feature Comparison Section */}
      <FeatureComparisonSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FeaturesPage;
