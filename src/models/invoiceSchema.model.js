/**
 * Invoice Schema Model
 * Last updated: 2025-07-15 14:35:00
 * Author: sayanm085
 */

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const { Schema } = mongoose;

// Service item schema
const serviceSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    default: 1,
    min: [0.01, 'Quantity must be at least 0.01']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  hsnSacCode: {
    type: String,
    trim: true
  },
  taxRate: {
    type: Number,
    default: 18 // Default GST rate
  }
}, { _id: true });

// GST schema
const gstSchema = new Schema({
  cgst: {
    rate: {
      type: Number,
      default: 9 // Default CGST rate
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  sgst: {
    rate: {
      type: Number,
      default: 9 // Default SGST rate
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  igst: {
    rate: {
      type: Number,
      default: 0 // Default IGST rate (set dynamically)
    },
    amount: {
      type: Number,
      default: 0
    }
  }
}, { _id: false });

// Enhanced Seller Details schema
const sellerDetailsSchema = new Schema({
  name: {
    type: String,
    default: "Sayan Mondal",
    trim: true
  },
  companyName: {
    type: String,
    default: "Shotlin",
    trim: true
  },
  address: {
    type: String,
    default: "379/N, BANIPUR PALPARA WARD 13 BANIPUR PALPARA S.N. DEY ROAD North 24 Parganas, West Bengal 743287, India",
    trim: true
  },
  gstNumber: {
    type: String,
    default: "AAHATPM4170HDC",
    validate: {
      validator: function(v) {
        // Accept the default GST number as valid or validate against standard format
        return v === "AAHATPM4170HDC" || 
               /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(v);
      },
      message: props => `${props.value} is not a valid GST Number!`
    },
    required: [true, 'Seller GST Number is required']
  },
  placeOfOrigin: {
    type: String,
    default: "West Bengal",
    trim: true
  },
  phone: {
    type: String,
    default: "+91 9876543210",
    trim: true
  },
  email: {
    type: String,
    default: "contact@shotlin.com",
    trim: true
  },
  website: {
    type: String,
    default: "https://shotlin.com",
    trim: true
  },
  logo: {
    type: String,
    trim: true
  }
}, { _id: false });

// Summary schema
const summarySchema = new Schema({
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
    default: 0
  },
  gst: {
    type: gstSchema,
    default: () => ({})
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    default: 0
  },
  amountInWords: String,
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
    trim: true
  }
}, { _id: false });

// Bank details schema
const bankDetailsSchema = new Schema({
  accountName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  branch: {
    type: String,
    trim: true
  }
}, { _id: false });

// Signature schema
const signatureSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  signaturePresent: {
    type: Boolean,
    default: false
  },
  signatureImagePath: {
    type: String,
    trim: true
  }
}, { _id: false });

// Location schema
const locationSchema = new Schema({
  placeOfSupply: {
    type: String,
    required: true,
    trim: true
  },
  countryOfSupply: {
    type: String,
    default: 'India',
    trim: true
  }
}, { _id: false });

// Payment schema - ENHANCED with better tracking
const paymentSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  terms: {
    type: String,
    default: 'Due on receipt',
    trim: true
  },
  method: {
    type: String,
    trim: true
  },
  bankDetails: {
    type: bankDetailsSchema,
    default: () => ({})
  },
  partialPayments: [{
    amount: Number,
    date: Date,
    reference: String,
    notes: String,
    paymentMethod: String
  }],
  totalPaid: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: function() {
      return this.parent().summary?.total || 0;
    }
  },
  lastPaymentDate: Date
}, { _id: false });

// NEW: Payment Relationship Schema - to track relationships between invoices
const paymentRelationshipSchema = new Schema({
  // Original quotation reference
  originalQuotation: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  
  // For advance invoices: percentage of the original quote
  advancePaymentPercent: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // For final invoices: reference to any advance invoices
  advanceInvoices: [{
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice'
    },
    amount: Number,
    percent: Number,
    date: Date
  }],
  
  // For advance invoices: reference to final invoice (if created)
  finalInvoice: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  
  // For any invoice type: original quotation total amount
  originalQuotationAmount: Number,
  
  // Payment description (for display in invoice)
  paymentDescription: {
    type: String,
    trim: true
  }
}, { _id: false });

// Main Invoice Schema
const invoiceSchema = new Schema({
  // Invoice Type and Core Details
  type: {
    type: String,
    enum: ['quotation', 'advance', 'final'],
    required: [true, 'Invoice type is required']
  },
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
    index: true
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return this.type !== 'final' || !!v;
      },
      message: 'Due date is required for final invoices'
    }
  },
  expectedDeliveryDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return this.type !== 'quotation' || !!v;
      },
      message: 'Expected delivery date is required for quotations'
    }
  },
  
  // Client & Project References (instead of embedding)
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client reference is required']
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  
  // Project info (in case project reference isn't available)
  projectDetails: {
    name: {
      type: String,
      required: function() { return !this.project; }
    },
    description: String
  },
  
  // Enhanced seller details
  sellerDetails: {
    type: sellerDetailsSchema,
    default: () => ({
      name: "Sayan Mondal",
      companyName: "Shotlin",
      address: "379/N, BANIPUR PALPARA WARD 13 BANIPUR PALPARA S.N. DEY ROAD North 24 Parganas, West Bengal 743287, India",
      gstNumber: "AAHATPM4170HDC",
      placeOfOrigin: "West Bengal",
      phone: "+91 9876543210",
      email: "contact@shotlin.com",
      website: "https://shotlin.com"
    })
  },
  
  // Location Details
  location: {
    type: locationSchema,
    required: true,
    default: () => ({
      countryOfSupply: 'India'
    })
  },
  
  // Service Details
  services: {
    type: [serviceSchema],
    required: [true, 'At least one service item is required'],
    validate: {
      validator: function(services) {
        return services.length > 0;
      },
      message: 'At least one service item is required'
    }
  },
  
  // Financial Summary
  summary: {
    type: summarySchema,
    default: () => ({
      subtotal: 0,
      total: 0,
      discount: 0,
      currency: 'INR'
    })
  },
  
  // Payment Details - Enhanced
  payment: {
    type: paymentSchema,
    default: () => ({})
  },
  
  // NEW: Payment relationship tracking
  paymentRelationship: {
    type: paymentRelationshipSchema,
    default: () => ({})
  },
  
  // Terms & Conditions
  termsAndConditions: [String],
  
  // Additional Notes
  notes: {
    type: String,
    trim: true
  },
  
  // Authorized Signature
  authorizedSignature: {
    type: signatureSchema,
    default: () => ({})
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'rejected'],
    default: 'draft',
    index: true
  },
  
  // Soft delete flag
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Tracking for PDF generation
  pdfGenerated: {
    type: Boolean,
    default: false
  },
  pdfPath: {
    type: String,
    trim: true
  },
  
  // Discount details
  discountDetails: {
    discountId: {
      type: Schema.Types.ObjectId,
      ref: 'Discount'
    },
    code: String,
    discountAmount: Number
  }
}, {
  timestamps: true // This replaces the manual createdAt and updatedAt fields
});

// Store the pre-save hook as a named function for reference in calculateTotals
const calculateInvoiceTotals = async function(next) {
  try {
    // Calculate subtotal
    this.summary.subtotal = this.services.reduce((total, service) => 
      total + (service.unitPrice * service.quantity), 0);
    
    // Get seller state from enhanced seller details
    const sellerState = this.sellerDetails?.placeOfOrigin || '';
    
    // Calculate GST based on place of supply
    if (this.location.placeOfSupply === sellerState) {
      // Same state - CGST + SGST
      this.summary.gst.cgst.amount = (this.summary.subtotal * this.summary.gst.cgst.rate) / 100;
      this.summary.gst.sgst.amount = (this.summary.subtotal * this.summary.gst.sgst.rate) / 100;
      this.summary.gst.igst.amount = 0;
      this.summary.gst.igst.rate = 0;
    } else {
      // Different state - IGST
      const totalRate = this.summary.gst.cgst.rate + this.summary.gst.sgst.rate;
      this.summary.gst.igst.rate = totalRate;
      this.summary.gst.igst.amount = (this.summary.subtotal * totalRate) / 100;
      this.summary.gst.cgst.amount = 0;
      this.summary.gst.sgst.amount = 0;
    }
    
    // Calculate total
    const totalGst = this.summary.gst.cgst.amount + this.summary.gst.sgst.amount + this.summary.gst.igst.amount;
    this.summary.total = this.summary.subtotal + totalGst - (this.summary.discount || 0);
    
    // Update payment.remainingAmount
    if (!this.isNew && this.payment) {
      this.payment.remainingAmount = this.summary.total - (this.payment.totalPaid || 0);
    }
    
    // Set payment description based on invoice type and payment relationship
    if (this.type === 'advance' && this.paymentRelationship && this.paymentRelationship.advancePaymentPercent) {
      // Add advance payment description
      this.paymentRelationship.paymentDescription = `Advance Payment (${this.paymentRelationship.advancePaymentPercent}%)`;
    } else if (this.type === 'final' && this.paymentRelationship && this.paymentRelationship.advanceInvoices && 
              this.paymentRelationship.advanceInvoices.length > 0) {
      // Add final payment description
      const totalAdvancePercent = this.paymentRelationship.advanceInvoices.reduce((total, adv) => total + (adv.percent || 0), 0);
      this.paymentRelationship.paymentDescription = `Final Payment (${100 - totalAdvancePercent}%)`;
    }
    
    if (next) next();
  } catch (error) {
    if (next) next(error);
    else throw error;
  }
};

// Calculate totals and GST before saving
invoiceSchema.pre('save', calculateInvoiceTotals);

// Method to calculate totals (for manual recalculation if needed)
invoiceSchema.methods.calculateTotals = async function() {
  // Directly call the calculation function
  await calculateInvoiceTotals.call(this);
  return this;
};

// Method to update payment status based on payment records
invoiceSchema.methods.updatePaymentStatus = function() {
  if (this.payment && this.payment.partialPayments && this.payment.partialPayments.length > 0) {
    // Calculate total paid amount
    const totalPaid = this.payment.partialPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    this.payment.totalPaid = totalPaid;
    this.payment.remainingAmount = this.summary.total - totalPaid;
    
    // Get the most recent payment date
    const dates = this.payment.partialPayments.map(p => p.date).filter(Boolean);
    if (dates.length > 0) {
      this.payment.lastPaymentDate = new Date(Math.max(...dates.map(d => d.getTime())));
    }
    
    // Update payment status
    if (this.payment.remainingAmount <= 0) {
      this.payment.status = 'completed';
      this.status = 'paid';
    } else if (this.payment.totalPaid > 0) {
      this.payment.status = 'partial';
    } else {
      this.payment.status = 'pending';
    }
  } else {
    this.payment.totalPaid = 0;
    this.payment.remainingAmount = this.summary.total;
    this.payment.status = 'pending';
  }
  
  return this;
};

// Create a new final invoice from an advance invoice and original quotation
invoiceSchema.statics.createFinalFromAdvance = async function(advanceInvoiceId, options = {}) {
  const AdvanceInvoice = this;
  
  // Find the advance invoice
  const advanceInvoice = await AdvanceInvoice.findById(advanceInvoiceId);
  if (!advanceInvoice) {
    throw new Error('Advance invoice not found');
  }
  
  if (advanceInvoice.type !== 'advance') {
    throw new Error('Selected invoice is not an advance payment invoice');
  }
  
  // Find the original quotation
  const originalQuotationId = advanceInvoice.paymentRelationship?.originalQuotation;
  if (!originalQuotationId) {
    throw new Error('Original quotation reference not found in advance invoice');
  }
  
  const originalQuotation = await AdvanceInvoice.findById(originalQuotationId);
  if (!originalQuotation) {
    throw new Error('Original quotation not found');
  }
  
  // Create the final invoice based on the original quotation
  const finalInvoiceData = originalQuotation.toObject();
  
  // Remove MongoDB specific fields
  delete finalInvoiceData._id;
  delete finalInvoiceData.__v;
  delete finalInvoiceData.createdAt;
  delete finalInvoiceData.updatedAt;
  
  // Update invoice specific fields
  finalInvoiceData.type = 'final';
  finalInvoiceData.invoiceNumber = options.invoiceNumber || await generateInvoiceNumber('final');
  finalInvoiceData.issueDate = new Date();
  
  // Set due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
  finalInvoiceData.dueDate = options.dueDate || dueDate;
  
  // Remove quotation specific fields
  delete finalInvoiceData.expectedDeliveryDate;
  
  // Set up payment relationship
  finalInvoiceData.paymentRelationship = {
    originalQuotation: originalQuotationId,
    originalQuotationAmount: originalQuotation.summary.total,
    advanceInvoices: [{
      invoice: advanceInvoiceId,
      amount: advanceInvoice.summary.total,
      percent: advanceInvoice.paymentRelationship?.advancePaymentPercent || 0,
      date: advanceInvoice.issueDate
    }]
  };
  
  // Adjust services for remaining amount (after advance payment)
  if (finalInvoiceData.services && finalInvoiceData.services.length > 0) {
    const advancePercent = advanceInvoice.paymentRelationship?.advancePaymentPercent || 0;
    const remainingPercent = 100 - advancePercent;
    
    finalInvoiceData.services = finalInvoiceData.services.map(service => {
      // Create a deep copy of the service
      const newService = {...service};
      
      // Apply remaining percentage to unit price
      newService.unitPrice = (service.unitPrice * remainingPercent) / 100;
      return newService;
    });
  }
  
  // Create and return the final invoice
  const finalInvoice = new AdvanceInvoice(finalInvoiceData);
  
  // Calculate totals
  await finalInvoice.calculateTotals();
  
  return finalInvoice;
};

// Add text search index
invoiceSchema.index({
  'invoiceNumber': 'text',
  'projectDetails.name': 'text',
  'services.name': 'text',
  'services.description': 'text',
  'sellerDetails.companyName': 'text'
}, {
  weights: {
    'invoiceNumber': 10,
    'projectDetails.name': 5,
    'sellerDetails.companyName': 5,
    'services.name': 3,
    'services.description': 1
  },
  name: "invoice_search_index"
});

// Add other useful indexes - removed organization-related indexes
invoiceSchema.index({ client: 1, issueDate: -1 });
invoiceSchema.index({ dueDate: 1, status: 1, isDeleted: false });
invoiceSchema.index({ type: 1, status: 1 });
// Add index for payment relationships
invoiceSchema.index({ 'paymentRelationship.originalQuotation': 1 });
invoiceSchema.index({ 'paymentRelationship.finalInvoice': 1 });

// Add pagination plugin
invoiceSchema.plugin(mongoosePaginate);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;