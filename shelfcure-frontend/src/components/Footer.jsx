import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ArrowRight } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'Mobile App', href: '#mobile' },
        { name: 'Integrations', href: '#integrations' },
        { name: 'API Documentation', href: '#api' }
      ]
    },
    {
      title: 'Solutions',
      links: [
        { name: 'Small Pharmacies', href: '#small-pharmacy' },
        { name: 'Chain Stores', href: '#chain-stores' },
        { name: 'Hospital Pharmacies', href: '#hospital' },
        { name: 'Online Pharmacies', href: '#online' },
        { name: 'Enterprise', href: '#enterprise' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Help Center', href: '#help' },
        { name: 'Documentation', href: '#docs' },
        { name: 'Blog', href: '#blog' },
        { name: 'Case Studies', href: '#case-studies' },
        { name: 'Webinars', href: '#webinars' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#about' },
        { name: 'Careers', href: '#careers' },
        { name: 'Contact', href: '#contact' },
        { name: 'Privacy Policy', href: '#privacy' },
        { name: 'Terms of Service', href: '#terms' }
      ]
    }
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#facebook' },
    { name: 'Twitter', icon: Twitter, href: '#twitter' },
    { name: 'LinkedIn', icon: Linkedin, href: '#linkedin' },
    { name: 'Instagram', icon: Instagram, href: '#instagram' }
  ];

  return (
    <footer className="bg-secondary-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-secondary-700">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl text-left">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Stay Updated with ShelfCure
            </h3>
            <p className="text-secondary-300 mb-8 max-w-2xl">
              Get the latest updates on new features, industry insights, and pharmacy management tips
              delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-secondary-800 border border-secondary-600 text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="btn-primary whitespace-nowrap">
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-max px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <img
                src="/images/logo/final-logo.png"
                alt="ShelfCure Logo"
                className="h-8 w-auto filter brightness-0 invert"
              />
            </div>
            <p className="text-secondary-300 mb-6 leading-relaxed">
              Revolutionizing pharmacy management with our comprehensive MERN stack solution. 
              Streamline operations, increase efficiency, and grow your business with ShelfCure.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-secondary-300">
                <Mail className="w-5 h-5 text-primary-400" />
                <span>support@shelfcure.com</span>
              </div>
              <div className="flex items-center gap-3 text-secondary-300">
                <Phone className="w-5 h-5 text-primary-400" />
                <span>+91 12345 67890</span>
              </div>
              <div className="flex items-center gap-3 text-secondary-300">
                <MapPin className="w-5 h-5 text-primary-400" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index} className="lg:col-span-1 text-left">
              <h4 className="text-lg font-semibold mb-6">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-secondary-300 hover:text-primary-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-secondary-700">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-secondary-400 text-left">
              <p>&copy; {currentYear} ShelfCure. All rights reserved.</p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-secondary-800 rounded-full flex items-center justify-center text-secondary-400 hover:text-primary-400 hover:bg-secondary-700 transition-all duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Additional Links */}
            <div className="flex items-center gap-6 text-sm text-secondary-400">
              <a href="#privacy" className="hover:text-primary-400 transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-primary-400 transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#cookies" className="hover:text-primary-400 transition-colors duration-200">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
