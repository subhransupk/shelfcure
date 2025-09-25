# ShelfCure - Medicine Store Management System

A comprehensive MERN stack medicine store management system with dual unit inventory, AI-powered Bill OCR, multi-store support, WhatsApp integration, subscription billing, extensive analytics, and a B2B affiliate program.

## 🏗️ Project Structure

```
shelfcure/
├── shelfcure-backend/          # Node.js/Express API server
├── shelfcure-frontend/         # React.js web application
├── docs/                       # Project documentation
│   ├── implementation-summaries/
│   ├── RACK_MANAGEMENT_API.md
│   ├── RACK_MANAGEMENT_USER_GUIDE.md
│   ├── AFFILIATE_REFERRAL_SYSTEM.md
│   └── affilatepanel-detail.md
└── project-details.md          # Detailed project specifications
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd shelfcure-backend
npm install
npm start
```
Server runs on: `http://localhost:5000`

### Frontend Setup
```bash
cd shelfcure-frontend
npm install
npm start
```
Application runs on: `http://localhost:3000`

## 🎯 Key Features

### Core Functionality
- **Dual Unit Inventory**: Manage both strips/packs and individual units
- **Multi-Store Support**: Store owners can manage multiple pharmacy locations
- **Role-Based Access**: Store Owner vs Store Manager with distinct permissions
- **Subscription Management**: Tiered plans with feature restrictions

### Advanced Features
- **AI-Powered Bill OCR**: Automated invoice processing
- **WhatsApp Integration**: Customer notifications and communication
- **B2B Affiliate Program**: Multi-level commission system
- **Advanced Analytics**: Real-time reporting and insights
- **Purchase Returns**: Supplier credit management
- **Rack Management**: Physical inventory location tracking

### User Roles
- **Store Owner**: Purchases subscriptions, manages multiple stores, accesses owner panel
- **Store Manager**: Manages single store operations, accesses store panel
- **Affiliate**: B2B partners with commission tracking and referral management

## 📊 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer
- **Notifications**: WhatsApp API, SMS, Email

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **State Management**: React Context/Hooks
- **Charts**: Chart.js/Recharts
- **HTTP Client**: Axios

## 🔧 Environment Setup

Create `.env` files in both backend and frontend directories with required environment variables.

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
WHATSAPP_API_KEY=your_whatsapp_api_key
EMAIL_SERVICE_CONFIG=your_email_config
SMS_SERVICE_CONFIG=your_sms_config
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## 📚 Documentation

- [Project Details](./project-details.md) - Comprehensive project specifications
- [Rack Management API](./docs/RACK_MANAGEMENT_API.md) - API documentation for inventory management
- [Affiliate System](./docs/AFFILIATE_REFERRAL_SYSTEM.md) - B2B affiliate program details
- [Implementation Summaries](./docs/implementation-summaries/) - Feature implementation guides

## 🏪 Business Model

ShelfCure operates on a subscription-based SaaS model:
- Store Owners purchase subscriptions (not individual stores)
- Subscriptions include store count limits and feature access
- B2B affiliate program with recurring commissions
- Tiered pricing with feature restrictions

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Subscription-based feature restrictions
- Secure file upload handling
- Input validation and sanitization

## 🚀 Deployment

The application is designed for cloud deployment with:
- Scalable MongoDB Atlas database
- Node.js backend on cloud platforms
- React frontend with CDN distribution
- Environment-based configuration

## 📞 Support

For technical support or business inquiries, please refer to the project documentation or contact the development team.

---

**ShelfCure** - Revolutionizing pharmacy management with modern technology.
