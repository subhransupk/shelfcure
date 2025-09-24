import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '../utils/api';

const AffiliateRegistrationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    governmentIdType: '',
    governmentIdNumber: '',
    governmentIdDocument: null,
    profilePhoto: null,
    businessName: '',
    businessType: 'individual',
    street: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    color: 'red'
  });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [duplicateCheck, setDuplicateCheck] = useState({
    email: { checking: false, available: null },
    phone: { checking: false, available: null }
  });
  const [otpData, setOtpData] = useState({
    emailOtp: '',
    phoneOtp: '',
    emailVerified: false,
    phoneVerified: false,
    showEmailOtp: false,
    showPhoneOtp: false
  });

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let score = 0;
    let feedback = '';
    let color = 'red';

    if (password.length === 0) {
      return { score: 0, feedback: '', color: 'red' };
    }

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Common patterns (reduce score)
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 1; // Sequential patterns

    // Determine feedback and color
    if (score <= 2) {
      feedback = 'Weak - Add more characters, numbers, and symbols';
      color = 'red';
    } else if (score <= 4) {
      feedback = 'Fair - Consider adding more variety';
      color = 'yellow';
    } else if (score <= 5) {
      feedback = 'Good - Strong password';
      color = 'green';
    } else {
      feedback = 'Excellent - Very strong password';
      color = 'green';
    }

    return { score: Math.max(0, Math.min(6, score)), feedback, color };
  };

  // Duplicate check function
  const checkDuplicate = async (field, value) => {
    if (!value || value.length < 3) return;

    setDuplicateCheck(prev => ({
      ...prev,
      [field]: { checking: true, available: null }
    }));

    try {
      const response = await api.post('/api/affiliate-panel/check-duplicate', {
        field,
        value
      });

      setDuplicateCheck(prev => ({
        ...prev,
        [field]: {
          checking: false,
          available: response.data.available
        }
      }));
    } catch (error) {
      console.error('Duplicate check error:', error);
      setDuplicateCheck(prev => ({
        ...prev,
        [field]: { checking: false, available: null }
      }));
    }
  };

  // Debounced duplicate check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkDuplicate('email', formData.email);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.phone) {
        checkDuplicate('phone', formData.phone);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.phone]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      // Calculate password strength for password field
      if (name === 'password') {
        setPasswordStrength(calculatePasswordStrength(value));
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

      // Email validation
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      } else if (duplicateCheck.email.available === false) {
        newErrors.email = 'This email is already registered';
      }

      // Phone validation
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      } else if (duplicateCheck.phone.available === false) {
        newErrors.phone = 'This phone number is already registered';
      }

      // Enhanced password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (passwordStrength.score < 3) {
        newErrors.password = 'Password is too weak. Please use a stronger password';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

      // Validate age (18+)
      if (formData.dateOfBirth) {
        const age = Math.floor((new Date() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) {
          newErrors.dateOfBirth = 'You must be 18 years or older';
        }
      }
    }

    if (step === 2) {
      if (!formData.governmentIdType) newErrors.governmentIdType = 'Government ID type is required';
      if (!formData.governmentIdNumber.trim()) newErrors.governmentIdNumber = 'Government ID number is required';
      if (!formData.governmentIdDocument) newErrors.governmentIdDocument = 'Government ID document is required';
    }

    if (step === 3) {
      if (!formData.street.trim()) newErrors.street = 'Street address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
      if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    if (step === 4) {
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';
      if (!recaptchaToken) newErrors.recaptcha = 'Please complete the reCAPTCHA verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;

    setLoading(true);
    
    try {
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'governmentIdDocument' || key === 'profilePhoto') {
          if (formData[key]) {
            submitData.append(key, formData[key]);
          }
        } else if (key !== 'confirmPassword' && key !== 'agreeToTerms') {
          submitData.append(key, formData[key]);
        }
      });

      // Add reCAPTCHA token
      if (recaptchaToken) {
        submitData.append('recaptchaToken', recaptchaToken);
      }

      const response = await api.post('/api/affiliate-panel/register', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setCurrentStep(5); // Move to OTP verification step
        setOtpData(prev => ({
          ...prev,
          showEmailOtp: true,
          showPhoneOtp: true
        }));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        submit: error.response?.data?.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (type) => {
    try {
      const otpValue = type === 'email' ? otpData.emailOtp : otpData.phoneOtp;
      const endpoint = type === 'email' ? 'verify-email' : 'verify-phone';
      const payload = type === 'email' 
        ? { email: formData.email, otp: otpValue }
        : { phone: formData.phone, otp: otpValue };

      const response = await api.post(`/api/affiliate-panel/${endpoint}`, payload);

      if (response.data.success) {
        setOtpData(prev => ({
          ...prev,
          [`${type}Verified`]: true
        }));

        // If both are verified, show success message
        if ((type === 'email' && otpData.phoneVerified) || (type === 'phone' && otpData.emailVerified)) {
          setCurrentStep(6); // Success step
        }
      }
    } catch (error) {
      setErrors({
        [`${type}Otp`]: error.response?.data?.message || 'Invalid OTP'
      });
    }
  };

  const resendOtp = async (type) => {
    try {
      const payload = type === 'email' 
        ? { email: formData.email, type: 'email' }
        : { phone: formData.phone, type: 'phone' };

      await api.post('/api/affiliate-panel/resend-otp', payload);
      
      // Clear the OTP field
      setOtpData(prev => ({
        ...prev,
        [`${type}Otp`]: ''
      }));
    } catch (error) {
      setErrors({
        [`${type}Otp`]: error.response?.data?.message || 'Failed to resend OTP'
      });
    }
  };

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Government ID Verification</h2>
        <p className="text-gray-600 mt-2">Please provide your government ID for verification</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Government ID Type *
          </label>
          <select
            name="governmentIdType"
            value={formData.governmentIdType}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.governmentIdType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select ID type</option>
            <option value="aadhaar">Aadhaar Card</option>
            <option value="passport">Passport</option>
            <option value="voter_id">Voter ID</option>
            <option value="pan">PAN Card</option>
            <option value="driving_license">Driving License</option>
          </select>
          {errors.governmentIdType && <p className="text-red-500 text-sm mt-1">{errors.governmentIdType}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Government ID Number *
          </label>
          <input
            type="text"
            name="governmentIdNumber"
            value={formData.governmentIdNumber}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.governmentIdNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your ID number"
          />
          {errors.governmentIdNumber && <p className="text-red-500 text-sm mt-1">{errors.governmentIdNumber}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Government ID Document * (PDF, JPG, PNG - Max 5MB)
          </label>
          <input
            type="file"
            name="governmentIdDocument"
            onChange={handleInputChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.governmentIdDocument ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.governmentIdDocument && <p className="text-red-500 text-sm mt-1">{errors.governmentIdDocument}</p>}
          <p className="text-sm text-gray-500 mt-1">Upload a clear photo or scan of your government ID</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo (Optional)
          </label>
          <input
            type="file"
            name="profilePhoto"
            onChange={handleInputChange}
            accept="image/*"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-sm text-gray-500 mt-1">Upload a professional profile photo</p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Address & Business Information</h2>
        <p className="text-gray-600 mt-2">Please provide your address and business details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business/Company Name (Optional)
          </label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter your business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type
          </label>
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
            <option value="partnership">Partnership</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div></div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.street ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your street address"
          />
          {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your city"
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your state"
          />
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pincode *
          </label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.pincode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter 6-digit pincode"
            maxLength="6"
          />
          {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
        <p className="text-gray-600 mt-2">Please review and accept our terms</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">ShelfCure Affiliate Program Terms & Conditions</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            <strong>1. ELIGIBILITY</strong><br/>
            - Must be 18 years or older<br/>
            - Must provide valid government identification<br/>
            - Must have a valid bank account for payments<br/>
            - Must comply with all applicable laws and regulations
          </p>
          <p>
            <strong>2. COMMISSION STRUCTURE</strong><br/>
            - Earn recurring commissions on successful referrals<br/>
            - Commission rates vary based on subscription plans<br/>
            - Payments are processed monthly<br/>
            - Minimum payout threshold applies
          </p>
          <p>
            <strong>3. RESPONSIBILITIES</strong><br/>
            - Promote ShelfCure ethically and honestly<br/>
            - Do not engage in spam or misleading advertising<br/>
            - Maintain confidentiality of proprietary information<br/>
            - Report any issues or concerns promptly
          </p>
          <p>
            <strong>4. PAYMENT TERMS</strong><br/>
            - Commissions are paid within 30 days of the end of each month<br/>
            - Affiliates are responsible for any applicable taxes<br/>
            - ShelfCure reserves the right to withhold payments for policy violations
          </p>
          <p>
            <strong>5. TERMINATION</strong><br/>
            - Either party may terminate this agreement at any time<br/>
            - Outstanding commissions will be paid according to normal schedule<br/>
            - Terminated affiliates lose access to promotional materials
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          name="agreeToTerms"
          checked={formData.agreeToTerms}
          onChange={handleInputChange}
          className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label className="text-sm text-gray-700">
          I have read and agree to the ShelfCure Affiliate Program Terms & Conditions *
        </label>
      </div>
      {errors.agreeToTerms && <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>}

      {/* reCAPTCHA */}
      <div className="flex justify-center">
        <ReCAPTCHA
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"} // Test key
          onChange={(token) => setRecaptchaToken(token)}
          onExpired={() => setRecaptchaToken(null)}
          onError={() => setRecaptchaToken(null)}
        />
      </div>
      {errors.recaptcha && <p className="text-red-500 text-sm text-center">{errors.recaptcha}</p>}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600 mt-2">Please provide your basic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your first name"
          />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your last name"
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.email ? 'border-red-500' :
                duplicateCheck.email.available === false ? 'border-red-500' :
                duplicateCheck.email.available === true ? 'border-green-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
            />
            {/* Duplicate Check Indicator */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {duplicateCheck.email.checking ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              ) : duplicateCheck.email.available === true ? (
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : duplicateCheck.email.available === false ? (
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : null}
            </div>
          </div>
          {duplicateCheck.email.available === true && (
            <p className="text-green-600 text-sm mt-1">✓ Email is available</p>
          )}
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.phone ? 'border-red-500' :
                duplicateCheck.phone.available === false ? 'border-red-500' :
                duplicateCheck.phone.available === true ? 'border-green-500' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number"
            />
            {/* Duplicate Check Indicator */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {duplicateCheck.phone.checking ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              ) : duplicateCheck.phone.available === true ? (
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : duplicateCheck.phone.available === false ? (
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : null}
            </div>
          </div>
          {duplicateCheck.phone.available === true && (
            <p className="text-green-600 text-sm mt-1">✓ Phone number is available</p>
          )}
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Create a strong password (min 8 characters)"
          />

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.color === 'red' ? 'bg-red-500' :
                      passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  ></div>
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength.color === 'red' ? 'text-red-600' :
                  passwordStrength.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {passwordStrength.score <= 2 ? 'Weak' :
                   passwordStrength.score <= 4 ? 'Fair' :
                   passwordStrength.score <= 5 ? 'Good' : 'Excellent'}
                </span>
              </div>
              {passwordStrength.feedback && (
                <p className={`text-xs mt-1 ${
                  passwordStrength.color === 'red' ? 'text-red-600' :
                  passwordStrength.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {passwordStrength.feedback}
                </p>
              )}
            </div>
          )}

          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
          <p className="text-sm text-gray-500 mt-1">Applicants must be 18 years or older</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender (Optional)
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step <= currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Verify Your Contact Information</h2>
                <p className="text-gray-600 mt-2">We've sent OTP codes to your email and phone number</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email OTP */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📧</span>
                    Email Verification
                    {otpData.emailVerified && <span className="ml-2 text-green-500">✓</span>}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    OTP sent to: {formData.email}
                  </p>

                  {!otpData.emailVerified ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otpData.emailOtp}
                        onChange={(e) => setOtpData(prev => ({ ...prev, emailOtp: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        maxLength="6"
                      />
                      {errors.emailOtp && <p className="text-red-500 text-sm">{errors.emailOtp}</p>}

                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOtpVerification('email')}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                          Verify Email
                        </button>
                        <button
                          type="button"
                          onClick={() => resendOtp('email')}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Resend
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-green-600 font-medium">
                      ✓ Email verified successfully!
                    </div>
                  )}
                </div>

                {/* Phone OTP */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📱</span>
                    Phone Verification
                    {otpData.phoneVerified && <span className="ml-2 text-green-500">✓</span>}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    OTP sent to: {formData.phone}
                  </p>

                  {!otpData.phoneVerified ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otpData.phoneOtp}
                        onChange={(e) => setOtpData(prev => ({ ...prev, phoneOtp: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        maxLength="6"
                      />
                      {errors.phoneOtp && <p className="text-red-500 text-sm">{errors.phoneOtp}</p>}

                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOtpVerification('phone')}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                          Verify Phone
                        </button>
                        <button
                          type="button"
                          onClick={() => resendOtp('phone')}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Resend
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-green-600 font-medium">
                      ✓ Phone verified successfully!
                    </div>
                  )}
                </div>
              </div>

              {otpData.emailVerified && otpData.phoneVerified && (
                <div className="text-center">
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Both email and phone verified successfully! Redirecting to success page...
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">Application Submitted Successfully!</h2>
                <p className="text-gray-600 mt-2">
                  Thank you for applying to the ShelfCure Affiliate Program.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-left text-blue-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    Our admin team will review your application and documents
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    You'll receive an email notification about the approval status
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    Once approved, you can access your affiliate dashboard
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    Start earning commissions by referring new pharmacy partners
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/affiliate-login')}
                  className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                >
                  Go to Affiliate Login
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
                >
                  Back to Homepage
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-md ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Previous
              </button>
              
              {currentStep === 4 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Next
                </button>
              )}
            </div>
          )}

          {errors.submit && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateRegistrationPage;
