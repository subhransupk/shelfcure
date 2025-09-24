import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Send,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink,
  Book,
  Video,
  Download
} from 'lucide-react';

const AffiliateSupport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('faq');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [tickets, setTickets] = useState([]);
  
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
    attachments: []
  });

  const tabs = [
    { id: 'faq', name: 'FAQ', icon: HelpCircle },
    { id: 'tickets', name: 'Support Tickets', icon: MessageSquare },
    { id: 'contact', name: 'Contact Us', icon: Phone },
    { id: 'resources', name: 'Resources', icon: Book }
  ];

  const faqData = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I start earning as a ShelfCure affiliate?',
      answer: 'To start earning, simply share your unique affiliate link with pharmacy owners. When they sign up and subscribe to ShelfCure using your link, you earn a commission. You can find your affiliate links in the "Affiliate Links & QR" section.'
    },
    {
      id: 2,
      category: 'Commissions',
      question: 'When do I receive my commission payments?',
      answer: 'Commissions are paid monthly on the 15th of each month for the previous month\'s earnings. There\'s a 15-day buffer period to account for any refunds or adjustments. You can track your payout status in the Payment Settings section.'
    },
    {
      id: 3,
      category: 'Marketing',
      question: 'What marketing materials are available?',
      answer: 'We provide a comprehensive set of marketing materials including banners, brochures, WhatsApp templates, logos, videos, and product catalogs. All materials are available in the Marketing Resources section and are regularly updated.'
    },
    {
      id: 4,
      category: 'Tracking',
      question: 'How can I track my referrals and earnings?',
      answer: 'You can track all your referrals, earnings, and performance metrics in your affiliate dashboard. The Analytics section provides detailed insights into your performance, conversion rates, and top-performing links.'
    },
    {
      id: 5,
      category: 'Payments',
      question: 'What payment methods are supported?',
      answer: 'We support multiple payment methods including bank transfers (NEFT/IMPS/RTGS), UPI payments, and PayPal for international affiliates. You can set up your preferred payment method in the Payment Settings section.'
    },
    {
      id: 6,
      category: 'Requirements',
      question: 'What documents do I need for KYC verification?',
      answer: 'For KYC verification, you need to provide a government-issued ID (Aadhaar, Passport, Voter ID, PAN, or Driving License) and your PAN card. GST registration is optional but recommended for business affiliates.'
    }
  ];

  const contactInfo = [
    {
      type: 'Email',
      value: 'affiliate@shelfcure.com',
      description: 'General affiliate support and inquiries',
      icon: Mail
    },
    {
      type: 'WhatsApp',
      value: '+91 98765 43210',
      description: 'Quick support and urgent queries',
      icon: MessageSquare
    },
    {
      type: 'Phone',
      value: '+91 98765 43210',
      description: 'Business hours: 9 AM - 6 PM (Mon-Sat)',
      icon: Phone
    }
  ];

  const resources = [
    {
      title: 'Affiliate Program Guide',
      description: 'Complete guide to maximizing your affiliate earnings',
      type: 'PDF',
      icon: FileText,
      url: '/resources/affiliate-guide.pdf'
    },
    {
      title: 'Marketing Best Practices',
      description: 'Learn effective strategies for promoting ShelfCure',
      type: 'Video',
      icon: Video,
      url: '/resources/marketing-video'
    },
    {
      title: 'Compliance Guidelines',
      description: 'Important compliance rules for healthcare marketing',
      type: 'PDF',
      icon: FileText,
      url: '/resources/compliance-guide.pdf'
    },
    {
      title: 'API Documentation',
      description: 'Technical documentation for advanced integrations',
      type: 'Link',
      icon: ExternalLink,
      url: 'https://docs.shelfcure.com/affiliate-api'
    }
  ];

  useEffect(() => {
    // Check if user is authenticated as affiliate
    const affiliateToken = localStorage.getItem('affiliateToken');
    const affiliateData = localStorage.getItem('affiliateData');

    if (!affiliateToken || !affiliateData) {
      console.log('No affiliate authentication found, redirecting to login');
      navigate('/affiliate-login');
      return;
    }

    fetchSupportData();
  }, [navigate]);

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors

      // Check if user is authenticated
      const affiliateToken = localStorage.getItem('affiliateToken');
      if (!affiliateToken) {
        console.log('No affiliate authentication found, redirecting to login');
        navigate('/affiliate-login');
        return;
      }

      const response = await api.get('/api/affiliate-panel/support-tickets');

      if (response.data.success) {
        setTickets(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching support data:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(`Failed to load support data: ${error.response?.data?.message || error.message}`);
        // Provide sample data when API fails
        setTickets([
          {
            id: 'SAMPLE001',
            subject: 'Sample Support Ticket',
            status: 'open',
            priority: 'medium',
            category: 'general',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
              {
                id: 'MSG001',
                sender: 'affiliate',
                message: 'This is a sample support ticket for demonstration purposes.',
                timestamp: new Date().toISOString()
              }
            ]
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      Object.keys(ticketForm).forEach(key => {
        if (key === 'attachments') {
          ticketForm.attachments.forEach(file => {
            formData.append('attachments', file);
          });
        } else {
          formData.append(key, ticketForm[key]);
        }
      });

      const response = await api.post('/api/affiliate-panel/support-tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setSuccess('Support ticket submitted successfully');
        setTicketForm({
          subject: '',
          category: '',
          priority: 'medium',
          description: '',
          attachments: []
        });
        fetchSupportData();
        setActiveTab('tickets');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setError('Failed to submit support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = faqData.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTicketStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'open':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTicketStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'resolved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'open':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <AffiliatePanelLayout title="Support & Help" subtitle="Get help and support for your affiliate account">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout title="Support & Help" subtitle="Get help and support for your affiliate account">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {faq.category}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900">{faq.question}</h4>
                      </div>
                      {expandedFaq === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredFaqs.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No FAQs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search terms or browse all categories.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* Create New Ticket */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Support Ticket</h3>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="technical">Technical Issue</option>
                      <option value="payment">Payment & Commissions</option>
                      <option value="marketing">Marketing Materials</option>
                      <option value="account">Account Management</option>
                      <option value="general">General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    rows="4"
                    placeholder="Please describe your issue in detail..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setTicketForm({ ...ticketForm, attachments: Array.from(e.target.files) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 5MB each)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </div>

            {/* Existing Tickets */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Support Tickets</h3>
              
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                          <span className={getTicketStatusBadge(ticket.status)}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Ticket #{ticket.id}</span>
                          <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span>Category: {ticket.category}</span>
                          <span>Priority: {ticket.priority}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getTicketStatusIcon(ticket.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {tickets.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No support tickets</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create your first support ticket above.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactInfo.map((contact, index) => {
                const Icon = contact.icon;
                return (
                  <div key={index} className="text-center p-6 border border-gray-200 rounded-lg">
                    <div className="flex justify-center mb-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <Icon className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{contact.type}</h4>
                    <p className="text-lg font-semibold text-green-600 mb-2">{contact.value}</p>
                    <p className="text-sm text-gray-600">{contact.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-medium text-blue-900 mb-2">Support Hours</h4>
              <p className="text-sm text-blue-800">
                Our support team is available Monday to Saturday, 9:00 AM to 6:00 PM (IST).
                For urgent issues outside business hours, please use WhatsApp or create a high-priority ticket.
              </p>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Helpful Resources</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{resource.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {resource.type}
                          </span>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                          >
                            <Download className="w-3 h-3" />
                            Access
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateSupport;
