const mongoose = require('mongoose');

const pharmacySubmissionSchema = new mongoose.Schema({
  // Affiliate Information
  affiliate: {
    type: mongoose.Schema.ObjectId,
    ref: 'Affiliate',
    required: [true, 'Affiliate is required'],
    index: true
  },
  affiliateCode: {
    type: String,
    required: true
  },
  
  // Submission ID (auto-generated)
  submissionId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Pharmacy Details
  pharmacyName: {
    type: String,
    required: [true, 'Pharmacy name is required'],
    trim: true,
    maxlength: [100, 'Pharmacy name cannot be more than 100 characters']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true,
    maxlength: [100, 'Owner name cannot be more than 100 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please add a valid contact number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[1-9][0-9]{5}$/, 'Please add a valid pincode']
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Subscription Information
  subscriptionPlan: {
    type: String,
    required: [true, 'Subscription plan is required'],
    enum: ['basic', 'standard', 'premium', 'enterprise']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  billingDuration: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  
  // Documents
  documents: {
    pharmacyLicense: {
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      url: String,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    gstCertificate: {
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      url: String,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }
  },
  
  // Additional Information
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot be more than 500 characters']
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'activated', 'rejected'],
    default: 'pending'
  },
  
  // Dates
  submittedDate: {
    type: Date,
    default: Date.now
  },
  reviewedDate: Date,
  approvedDate: Date,
  activatedDate: Date,
  rejectedDate: Date,
  
  // Admin Actions
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  rejectedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot be more than 1000 characters']
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot be more than 500 characters']
  },
  
  // Generated Store Owner and Store Information (after approval)
  generatedStoreOwner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  generatedStore: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store'
  },
  generatedSubscription: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subscription'
  },
  
  // Login Credentials (generated after approval)
  generatedCredentials: {
    username: String,
    temporaryPassword: String,
    passwordSent: {
      type: Boolean,
      default: false
    },
    credentialsSentDate: Date
  },
  
  // Commission Information
  commissionEligible: {
    type: Boolean,
    default: true
  },
  commissionGenerated: {
    type: Boolean,
    default: false
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  
  // Tracking
  ipAddress: String,
  userAgent: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Affiliate'
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
pharmacySubmissionSchema.index({ affiliate: 1, status: 1 });
pharmacySubmissionSchema.index({ submissionId: 1 });
pharmacySubmissionSchema.index({ status: 1, submittedDate: -1 });
pharmacySubmissionSchema.index({ email: 1 });
pharmacySubmissionSchema.index({ contactNumber: 1 });

// Virtual for days since submission
pharmacySubmissionSchema.virtual('daysSinceSubmission').get(function() {
  return Math.floor((Date.now() - this.submittedDate) / (1000 * 60 * 60 * 24));
});

// Virtual for full address
pharmacySubmissionSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
});

// Pre-save middleware to generate submission ID
pharmacySubmissionSchema.pre('save', async function(next) {
  if (!this.submissionId) {
    let submissionId;
    let isUnique = false;

    while (!isUnique) {
      // Generate submission ID: PS + YYYYMM + 4 random digits
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      submissionId = `PS${year}${month}${randomPart}`;

      // Check if ID already exists
      const existingSubmission = await this.constructor.findOne({ submissionId });
      if (!existingSubmission) {
        isUnique = true;
      }
    }

    this.submissionId = submissionId;
  }

  // Set review/approval dates based on status changes
  if (this.isModified('status')) {
    const now = new Date();

    switch (this.status) {
      case 'under_review':
        if (!this.reviewedDate) this.reviewedDate = now;
        break;
      case 'approved':
        if (!this.approvedDate) this.approvedDate = now;
        break;
      case 'activated':
        if (!this.activatedDate) this.activatedDate = now;
        break;
      case 'rejected':
        if (!this.rejectedDate) this.rejectedDate = now;
        break;
    }
  }

  next();
});

// Static method to get status counts for affiliate
pharmacySubmissionSchema.statics.getStatusCounts = async function(affiliateId) {
  const counts = await this.aggregate([
    { $match: { affiliate: affiliateId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const statusCounts = {
    pending: 0,
    under_review: 0,
    approved: 0,
    activated: 0,
    rejected: 0,
    total: 0
  };

  counts.forEach(item => {
    statusCounts[item._id] = item.count;
    statusCounts.total += item.count;
  });

  return statusCounts;
};

// Static method to get recent submissions for affiliate
pharmacySubmissionSchema.statics.getRecentSubmissions = async function(affiliateId, limit = 5) {
  return await this.find({ affiliate: affiliateId })
    .sort({ submittedDate: -1 })
    .limit(limit)
    .select('submissionId pharmacyName status submittedDate');
};

module.exports = mongoose.model('PharmacySubmission', pharmacySubmissionSchema);
