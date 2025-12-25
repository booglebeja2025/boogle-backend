const mongoose = require('mongoose');
const validator = require('validator');

const contactSchema = new mongoose.Schema({
  // Contact Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  
  // Message Details
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    minlength: [5, 'Subject must be at least 5 characters'],
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved', 'spam'],
    default: 'new'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Response Tracking
  responded: {
    type: Boolean,
    default: false
  },
  
  response: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  
  // Categories for better organization
  category: {
    type: String,
    enum: ['general', 'technical', 'billing', 'course', 'feedback', 'other'],
    default: 'general'
  },
  
  // Tags for quick filtering
  tags: [String]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1 });
contactSchema.index({ category: 1 });

// Virtual property for response time
contactSchema.virtual('responseTime').get(function() {
  if (this.respondedAt && this.createdAt) {
    return this.respondedAt - this.createdAt;
  }
  return null;
});

// Pre-save middleware
contactSchema.pre('save', function(next) {
  // Clean and format data before saving
  if (this.name) {
    this.name = this.name.trim().replace(/\s+/g, ' ');
  }
  if (this.subject) {
    this.subject = this.subject.trim();
  }
  if (this.message) {
    this.message = this.message.trim();
  }
  next();
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;