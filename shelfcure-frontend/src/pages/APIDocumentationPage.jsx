import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Code, Lock, Zap, BookOpen } from 'lucide-react';

const APIDocumentationPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const endpoints = [
    {
      method: 'POST',
      path: '/api/auth/login',
      description: 'Authenticate user and get JWT token',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      method: 'GET',
      path: '/api/medicines',
      description: 'Get list of medicines for current store',
      color: 'bg-green-100 text-green-800'
    },
    {
      method: 'POST',
      path: '/api/sales',
      description: 'Create a new sales transaction',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      method: 'GET',
      path: '/api/inventory',
      description: 'Get current inventory status',
      color: 'bg-green-100 text-green-800'
    },
    {
      method: 'POST',
      path: '/api/purchases',
      description: 'Create a new purchase order',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      method: 'GET',
      path: '/api/customers',
      description: 'Get list of customers',
      color: 'bg-green-100 text-green-800'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">API Documentation</h1>
          <p className="text-xl text-primary-100">Build integrations with ShelfCure</p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="border-b bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {['overview', 'authentication', 'endpoints', 'examples'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8 max-w-4xl">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">API Overview</h2>
                <p className="text-gray-700 mb-4">
                  ShelfCure provides a comprehensive REST API for integrating with your pharmacy management system.
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Base URL
                </h3>
                <code className="text-blue-900">https://api.shelfcure.com/v1</code>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ RESTful API design</li>
                  <li>✓ JWT-based authentication</li>
                  <li>✓ Rate limiting: 1000 requests/hour</li>
                  <li>✓ JSON request/response format</li>
                  <li>✓ Comprehensive error handling</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'authentication' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                  <Lock className="w-8 h-8 text-primary-600" />
                  Authentication
                </h2>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Getting Started</h3>
                <p className="text-gray-700 mb-4">
                  All API requests require authentication using JWT tokens. Follow these steps:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Send your credentials to the login endpoint</li>
                  <li>Receive a JWT token in the response</li>
                  <li>Include the token in the Authorization header for all requests</li>
                </ol>
              </div>

              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`Authorization: Bearer YOUR_JWT_TOKEN

Example:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
                </pre>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Token Expiration</h3>
                <p className="text-gray-700">
                  JWT tokens expire after 24 hours. Refresh your token by calling the refresh endpoint.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                  <Code className="w-8 h-8 text-primary-600" />
                  API Endpoints
                </h2>
              </div>

              <div className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4 mb-3">
                      <span className={`px-3 py-1 rounded font-semibold text-sm ${endpoint.color}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-gray-900 font-mono">{endpoint.path}</code>
                    </div>
                    <p className="text-gray-600">{endpoint.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-8 h-8 text-primary-600" />
                  Code Examples
                </h2>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Login Example</h3>
                <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                  <pre className="text-sm">{`curl -X POST https://api.shelfcure.com/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'`}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Get Medicines Example</h3>
                <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                  <pre className="text-sm">{`curl -X GET https://api.shelfcure.com/v1/medicines \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}</pre>
                </div>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
                <p className="text-gray-700">
                  For more examples and detailed documentation, visit our developer portal or contact support.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default APIDocumentationPage;

