import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, Gift, ArrowRight, AlertCircle, CheckCircle, Building, MapPin, Calendar } from 'lucide-react';
import { createPhoneInputHandler } from '../../utils/inputValidation';

const RegisterFormSection = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1: Personal Details
  const [personalData, setPersonalData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });

  // Step 2: Business Details
  const [businessData, setBusinessData] = useState({
    storeName: '',
    storeType: 'pharmacy',
    address: '',
    city: '',
    state: '',
    pincode: '',
    licenseNumber: '',
    gstNumber: '',
    establishedYear: ''
  });

  const handlePersonalDataChange = (e) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBusinessDataChange = (e) => {
    const { name, value } = e.target;
    setBusinessData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePersonalDetails = () => {
    const newErrors = {};
    
    if (!personalData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!personalData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(personalData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!personalData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(personalData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!personalData.password) {
      newErrors.password = 'Password is required';
    } else if (personalData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!personalData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (personalData.password !== personalData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBusinessDetails = () => {
    const newErrors = {};
    
    if (!businessData.storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    }
    
    if (!businessData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!businessData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!businessData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!businessData.pincode) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(businessData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validatePersonalDetails()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBusinessDetails()) return;
    
    setIsLoading(true);
    
    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false);
      console.log('Registration successful:', { ...personalData, ...businessData });
      // Redirect to dashboard or success page would happen here
    }, 3000);
  };

  const storeTypes = [
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'medical_store', label: 'Medical Store' },
    { value: 'clinic_pharmacy', label: 'Clinic Pharmacy' },
    { value: 'hospital_pharmacy', label: 'Hospital Pharmacy' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                {/* Step 1 */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 1 ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > 1 ? <CheckCircle className="w-6 h-6" /> : '1'}
                </div>
                <div className={`w-20 h-1 mx-4 ${currentStep > 1 ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                
                {/* Step 2 */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 2 ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 text-gray-400'
                }`}>
                  2
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                {currentStep === 1 ? 'Personal Details' : 'Business Details'}
              </h2>
              <p className="text-secondary-600">
                {currentStep === 1 
                  ? 'Let\'s start with your personal information' 
                  : 'Now tell us about your store'
                }
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
            {currentStep === 1 ? (
              /* Step 1: Personal Details Form */
              <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={personalData.fullName}
                    onChange={handlePersonalDataChange}
                    className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                      errors.fullName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email and Phone */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={personalData.email}
                      onChange={handlePersonalDataChange}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={personalData.phone}
                      onChange={createPhoneInputHandler(
                        (value) => setPersonalData(prev => ({ ...prev, phone: value }))
                      )}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+91 12345 67890"
                    />
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={personalData.password}
                        onChange={handlePersonalDataChange}
                        className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white pr-12 ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={personalData.confirmPassword}
                        onChange={handlePersonalDataChange}
                        className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white pr-12 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Referral Code */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                    Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    value={personalData.referralCode}
                    onChange={handlePersonalDataChange}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter referral code if you have one"
                  />
                  <p className="mt-2 text-sm text-secondary-500">
                    💡 Have a referral code? Get additional benefits on your subscription!
                  </p>
                </div>

                {/* Next Button */}
                <button
                  type="submit"
                  className="btn-primary w-full justify-center text-lg py-4"
                >
                  Continue to Business Details
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            ) : (
              /* Step 2: Business Details Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Store Name and Type */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      name="storeName"
                      value={businessData.storeName}
                      onChange={handleBusinessDataChange}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                        errors.storeName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Your pharmacy/store name"
                    />
                    {errors.storeName && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.storeName}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      Store Type *
                    </label>
                    <select
                      name="storeType"
                      value={businessData.storeType}
                      onChange={handleBusinessDataChange}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      {storeTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                    Store Address *
                  </label>
                  <textarea
                    name="address"
                    value={businessData.address}
                    onChange={handleBusinessDataChange}
                    rows={3}
                    className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none bg-white ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your complete store address"
                  />
                  {errors.address && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* City, State, Pincode */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={businessData.city}
                      onChange={handleBusinessDataChange}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.city}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={businessData.state}
                      onChange={handleBusinessDataChange}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                        errors.state ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="State"
                    />
                    {errors.state && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.state}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={businessData.pincode}
                      onChange={handleBusinessDataChange}
                      className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white ${
                        errors.pincode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="123456"
                    />
                    {errors.pincode && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.pincode}
                      </p>
                    )}
                  </div>
                </div>

                {/* License and GST */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      Drug License Number
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={businessData.licenseNumber}
                      onChange={handleBusinessDataChange}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                      placeholder="DL-XXXXXXXX"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={businessData.gstNumber}
                      onChange={handleBusinessDataChange}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                      placeholder="GSTIN Number"
                    />
                  </div>
                </div>

                {/* Established Year */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-3 text-left">
                    Year Established
                  </label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={businessData.establishedYear}
                    onChange={handleBusinessDataChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="2020"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="btn-secondary flex-1 justify-center text-lg py-4"
                  >
                    Back to Personal Details
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex-1 justify-center text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Store Account
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-secondary-600">
              Already have an account?{' '}
              <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterFormSection;
