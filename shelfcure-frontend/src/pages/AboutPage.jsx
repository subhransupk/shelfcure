import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AboutHeroSection from '../components/about/AboutHeroSection';
import StorySection from '../components/about/StorySection';
import MissionVisionSection from '../components/about/MissionVisionSection';
import TeamSection from '../components/about/TeamSection';
import ValuesSection from '../components/about/ValuesSection';
import StatsSection from '../components/about/StatsSection';
import TimelineSection from '../components/about/TimelineSection';
import CultureSection from '../components/about/CultureSection';
import JoinUsSection from '../components/about/JoinUsSection';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* About Hero Section */}
      <AboutHeroSection />
      
      {/* Our Story Section */}
      <StorySection />
      
      {/* Mission & Vision Section */}
      <MissionVisionSection />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* Timeline Section */}
      <TimelineSection />
      
      {/* Our Values Section */}
      <ValuesSection />
      
      {/* Team Section */}
      <TeamSection />
      
      {/* Culture Section */}
      <CultureSection />
      
      {/* Join Us Section */}
      <JoinUsSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutPage;
