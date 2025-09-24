# ShelfCure Multi-Level Affiliate Referral Management System

## 🎯 Overview

The ShelfCure affiliate referral management system is a comprehensive 2-level affiliate structure that allows existing affiliates to refer new affiliates and earn commissions from their sales. The system enforces strict 2-level limitations and provides complete management tools for affiliates.

## 🏗️ System Architecture

### **Two-Level Commission Structure**

1. **Level 0 (Root Affiliates)**: Can refer Level 1 affiliates
2. **Level 1 (First-Level Referrals)**: Can refer Level 2 affiliates  
3. **Level 2 (Second-Level Referrals)**: Cannot refer anyone (maximum depth reached)

### **Commission Distribution Rules**

- **Selling Affiliate**: Always receives recurring commission (10% default)
- **Direct Referrer**: Receives one-time commission (5% default) 
- **No commissions beyond 2 levels**: System strictly enforces depth limitation

## 📊 Commission Examples

### Scenario 1: Level 1 Affiliate Makes Sale
```
Affiliate A (Level 0) → refers → Affiliate B (Level 1)
When B makes $1000 sale:
- B gets: $100 recurring commission (10%)
- A gets: $50 one-time commission (5%)
```

### Scenario 2: Level 2 Affiliate Makes Sale  
```
Affiliate A (Level 0) → refers → Affiliate B (Level 1) → refers → Affiliate C (Level 2)
When C makes $2000 sale:
- C gets: $200 recurring commission (10%)
- B gets: $100 one-time commission (5%)
- A gets: $0 (system limited to 2 levels)
```

## 🛠️ Backend Implementation

### **Database Models**

#### Enhanced Affiliate Model
```javascript
// Key fields added for referral management
referredBy: ObjectId,           // Who referred this affiliate
referralCode: String,           // Unique referral code
referralLevel: Number,          // 0, 1, or 2 (max depth)
referralCommission: {
  oneTimeRate: Number,          // Commission rate for referrals
  isActive: Boolean
}
```

#### AffiliateReferralInvitation Model
```javascript
// Tracks all referral invitations
referrer: ObjectId,             // Who sent the invitation
inviteeName: String,            // Invitee's name
inviteeEmail: String,           // Invitee's email
status: String,                 // sent, opened, registered, active, expired
invitationToken: String,        // Unique invitation token
conversionValue: Number,        // Value if converted
emailsSent: Number,             // Tracking email engagement
remindersSent: Number
```

#### Enhanced AffiliateCommission Model
```javascript
// Added fields for multi-level tracking
commissionLevel: Number,        // 1 or 2 (referral depth)
sellingAffiliate: ObjectId,     // Who made the actual sale
type: String                    // 'recurring' or 'referral_onetime'
```

### **API Endpoints**

#### Referral Management Routes (`/api/affiliate-panel/referrals/`)

1. **Dashboard**: `GET /dashboard`
   - Overview of referral performance
   - Invitation statistics and conversion rates
   - Recent commissions and earnings summary

2. **Send Invitation**: `POST /invite`
   - Send referral invitations via email
   - Validates referral level restrictions
   - Generates unique invitation links

3. **List Invitations**: `GET /invitations`
   - Paginated list of all sent invitations
   - Filter by status, search by name/email
   - Track invitation engagement

4. **Resend Invitation**: `POST /invitations/:id/resend`
   - Resend invitation reminders
   - Validates expiry and status

5. **Commission Details**: `GET /commissions`
   - Detailed commission breakdown
   - Filter by status, date range, affiliate
   - Summary statistics

6. **Analytics**: `GET /analytics`
   - Performance analytics with charts
   - Conversion funnel analysis
   - Top performing referrals

7. **Materials Generation**: `POST /materials`
   - Generate referral links, QR codes
   - Email templates and social media content
   - Customizable with personal messages

8. **Leaderboard**: `GET /leaderboard`
   - Ranking of top performing affiliates
   - Current affiliate's rank and stats
   - Period-based comparisons

#### QR Code Generation
- `GET /qr-codes/generate` - Generate QR code images
- `GET /qr-codes/download` - Download QR codes as PNG files

## 🎨 Frontend Implementation

### **React Components**

#### 1. AffiliateReferralDashboard
- **Location**: `shelfcure-frontend/src/pages/AffiliateReferralDashboard.jsx`
- **Features**:
  - Overview cards with key metrics
  - Quick action buttons for common tasks
  - Recent referrals and commissions lists
  - Referral level restrictions display

#### 2. AffiliateReferralInvite  
- **Location**: `shelfcure-frontend/src/pages/AffiliateReferralInvite.jsx`
- **Features**:
  - Invitation form with personal message
  - Success confirmation with shareable links
  - Copy and share functionality
  - Tips for successful referrals

#### 3. AffiliateReferralList
- **Location**: `shelfcure-frontend/src/pages/AffiliateReferralList.jsx`
- **Features**:
  - Paginated invitation list with filters
  - Status tracking and engagement metrics
  - Resend invitation functionality
  - Search and filter capabilities

#### 4. AffiliateReferralAnalytics
- **Location**: `shelfcure-frontend/src/pages/AffiliateReferralAnalytics.jsx`
- **Features**:
  - Conversion funnel visualization
  - Performance comparison charts
  - Top referrals leaderboard
  - Period-based analytics

#### 5. AffiliateReferralMaterials
- **Location**: `shelfcure-frontend/src/pages/AffiliateReferralMaterials.jsx`
- **Features**:
  - Tabbed interface for different material types
  - QR code generation and download
  - Email template customization
  - Social media content generation

## 🔒 Security & Validation

### **Referral Level Enforcement**
- Database-level validation prevents infinite referral chains
- API endpoints validate referral permissions
- Frontend components respect level restrictions

### **Invitation Security**
- Unique tokens for each invitation
- Expiry date validation
- Email verification requirements

### **Commission Integrity**
- Automated commission calculation
- Multi-level validation logic
- Audit trail for all transactions

## 📈 Key Features

### **For Affiliates**
1. **Easy Invitation Management**: Send, track, and resend invitations
2. **Performance Analytics**: Detailed insights into referral performance
3. **Marketing Materials**: QR codes, email templates, social media content
4. **Commission Tracking**: Real-time commission calculations and history
5. **Leaderboard**: Competitive ranking system

### **For Administrators**
1. **Multi-Level Oversight**: Complete visibility into referral hierarchies
2. **Commission Management**: Automated calculations with manual override
3. **Performance Monitoring**: System-wide analytics and reporting
4. **Fraud Prevention**: Built-in validation and audit trails

## 🧪 Testing

### **Comprehensive Test Suite**
- **Location**: `shelfcure-backend/tests/referralManagement.test.js`
- **Coverage**:
  - Multi-level commission calculations
  - Referral level restrictions
  - Invitation management workflows
  - Analytics and reporting accuracy
  - Security validations

## 🚀 Usage Examples

### **Sending a Referral Invitation**
```javascript
// Frontend API call
const response = await fetch('/api/affiliate-panel/referrals/invite', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inviteeName: 'John Doe',
    inviteeEmail: 'john@example.com',
    personalMessage: 'Join our amazing affiliate program!',
    referralSource: 'email'
  })
});
```

### **Generating Referral Materials**
```javascript
// Generate QR code and promotional content
const materials = await fetch('/api/affiliate-panel/referrals/materials', {
  method: 'POST',
  body: JSON.stringify({
    type: 'qr_code',
    customMessage: 'Scan to join!',
    campaign: 'summer2024'
  })
});
```

## 📋 Installation & Setup

### **Backend Dependencies**
```bash
cd shelfcure-backend
npm install qrcode  # For QR code generation
```

### **Environment Variables**
```env
FRONTEND_URL=http://localhost:3000  # For referral link generation
```

## 🎯 Benefits

1. **Scalable Growth**: Affiliates can build their own referral networks
2. **Controlled Depth**: 2-level limitation prevents pyramid scheme issues  
3. **Fair Compensation**: Clear commission structure for all participants
4. **Complete Tracking**: Full visibility into referral performance
5. **Professional Tools**: Marketing materials and analytics for success

## 🔄 Future Enhancements

1. **Advanced Analytics**: Machine learning insights for referral optimization
2. **Mobile App**: Dedicated mobile interface for affiliate management
3. **Integration APIs**: Third-party CRM and marketing tool integrations
4. **Gamification**: Achievement badges and milestone rewards
5. **Advanced Segmentation**: Targeted campaigns based on affiliate performance

---

This comprehensive multi-level affiliate referral management system provides ShelfCure with a powerful tool for organic growth while maintaining strict controls and providing excellent user experience for all affiliates.
