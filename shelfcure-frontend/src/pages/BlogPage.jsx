import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Calendar, User, ArrowRight, Search } from 'lucide-react';

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const blogPosts = [
    {
      id: 1,
      title: '10 Ways to Optimize Your Pharmacy Inventory',
      excerpt: 'Learn proven strategies to reduce waste, improve stock turnover, and maximize profitability in your pharmacy.',
      author: 'Sarah Johnson',
      date: '2024-01-15',
      category: 'Inventory Management',
      image: '📦',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'The Future of Digital Pharmacy Management',
      excerpt: 'Explore emerging technologies and trends that are transforming the pharmacy industry.',
      author: 'Mike Chen',
      date: '2024-01-12',
      category: 'Technology',
      image: '🚀',
      readTime: '7 min read'
    },
    {
      id: 3,
      title: 'Customer Retention Strategies for Pharmacies',
      excerpt: 'Discover effective techniques to build loyalty and increase repeat customers in your pharmacy.',
      author: 'Emma Davis',
      date: '2024-01-10',
      category: 'Business',
      image: '👥',
      readTime: '6 min read'
    },
    {
      id: 4,
      title: 'Compliance and Regulations: What You Need to Know',
      excerpt: 'Stay updated with the latest pharmacy regulations and compliance requirements.',
      author: 'John Smith',
      date: '2024-01-08',
      category: 'Compliance',
      image: '⚖️',
      readTime: '8 min read'
    },
    {
      id: 5,
      title: 'Scaling Your Pharmacy Business: A Growth Guide',
      excerpt: 'Strategic insights for expanding your pharmacy operations and entering new markets.',
      author: 'Lisa Anderson',
      date: '2024-01-05',
      category: 'Growth',
      image: '📈',
      readTime: '9 min read'
    },
    {
      id: 6,
      title: 'AI and Machine Learning in Pharmacy Management',
      excerpt: 'How artificial intelligence is revolutionizing inventory forecasting and customer service.',
      author: 'David Wilson',
      date: '2024-01-02',
      category: 'Technology',
      image: '🤖',
      readTime: '7 min read'
    }
  ];

  const categories = ['All', 'Inventory Management', 'Technology', 'Business', 'Compliance', 'Growth'];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">ShelfCure Blog</h1>
            <p className="text-xl text-primary-100 mb-8">Insights, tips, and industry trends for pharmacy management</p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-primary-200" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-primary-500 text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full transition-colors ${
                  index === 0
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Featured Image */}
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 h-48 flex items-center justify-center text-6xl">
                  {post.image}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>

                  <h3 className="text-xl font-semibold mb-3 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary-600" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-gray-600 mb-8">
              Get the latest pharmacy management tips and industry insights delivered to your inbox.
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <button className="btn-primary">Subscribe</button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;

