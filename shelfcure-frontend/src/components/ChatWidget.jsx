import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Minimize2 } from 'lucide-react';

const ChatWidget = ({ userType = 'website', storeId = null }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleStartChat = () => {
    const params = new URLSearchParams();
    params.set('type', userType);
    if (storeId) {
      params.set('storeId', storeId);
    }
    navigate(`/live-chat?${params.toString()}`);
  };

  const handleToggleWidget = () => {
    if (isVisible) {
      setIsVisible(false);
      setIsMinimized(false);
    } else {
      setIsVisible(true);
      setIsMinimized(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleToggleWidget}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 group"
          title="Start Live Chat"
        >
          <MessageCircle className="w-6 h-6" />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            !
          </div>
        </button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
            Need help? Start a chat!
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-primary-700 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">ShelfCure Support</span>
          <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            1
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-80 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-primary-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <div>
              <h3 className="font-semibold text-left">ShelfCure Support</h3>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleMinimize}
              className="p-1 hover:bg-primary-700 rounded"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleWidget}
              className="p-1 hover:bg-primary-700 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2 text-left">
              {userType === 'store' ? 'Store Support' : 'Customer Support'}
            </h4>
            <p className="text-sm text-gray-600 text-left">
              {userType === 'store' 
                ? 'Get help with your store operations, inventory, or technical issues.'
                : 'We\'re here to help! Get instant support from our team.'
              }
            </p>
          </div>

          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700 text-left">Quick Help</h5>
              <div className="space-y-2">
                {userType === 'store' ? (
                  <>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      📦 Inventory Management
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      💳 Payment Issues
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      🔧 Technical Support
                    </button>
                  </>
                ) : (
                  <>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      💊 Product Information
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      🚚 Order Status
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      💰 Pricing & Discounts
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Start Chat Button */}
            <button
              onClick={handleStartChat}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Start Live Chat
            </button>

            {/* Contact Info */}
            <div className="text-center text-xs text-gray-500">
              <p>Average response time: 2 minutes</p>
              <p className="mt-1">Available 24/7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
