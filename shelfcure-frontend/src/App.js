import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import './styles/affiliate-panel-mobile.css';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import CreateUserPage from './pages/CreateUserPage';
import ViewUserPage from './pages/ViewUserPage';
import EditUserPage from './pages/EditUserPage';
import ViewStorePage from './pages/ViewStorePage';
import EditStorePage from './pages/EditStorePage';
import ViewSubscriptionPage from './pages/ViewSubscriptionPage';
import AdminStoresPage from './pages/AdminStoresPage';
import AdminSubscriptionsPage from './pages/AdminSubscriptionsPage';
import AdminSubscriptionPlansPage from './pages/AdminSubscriptionPlansPage';
import CreateSubscriptionPlanPage from './pages/CreateSubscriptionPlanPage';
import ViewSubscriptionPlanPage from './pages/ViewSubscriptionPlanPage';
import EditSubscriptionPlanPage from './pages/EditSubscriptionPlanPage';
import AdminInvoicesPage from './pages/AdminInvoicesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import ViewInvoicePage from './pages/ViewInvoicePage';
import EditInvoicePage from './pages/EditInvoicePage';
import AdminDiscountsPage from './pages/AdminDiscountsPage';
import CreateDiscountPage from './pages/CreateDiscountPage';
import ViewDiscountPage from './pages/ViewDiscountPage';
import EditDiscountPage from './pages/EditDiscountPage';
import AdminMasterMedicinesPage from './pages/AdminMasterMedicinesPage';
import AddMasterMedicinePage from './pages/AddMasterMedicinePage';
import ViewMasterMedicinePage from './pages/ViewMasterMedicinePage';
import EditMasterMedicinePage from './pages/EditMasterMedicinePage';
import LiveChatPage from './pages/LiveChatPage';
import AdminLiveChatPage from './pages/AdminLiveChatPage';
import AdminAffiliatesPage from './pages/AdminAffiliatesPage';
import CreateAffiliatePage from './pages/CreateAffiliatePage';
import ViewAffiliatePage from './pages/ViewAffiliatePage';
import EditAffiliatePage from './pages/EditAffiliatePage';

import AffiliateCommissionsPage from './pages/AffiliateCommissionsPage';
import CommissionDetailsPage from './pages/CommissionDetailsPage';
import AffiliateSettingsPage from './pages/AffiliateSettingsPage';

// Store Owner Pages
import StoreOwnerDashboard from './pages/StoreOwnerDashboard';
import StoreOwnerStoresPage from './pages/StoreOwnerStoresPage';
import StoreOwnerStaffPage from './pages/StoreOwnerStaffPage';
import StoreOwnerAnalyticsPage from './pages/StoreOwnerAnalyticsPage';
import StoreOwnerSubscriptionPage from './pages/StoreOwnerSubscriptionPage';
import StoreOwnerSettingsPage from './pages/StoreOwnerSettingsPage';
import CreateStorePage from './pages/CreateStorePage';
import StoreOwnerViewStorePage from './pages/StoreOwnerViewStorePage';
import StoreOwnerEditStorePage from './pages/StoreOwnerEditStorePage';

// Store Manager (Store Panel) Pages
import StoreManagerDashboard from './pages/StoreManagerDashboard';
import StoreManagerInventory from './pages/StoreManagerInventory';
import StoreManagerSales from './pages/StoreManagerSales';
import StoreManagerCustomers from './pages/StoreManagerCustomers';
import CustomerPurchaseHistory from './pages/CustomerPurchaseHistory';
import StoreManagerSuppliers from './pages/StoreManagerSuppliers';
import SupplierPurchaseHistory from './pages/SupplierPurchaseHistory';
import StoreManagerAnalytics from './pages/StoreManagerAnalytics';
import StoreManagerSettings from './pages/StoreManagerSettings';
import StoreManagerPurchases from './pages/StoreManagerPurchases';
import StoreManagerDoctors from './pages/StoreManagerDoctors';
import StoreManagerStaff from './pages/StoreManagerStaff';
import StoreManagerNotifications from './pages/StoreManagerNotifications';
import StoreManagerRackManagement from './pages/StoreManagerRackManagement';
import StoreManagerExpiryAlerts from './pages/StoreManagerExpiryAlerts';
import StoreManagerLowStock from './pages/StoreManagerLowStock';
import StaffMedicineSearch from './pages/StaffMedicineSearch';
import AddMedicineRequestPage from './pages/AddMedicineRequestPage';
import MedicineDetailsPage from './pages/MedicineDetailsPage';
import StoreManagerReturns from './pages/StoreManagerReturns';
import StoreManagerPurchaseReturns from './pages/StoreManagerPurchaseReturns';
import StoreManagerAIAssistant from './pages/StoreManagerAIAssistant';


// Affiliate Panel Pages
import AffiliateRegistrationPage from './pages/AffiliateRegistrationPage';
import AffiliateLoginPage from './pages/AffiliateLoginPage';
import AffiliateDashboard from './pages/AffiliateDashboard';
import AffiliateMyReferrals from './pages/AffiliateMyReferrals';
import AffiliateCommissionHistory from './pages/AffiliateCommissionHistory';
import AffiliatePaymentSettings from './pages/AffiliatePaymentSettings';
import AffiliateEditProfile from './pages/AffiliateEditProfile';
import AffiliateMarketingResources from './pages/AffiliateMarketingResources';
import AffiliateLinksQR from './pages/AffiliateLinksQR';
import AffiliateSalesAnalytics from './pages/AffiliateSalesAnalytics';
import AffiliatePharmacyOnboarding from './pages/AffiliatePharmacyOnboarding';
import AffiliateRenewalManagement from './pages/AffiliateRenewalManagement';
import AffiliateNotificationSettings from './pages/AffiliateNotificationSettings';
import AffiliateSupport from './pages/AffiliateSupport';
import AffiliateTraining from './pages/AffiliateTraining';
import AffiliateReferralDashboard from './pages/AffiliateReferralDashboard';
import AffiliateReferralInvite from './pages/AffiliateReferralInvite';
import AffiliateReferralList from './pages/AffiliateReferralList';
import AffiliateReferralAnalytics from './pages/AffiliateReferralAnalytics';
import AffiliateReferralMaterials from './pages/AffiliateReferralMaterials';

import AnalyticsPage from './pages/AnalyticsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminCustomPricingPage from './pages/AdminCustomPricingPage';
import AdminAssignSubscriptionPage from './pages/AdminAssignSubscriptionPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import './styles/store-panel.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/create" element={<CreateUserPage />} />
          <Route path="/admin/users/view/:id" element={<ViewUserPage />} />
          <Route path="/admin/users/edit/:id" element={<EditUserPage />} />
          <Route path="/admin/stores" element={<AdminStoresPage />} />
          <Route path="/admin/stores/:id" element={<ViewStorePage />} />
          <Route path="/admin/stores/edit/:id" element={<EditStorePage />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="/admin/subscriptions/:id" element={<ViewSubscriptionPage />} />
          <Route path="/admin/subscription-plans" element={<AdminSubscriptionPlansPage />} />
          <Route path="/admin/subscription-plans/create" element={<CreateSubscriptionPlanPage />} />
          <Route path="/admin/subscription-plans/:id" element={<ViewSubscriptionPlanPage />} />
          <Route path="/admin/subscription-plans/:id/edit" element={<EditSubscriptionPlanPage />} />
          <Route path="/admin/custom-pricing" element={<AdminCustomPricingPage />} />
          <Route path="/admin/assign-subscription" element={<AdminAssignSubscriptionPage />} />
          <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
          <Route path="/admin/invoices/create" element={<CreateInvoicePage />} />
          <Route path="/admin/invoices/:id" element={<ViewInvoicePage />} />
          <Route path="/admin/invoices/:id/edit" element={<EditInvoicePage />} />
          <Route path="/admin/discounts" element={<AdminDiscountsPage />} />
          <Route path="/admin/discounts/create" element={<CreateDiscountPage />} />
          <Route path="/admin/discounts/:id" element={<ViewDiscountPage />} />
          <Route path="/admin/discounts/:id/edit" element={<EditDiscountPage />} />
          <Route path="/admin/master-medicines" element={<AdminMasterMedicinesPage />} />
          <Route path="/admin/master-medicines/create" element={<AddMasterMedicinePage />} />
            <Route path="/admin/master-medicines/:id" element={<ViewMasterMedicinePage />} />
            <Route path="/admin/master-medicines/:id/edit" element={<EditMasterMedicinePage />} />
          <Route path="/admin/live-chat" element={<AdminLiveChatPage />} />
          <Route path="/admin/affiliates" element={<AdminAffiliatesPage />} />
          <Route path="/admin/affiliates/create" element={<CreateAffiliatePage />} />
          <Route path="/admin/affiliates/:id" element={<ViewAffiliatePage />} />
          <Route path="/admin/affiliates/edit/:id" element={<EditAffiliatePage />} />
          <Route path="/admin/affiliate-commissions" element={<AffiliateCommissionsPage />} />
          <Route path="/admin/affiliate-commissions/:id" element={<CommissionDetailsPage />} />
          <Route path="/admin/affiliate-settings" element={<AffiliateSettingsPage />} />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/live-chat" element={<LiveChatPage />} />

          {/* Store Owner Routes */}
          <Route path="/store-owner/dashboard" element={<StoreOwnerDashboard />} />
          <Route path="/store-owner/stores" element={<StoreOwnerStoresPage />} />
          <Route path="/store-owner/stores/create" element={<CreateStorePage />} />
          <Route path="/store-owner/stores/:id" element={<StoreOwnerViewStorePage />} />
          <Route path="/store-owner/stores/:id/edit" element={<StoreOwnerEditStorePage />} />
          <Route path="/store-owner/staff" element={<StoreOwnerStaffPage />} />
          <Route path="/store-owner/analytics" element={<StoreOwnerAnalyticsPage />} />
          <Route path="/store-owner/subscription" element={<StoreOwnerSubscriptionPage />} />
          <Route path="/store-owner/settings" element={<StoreOwnerSettingsPage />} />

          {/* Store Manager (Store Panel) Routes */}
          <Route path="/store-panel/dashboard" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerDashboard /></ProtectedRoute>} />
          <Route path="/store-panel/inventory" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerInventory /></ProtectedRoute>} />
          <Route path="/store-panel/inventory/medicine/:medicineId" element={<ProtectedRoute requiredRole="store_manager"><MedicineDetailsPage /></ProtectedRoute>} />
          <Route path="/store-panel/low-stock" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerLowStock /></ProtectedRoute>} />
          <Route path="/store-panel/rack-management" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerRackManagement /></ProtectedRoute>} />
          <Route path="/store-panel/sales" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerSales /></ProtectedRoute>} />
          <Route path="/store-panel/returns" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerReturns /></ProtectedRoute>} />
          <Route path="/store-panel/add-medicine-request" element={<ProtectedRoute requiredRole="store_manager"><AddMedicineRequestPage /></ProtectedRoute>} />
          <Route path="/store-panel/customers" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerCustomers /></ProtectedRoute>} />
          <Route path="/store-panel/customers/:customerId/history" element={<ProtectedRoute requiredRole="store_manager"><CustomerPurchaseHistory /></ProtectedRoute>} />
          <Route path="/store-panel/suppliers" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerSuppliers /></ProtectedRoute>} />
          <Route path="/store-panel/suppliers/:supplierId/purchase-history" element={<ProtectedRoute requiredRole="store_manager"><SupplierPurchaseHistory /></ProtectedRoute>} />
          <Route path="/store-panel/purchases" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerPurchases /></ProtectedRoute>} />
          <Route path="/store-panel/purchase-returns" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerPurchaseReturns /></ProtectedRoute>} />
          <Route path="/store-panel/expiry-alerts" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerExpiryAlerts /></ProtectedRoute>} />
          <Route path="/store-panel/doctors" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerDoctors /></ProtectedRoute>} />
          <Route path="/store-panel/staff" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerStaff /></ProtectedRoute>} />
          <Route path="/store-panel/analytics" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerAnalytics /></ProtectedRoute>} />
          <Route path="/store-panel/reports" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerAnalytics /></ProtectedRoute>} />
          <Route path="/store-panel/notifications" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerNotifications /></ProtectedRoute>} />
          <Route path="/store-panel/ai-assistant" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerAIAssistant /></ProtectedRoute>} />

          <Route path="/store-panel/settings" element={<ProtectedRoute requiredRole="store_manager"><StoreManagerSettings /></ProtectedRoute>} />

          {/* Staff Routes (for medicine location search) */}
          <Route path="/staff/medicine-search" element={<StaffMedicineSearch />} />

          {/* Affiliate Panel Routes */}
          <Route path="/affiliate-register" element={<AffiliateRegistrationPage />} />
          <Route path="/affiliate-login" element={<AffiliateLoginPage />} />
          <Route path="/affiliate-panel/dashboard" element={<AffiliateDashboard />} />
          <Route path="/affiliate-panel/referrals" element={<AffiliateReferralDashboard />} />
          <Route path="/affiliate-panel/commissions" element={<AffiliateCommissionHistory />} />
          <Route path="/affiliate-panel/payment-settings" element={<AffiliatePaymentSettings />} />
          <Route path="/affiliate-panel/profile" element={<AffiliateEditProfile />} />
          <Route path="/affiliate-panel/marketing-resources" element={<AffiliateMarketingResources />} />
          <Route path="/affiliate-panel/links-qr" element={<AffiliateLinksQR />} />
          <Route path="/affiliate-panel/analytics" element={<AffiliateSalesAnalytics />} />
          <Route path="/affiliate-panel/pharmacy-onboarding" element={<AffiliatePharmacyOnboarding />} />
          <Route path="/affiliate-panel/renewals" element={<AffiliateRenewalManagement />} />
          <Route path="/affiliate-panel/notifications" element={<AffiliateNotificationSettings />} />
          <Route path="/affiliate-panel/support" element={<AffiliateSupport />} />
          <Route path="/affiliate-panel/training" element={<AffiliateTraining />} />

          {/* Affiliate Referral Management Routes */}
          <Route path="/affiliate-panel/referral-management" element={<AffiliateReferralDashboard />} />
          <Route path="/affiliate-panel/referrals/invite" element={<AffiliateReferralInvite />} />
          <Route path="/affiliate-panel/referrals/list" element={<AffiliateReferralList />} />
          <Route path="/affiliate-panel/referrals/analytics" element={<AffiliateReferralAnalytics />} />
          <Route path="/affiliate-panel/referrals/materials" element={<AffiliateReferralMaterials />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
