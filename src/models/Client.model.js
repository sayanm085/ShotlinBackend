import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Client Model Definition
 * Last updated: 2025-07-14 19:01:32
 * Author: sayanm085
 */

/**
 * Address schema for structured address data
 */
const addressSchema = new Schema({
  street: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  postalCode: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
    default: 'India',
  },
}, { _id: false });

/**
 * Contact person schema for storing client representatives
 */
const contactPersonSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Contact person name is required'],
    trim: true,
  },
  position: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  phone: {
    type: String,
    trim: true,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

/**
 * Client schema definition
 */
const clientSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    index: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    sparse: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: addressSchema,
  gstin: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: (v) => !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v),
      message: props => `${props.value} is not a valid GSTIN!`
    }
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v),
      message: props => `${props.value} is not a valid PAN number!`
    }
  },
  contactPersons: [contactPersonSchema],
  clientType: {
    type: String,
    enum: ['individual', 'company', 'government', 'non-profit'],
    default: 'company',
  },
  paymentTerms: {
    type: Number, // Days
    default: 30,
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(v),
      message: props => `${props.value} is not a valid website URL!`
    }
  },
  notes: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect', 'archived'],
    default: 'active',
    index: true,
  },
  currency: {
    type: String,
    default: 'INR',
    trim: true,
    uppercase: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full address
clientSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.postalCode,
    this.address.country !== 'India' ? this.address.country : ''
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for primary contact person
clientSchema.virtual('primaryContact').get(function() {
  if (!this.contactPersons || !this.contactPersons.length) return null;
  return this.contactPersons.find(cp => cp.isPrimary) || this.contactPersons[0];
});

// Indexes for better performance - removed organization-related indexes
clientSchema.index({ name: 'text', 'address.city': 'text', 'contactPersons.name': 'text' });
clientSchema.index({ status: 1, isDeleted: 1 });
clientSchema.index({ createdAt: -1 });

// Middleware to ensure only one primary contact
clientSchema.pre('save', function(next) {
  if (this.contactPersons && this.contactPersons.length) {
    // If we have contact persons but no primary, set the first one as primary
    const hasPrimary = this.contactPersons.some(cp => cp.isPrimary);
    if (!hasPrimary && this.contactPersons.length > 0) {
      this.contactPersons[0].isPrimary = true;
    }
  }
  next();
});

/**
 * Static method to find active clients
 * @returns {Query} Mongoose query
 */
clientSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active',
    isDeleted: false
  });
};

/**
 * Get client's outstanding balance
 * @returns {Promise<Number>} Outstanding balance
 */
clientSchema.methods.getOutstandingBalance = async function() {
  const Invoice = mongoose.model('Invoice');
  const result = await Invoice.aggregate([
    {
      $match: {
        client: this._id,
        status: { $in: ['sent', 'viewed', 'overdue'] },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalOutstanding: { $sum: '$summary.total' }
      }
    }
  ]);
  
  return result.length ? result[0].totalOutstanding : 0;
};

/**
 * Client model
 */
const Client = mongoose.model('Client', clientSchema);

export default Client;