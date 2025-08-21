import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
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
import StoreOwnerSettingsPage from './pages/StoreOwnerSettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminCustomPricingPage from './pages/AdminCustomPricingPage';
import AdminAssignSubscriptionPage from './pages/AdminAssignSubscriptionPage';
import './App.css';

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
          <Route path="/store-owner/settings" element={<StoreOwnerSettingsPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
