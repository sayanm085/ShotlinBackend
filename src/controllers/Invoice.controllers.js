import Invoice from '../models/invoiceSchema.model.js';
import Discount from '../models/Discount.model.js';
import Client from "../models/Client.model.js";
import Project from '../models/Project.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Invoice Controller
 * Last updated: 2025-07-15 14:52:13
 * Author: sayanm085
 */

const generateInvoiceNumber = async (type) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Define prefix based on invoice type
  const prefix = type === 'quotation' ? 'QUO' : 
                type === 'advance' ? 'ADV' : 'INV';
  
  // Find the latest invoice of this type in the current month
  const regex = new RegExp(`^${prefix}-${year}${month}-\\d{4}$`);
  const lastInvoice = await Invoice.findOne(
    { invoiceNumber: { $regex: regex } },
    { invoiceNumber: 1 },
    { sort: { invoiceNumber: -1 } }
  );
  
  // Extract the sequence number or start at 0001
  let sequenceNumber = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequenceNumber = lastSequence + 1;
  }
  
  // Format with leading zeros
  const formattedSequence = String(sequenceNumber).padStart(4, '0');
  
  return `${prefix}-${year}${month}-${formattedSequence}`;
};

/**
 * Convert number to Indian words format for invoice total amount
 */
const convertToWords = (amount) => {
  // Simple implementation - in production use a proper library
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  const formattedAmount = formatter.format(amount)
    .replace('₹', '')
    .trim();
  
  // Extremely simplified implementation - use a proper library in production
  const numberToWord = {
    0: 'Zero', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five',
    6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten',
    11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen',
    16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty',
    30: 'Thirty', 40: 'Forty', 50: 'Fifty', 60: 'Sixty',
    70: 'Seventy', 80: 'Eighty', 90: 'Ninety'
  };
  
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];
  
  // This is a simplified version - for a complete implementation use a library
  if (amount <= 20) return numberToWord[amount] + " Rupees Only";
  return formattedAmount + " Rupees Only"; // Simplified fallback
};

/**
 * Create a default project for the client if not provided
 * @param {ObjectId} clientId - Client ID to associate with the project
 * @param {Object} projectDetails - Basic project details (name, description)
 * @returns {Promise<Object>} Newly created project
 */
const createDefaultProject = async (clientId, projectDetails = {}) => {
  try {
    // Get client name to create better project name if needed
    let clientName = "Client";
    try {
      const client = await Client.findById(clientId).select('name');
      if (client && client.name) {
        clientName = client.name;
      }
    } catch (error) {
      console.warn("Could not fetch client name for project:", error.message);
    }
    
    // Create project with default values
    const project = new Project({
      name: projectDetails.name || `${clientName} Project`,
      description: projectDetails.description || `Default project created for invoice on ${new Date().toISOString().split('T')[0]}`,
      client: clientId,
      startDate: new Date(),
      status: 'active'
    });
    
    await project.save();
    return project;
  } catch (error) {
    console.error("Error creating default project:", error);
    throw new Error("Failed to create default project");
  }
};

/**
 * Common validation function for all invoice types - fixed to not require calculated fields
 */
const validateInvoiceData = async (data, type) => {
  const errors = [];
  
  // Check if client exists
  if (!data.client) {
    errors.push('Client reference is required');
  } else {
    try {
      // Check if client ID is valid
      const clientExists = await Client.findById(data.client).select('_id name');
      if (!clientExists) {
        errors.push('The specified client does not exist');
      }
    } catch (error) {
      errors.push('Invalid client reference');
    }
  }
  
  // Check if project exists if provided (removed project requirement)
  if (data.project) {
    try {
      const projectExists = await Project.findById(data.project).select('_id name');
      if (!projectExists) {
        errors.push('The specified project does not exist');
      }
    } catch (error) {
      errors.push('Invalid project reference');
    }
  }
  
  // Location validation
  if (!data.location?.placeOfSupply) {
    errors.push('Place of supply is required');
  }
  
  // Seller details validation - with defaults if not provided
  if (data.sellerDetails) {
    // GST validation if provided and different from default
    if (data.sellerDetails.gstNumber && 
        data.sellerDetails.gstNumber !== "AAHATPM4170HDC" &&
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(data.sellerDetails.gstNumber)) {
      errors.push('Invalid GST number format');
    }
  }
  
  // Services validation
  if (!data.services || !Array.isArray(data.services) || data.services.length === 0) {
    errors.push('At least one service is required');
  } else {
    data.services.forEach((service, index) => {
      if (!service.name) errors.push(`Service #${index + 1}: Name is required`);
      if (service.unitPrice === undefined || service.unitPrice === null) {
        errors.push(`Service #${index + 1}: Unit price is required`);
      }
      // Don't require amount as we'll calculate it
      if (!service.quantity) service.quantity = 1; // Default quantity to 1 if not provided
    });
  }
  
  // Type-specific validation
  if (type === 'quotation' && !data.expectedDeliveryDate) {
    errors.push('Expected delivery date is required for quotations');
  }
  
  if (type === 'final' && !data.dueDate) {
    errors.push('Due date is required for final payment invoices');
  }
  
  return errors;
};

/**
 * Apply discount to invoice if valid
 * Helper function for all invoice creation endpoints
 */
const applyDiscountToInvoice = async (invoice, discountCode, clientId = null) => {
  if (!discountCode) {
    return { success: true, discountApplied: false };
  }
  
  try {
    // Find the discount
    const discount = await Discount.findOne({ 
      code: discountCode.toUpperCase(),
      isActive: true
    });
    
    if (!discount) {
      return { 
        success: false, 
        error: "Invalid or inactive discount code" 
      };
    }
    
    const currentDate = new Date();
    
    // Check if discount is valid
    if (currentDate < discount.startDate || currentDate > discount.endDate) {
      return { 
        success: false, 
        error: "Discount code has expired or not yet active" 
      };
    }
    
    // Check usage limit
    if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
      return { 
        success: false, 
        error: "This discount has reached its usage limit" 
      };
    }
    
    // Check client applicability if clientId is provided
    if (clientId && 
        discount.applicableTo === 'specific_clients' && 
        discount.applicableClients && 
        discount.applicableClients.length > 0) {
      
      const applicableClientIds = discount.applicableClients.map(c => c.toString());
      
      if (!applicableClientIds.includes(clientId.toString())) {
        return { 
          success: false, 
          error: "Discount not applicable to this client" 
        };
      }
    }
    
    // Get the subtotal
    const orderAmount = invoice.summary.subtotal;
    
    // Check minimum order value
    if (discount.minimumOrderValue && orderAmount < discount.minimumOrderValue) {
      return { 
        success: false, 
        error: `Minimum order amount of ${discount.currency || 'INR'} ${discount.minimumOrderValue} required for this discount` 
      };
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    
    switch (discount.type) {
      case 'percentage':
        discountAmount = (orderAmount * discount.value) / 100;
        break;
        
      case 'flat':
        discountAmount = discount.value;
        break;
        
      case 'tiered':
        // Find the applicable tier
        const applicableTier = [...discount.tiers]
          .sort((a, b) => b.minimumValue - a.minimumValue)
          .find(tier => orderAmount >= tier.minimumValue);
          
        if (applicableTier) {
          discountAmount = applicableTier.isPercentage ? 
            (orderAmount * applicableTier.discountValue) / 100 : 
            applicableTier.discountValue;
        }
        break;
    }
    
    // Apply maximum discount cap if specified
    if (discount.maximumDiscountAmount && discountAmount > discount.maximumDiscountAmount) {
      discountAmount = discount.maximumDiscountAmount;
    }
    
    // Save the original discount value
    const originalDiscount = invoice.summary.discount || 0;
    
    // Apply the discount to the invoice
    invoice.summary.discount = originalDiscount + discountAmount;
    
    // Recalculate totals after applying discount
    invoice.calculateTotals();
    
    // Increment the discount usage count
    discount.usageCount += 1;
    await discount.save();
    
    // Store discount information for response
    const appliedDiscount = {
      discountId: discount._id,
      code: discount.code,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      discountAmount: discountAmount
    };
    
    // Add discount reference to the invoice
    invoice.discountDetails = {
      discountId: discount._id,
      code: discount.code,
      discountAmount: discountAmount
    };
    
    return { 
      success: true, 
      discountApplied: true, 
      discount: appliedDiscount 
    };
  } catch (error) {
    console.error("Error applying discount:", error);
    return { 
      success: false, 
      error: error.message || "Failed to apply discount code" 
    };
  }
};

/**
 * Set default seller details if not provided
 */
const setDefaultSellerDetails = (invoiceData) => {
  // If sellerDetails is not provided, the model will use defaults
  if (!invoiceData.sellerDetails) {
    return;
  }
  
  // Create default seller details
  const defaultSellerDetails = {
    name: "Sayan Mondal",
    companyName: "Shotlin",
    address: "379/N, BANIPUR PALPARA WARD 13 BANIPUR PALPARA S.N. DEY ROAD North 24 Parganas, West Bengal 743287, India",
    gstNumber: "AAHATPM4170HDC",
    placeOfOrigin: "West Bengal"
  };
  
  // Merge with provided details (provided details take precedence)
  invoiceData.sellerDetails = {
    ...defaultSellerDetails,
    ...invoiceData.sellerDetails
  };
};

/**
 * Create a quotation invoice
 * @route POST /api/v1/invoice/quotation
 * @access Private
 * @author sayanm085
 * @updated 2025-07-15 14:52:13
 */
export const createQuotation = asyncHandler(async (req, res) => {
  // Extract discount code if provided
  const { discountCode, ...invoiceData } = req.body;
  
  // Set the invoice type
  invoiceData.type = 'quotation';
  
  // Set default seller details if not fully provided
  setDefaultSellerDetails(invoiceData);
  
  // Calculate service amounts if needed
  if (invoiceData.services && Array.isArray(invoiceData.services)) {
    invoiceData.services.forEach(service => {
      // Calculate amount based on quantity and unitPrice
      service.quantity = service.quantity || 1;
      service.amount = service.quantity * service.unitPrice;
    });
  }
  
  // Initialize summary if not provided
  if (!invoiceData.summary) {
    invoiceData.summary = {
      discount: 0,
      currency: 'INR'
    };
  } else {
    // Keep discount if specified, otherwise set to 0
    invoiceData.summary.discount = invoiceData.summary.discount || 0;
    invoiceData.summary.currency = invoiceData.summary.currency || 'INR';
    // Remove any pre-calculated values that we'll recalculate
    delete invoiceData.summary.subtotal;
    delete invoiceData.summary.total;
    delete invoiceData.summary.amountInWords;
  }
  
  // Validate required fields for quotation
  const validationErrors = await validateInvoiceData(invoiceData, 'quotation');
  if (validationErrors.length > 0) {
    return res.status(400).json(
      new ApiResponse(400, { errors: validationErrors }, "Validation failed")
    );
  }
  
  try {
    // Create a default project if none is provided
    if (!invoiceData.project) {
      try {
        console.log("Creating default project for client:", invoiceData.client);
        const newProject = await createDefaultProject(
          invoiceData.client, 
          invoiceData.projectDetails || {}
        );
        
        // Set the project ID in the invoice data
        invoiceData.project = newProject._id;
        
        // Keep project details for reference even with project ID
        if (!invoiceData.projectDetails) {
          invoiceData.projectDetails = {
            name: newProject.name,
            description: newProject.description
          };
        }
        
        console.log("Created default project:", newProject._id);
      } catch (projectError) {
        console.error("Error creating default project:", projectError);
        // Continue without a project if creation fails
        // We'll still have projectDetails if provided
      }
    }
    
    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = await generateInvoiceNumber('quotation');
    }
    
    // Set default metadata
    invoiceData.status = invoiceData.status || 'draft';
    
    // Initialize payment relationship object for quotation
    invoiceData.paymentRelationship = {
      paymentDescription: 'Quotation'
    };
    
    // Create the invoice
    const quotation = new Invoice(invoiceData);
    
    // Calculate totals - using the mongoose model method
    await quotation.calculateTotals();
    
    // Apply discount if provided
    let discountResult = { discountApplied: false };
    
    if (discountCode) {
      // Get client ID
      const clientId = invoiceData.client;
      
      discountResult = await applyDiscountToInvoice(quotation, discountCode, clientId);
      
      if (!discountResult.success) {
        return res.status(400).json(
          new ApiResponse(400, null, discountResult.error)
        );
      }
    }
    
    // Generate amount in words
    quotation.summary.amountInWords = convertToWords(quotation.summary.total);
    
    await quotation.save();
    
    // Prepare response data
    const responseData = { quotation };
    
    // Add discount info to response if applied
    if (discountResult.discountApplied) {
      responseData.appliedDiscount = discountResult.discount;
    }
    
    return res.status(201).json(
      new ApiResponse(
        201, 
        responseData, 
        "Quotation created successfully"
      )
    );
  } catch (error) {
    console.error("Error creating quotation:", error);
    
    // Handle duplicate invoice number
    if (error.code === 11000 && error.keyPattern?.invoiceNumber) {
      return res.status(400).json(
        new ApiResponse(400, null, "Invoice number already exists")
      );
    }
    
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to create quotation")
    );
  }
});

/**
 * Create an advance payment invoice
 * @route POST /api/v1/invoice/advance
 * @access Private
 * @author sayanm085
 * @updated 2025-07-15 18:01:19
 */
export const createAdvancePayment = asyncHandler(async (req, res) => {
  // Extract discount code if provided
  const { discountCode, quotationId, advancepaymentpercent, ...invoiceData } = req.body;
  
  // Set the invoice type
  invoiceData.type = 'advance';
  
  // Validate advance payment percentage if provided
  if (advancepaymentpercent) {
    const percent = Number(advancepaymentpercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      return res.status(400).json(
        new ApiResponse(400, null, "Advance payment percentage must be a number between 1 and 100")
      );
    }
  }
  
  // Set default seller details if not fully provided
  setDefaultSellerDetails(invoiceData);
  
  // Initialize services and calculate amounts if needed
  if (invoiceData.services && Array.isArray(invoiceData.services)) {
    invoiceData.services.forEach(service => {
      // Calculate amount based on quantity and unitPrice
      service.quantity = service.quantity || 1;
      service.amount = service.quantity * service.unitPrice;
    });
  }
  
  // Initialize or clean summary
  if (!invoiceData.summary) {
    invoiceData.summary = {
      discount: 0,
      currency: 'INR'
    };
  } else {
    // Keep discount if specified, otherwise set to 0
    invoiceData.summary.discount = invoiceData.summary.discount || 0;
    invoiceData.summary.currency = invoiceData.summary.currency || 'INR';
    // Remove any pre-calculated values that we'll recalculate
    delete invoiceData.summary.subtotal;
    delete invoiceData.summary.total;
    delete invoiceData.summary.amountInWords;
  }
  
  // Validate required fields for advance payment
  const validationErrors = await validateInvoiceData(invoiceData, 'advance');
  if (validationErrors.length > 0) {
    return res.status(400).json(
      new ApiResponse(400, { errors: validationErrors }, "Validation failed")
    );
  }
  
  try {
    // If a quotation ID is provided, verify it exists and is valid
    let quotation = null;
    
    if (quotationId) {
      quotation = await Invoice.findById(quotationId);
      
      if (!quotation) {
        return res.status(404).json(
          new ApiResponse(404, null, "Referenced quotation not found")
        );
      }
      
      if (quotation.type !== 'quotation') {
        return res.status(400).json(
          new ApiResponse(400, null, "The referenced document is not a quotation")
        );
      }
    }
    
    // Create a default project if none is provided
    if (!invoiceData.project) {
      try {
        console.log("Creating default project for client:", invoiceData.client);
        const newProject = await createDefaultProject(
          invoiceData.client, 
          invoiceData.projectDetails || {}
        );
        
        // Set the project ID in the invoice data
        invoiceData.project = newProject._id;
        
        // Keep project details for reference even with project ID
        if (!invoiceData.projectDetails) {
          invoiceData.projectDetails = {
            name: newProject.name,
            description: newProject.description
          };
        }
        
        console.log("Created default project:", newProject._id);
      } catch (projectError) {
        console.error("Error creating default project:", projectError);
        // Continue without a project if creation fails
      }
    }
    
    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = await generateInvoiceNumber('advance');
    }
    
    // Set default metadata
    invoiceData.status = invoiceData.status || 'draft';
    
    // Setup payment relationship with default 30% if not specified
    const percent = Number(advancepaymentpercent) || 30;  // Changed default from 100% to 30%
    
    invoiceData.paymentRelationship = {
      advancePaymentPercent: percent,
      paymentDescription: `Advance Payment (${percent}%)`
    };
    
    // If there's a quotation, reference it and adjust service prices
    if (quotation) {
      invoiceData.paymentRelationship.originalQuotation = quotation._id;
      invoiceData.paymentRelationship.originalQuotationAmount = quotation.summary.total;
      
      // Calculate new amounts based on the advance percentage
      if (invoiceData.services && invoiceData.services.length > 0) {
        invoiceData.services = invoiceData.services.map(service => {
          // Create a deep copy of the service
          const newService = {...service};
          
          // Apply percentage to unit price
          newService.unitPrice = (service.unitPrice * percent) / 100;
          return newService;
        });
      }
    }
    
    // Create the invoice
    const advanceInvoice = new Invoice(invoiceData);
    
    // Always calculate totals
    await advanceInvoice.calculateTotals();
    
    // Apply discount if provided
    let discountResult = { discountApplied: false };
    
    if (discountCode) {
      // Get client ID if available
      const clientId = invoiceData.client;
      
      discountResult = await applyDiscountToInvoice(advanceInvoice, discountCode, clientId);
      
      if (!discountResult.success) {
        return res.status(400).json(
          new ApiResponse(400, null, discountResult.error)
        );
      }
    }
    
    // Generate amount in words
    advanceInvoice.summary.amountInWords = convertToWords(advanceInvoice.summary.total);
    
    await advanceInvoice.save();
    
    // Prepare response data
    const responseData = { 
      invoice: advanceInvoice,
      paymentDetails: {
        type: 'advance',
        percent: percent,
        description: advanceInvoice.paymentRelationship.paymentDescription
      }
    };
    
    // Add quotation info to response if referenced
    if (quotation) {
      responseData.quotationDetails = {
        id: quotation._id,
        number: quotation.invoiceNumber,
        total: quotation.summary.total
      };
    }
    
    // Add discount info to response if applied
    if (discountResult.discountApplied) {
      responseData.appliedDiscount = discountResult.discount;
    }
    
    return res.status(201).json(
      new ApiResponse(
        201, 
        responseData, 
        "Advance payment invoice created successfully"
      )
    );
  } catch (error) {
    console.error("Error creating advance payment invoice:", error);
    
    // Handle duplicate invoice number
    if (error.code === 11000 && error.keyPattern?.invoiceNumber) {
      return res.status(400).json(
        new ApiResponse(400, null, "Invoice number already exists")
      );
    }
    
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to create advance payment invoice")
    );
  }
});

/**
 * Create a final payment invoice
 * @route POST /api/v1/invoice/final
 * @access Private
 * @author sayanm085
 * @updated 2025-07-15 18:01:19
 */
export const createFinalPayment = asyncHandler(async (req, res) => {
  // Extract parameters
  const { discountCode, quotationId, advanceInvoiceIds, ...invoiceData } = req.body;
  
  // Set the invoice type
  invoiceData.type = 'final';
  
  // Set default seller details if not fully provided
  setDefaultSellerDetails(invoiceData);
  
  // Initialize services and calculate amounts if needed
  if (invoiceData.services && Array.isArray(invoiceData.services)) {
    invoiceData.services.forEach(service => {
      // Calculate amount based on quantity and unitPrice
      service.quantity = service.quantity || 1;
      service.amount = service.quantity * service.unitPrice;
    });
  }
  
  // Initialize or clean summary
  if (!invoiceData.summary) {
    invoiceData.summary = {
      discount: 0,
      currency: 'INR'
    };
  } else {
    // Keep discount if specified, otherwise set to 0
    invoiceData.summary.discount = invoiceData.summary.discount || 0;
    invoiceData.summary.currency = invoiceData.summary.currency || 'INR';
    // Remove any pre-calculated values that we'll recalculate
    delete invoiceData.summary.subtotal;
    delete invoiceData.summary.total;
    delete invoiceData.summary.amountInWords;
  }
  
  // Validate required fields for final payment
  const validationErrors = await validateInvoiceData(invoiceData, 'final');
  if (validationErrors.length > 0) {
    return res.status(400).json(
      new ApiResponse(400, { errors: validationErrors }, "Validation failed")
    );
  }
  
  try {
    // If quotation ID is provided, verify it exists and is valid
    let quotation = null;
    
    if (quotationId) {
      quotation = await Invoice.findById(quotationId);
      
      if (!quotation) {
        return res.status(404).json(
          new ApiResponse(404, null, "Referenced quotation not found")
        );
      }
      
      if (quotation.type !== 'quotation') {
        return res.status(400).json(
          new ApiResponse(400, null, "The referenced document is not a quotation")
        );
      }
    }
    
    // Find advance invoices if IDs are provided or if quotation ID is provided
    let advanceInvoices = [];
    let totalAdvanceAmount = 0;
    let totalAdvancePercent = 0;
    let outstandingAdvancePayments = 0; // To track unpaid advance amounts
    
    if (advanceInvoiceIds && Array.isArray(advanceInvoiceIds) && advanceInvoiceIds.length > 0) {
      // If explicit advance invoice IDs are provided, use them
      advanceInvoices = await Invoice.find({
        _id: { $in: advanceInvoiceIds },
        type: 'advance'
      }).select('_id invoiceNumber summary paymentRelationship issueDate payment');
    } else if (quotationId) {
      // Find advance invoices that reference this quotation
      advanceInvoices = await Invoice.find({
        'type': 'advance',
        'paymentRelationship.originalQuotation': quotationId,
        'isDeleted': false
      }).select('_id invoiceNumber summary paymentRelationship issueDate payment');
    }
    
    // Calculate total advance percent and amount
    if (advanceInvoices.length > 0) {
      advanceInvoices.forEach(invoice => {
        const advPercent = invoice.paymentRelationship?.advancePaymentPercent || 0;
        const advAmount = invoice.summary?.total || 0;
        
        totalAdvancePercent += advPercent;
        totalAdvanceAmount += advAmount;
        
        // Check for outstanding amounts
        const paymentStatus = invoice.payment?.status || 'pending';
        if (paymentStatus !== 'completed') {
          const paid = invoice.payment?.totalPaid || 0;
          const remaining = advAmount - paid;
          outstandingAdvancePayments += remaining;
        }
      });
      
      // Check if advance payment is already 100%
      if (totalAdvancePercent >= 100) {
        return res.status(400).json(
          new ApiResponse(400, null, "Total advance payment already covers 100% of the quotation. Cannot create final invoice.")
        );
      }
    }
    
    // Create a default project if none is provided
    if (!invoiceData.project) {
      try {
        console.log("Creating default project for client:", invoiceData.client);
        const newProject = await createDefaultProject(
          invoiceData.client, 
          invoiceData.projectDetails || {}
        );
        
        // Set the project ID in the invoice data
        invoiceData.project = newProject._id;
        
        // Keep project details for reference even with project ID
        if (!invoiceData.projectDetails) {
          invoiceData.projectDetails = {
            name: newProject.name,
            description: newProject.description
          };
        }
        
        console.log("Created default project:", newProject._id);
      } catch (projectError) {
        console.error("Error creating default project:", projectError);
        // Continue without a project if creation fails
      }
    }
    
    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = await generateInvoiceNumber('final');
    }
    
    // Set default metadata
    invoiceData.status = invoiceData.status || 'draft';
    
    // Setup payment relationship
    invoiceData.paymentRelationship = {};
    
    // If there's a quotation, reference it
    if (quotation) {
      invoiceData.paymentRelationship.originalQuotation = quotation._id;
      invoiceData.paymentRelationship.originalQuotationAmount = quotation.summary.total;
    }
    
    // Handle advance invoices if they exist
    if (advanceInvoices.length > 0) {
      // Calculate remaining percentage
      const remainingPercent = 100 - totalAdvancePercent;
      
      // Format advance invoice references
      const advanceInvoiceRefs = advanceInvoices.map(adv => ({
        invoice: adv._id,
        amount: adv.summary?.total || 0,
        percent: adv.paymentRelationship?.advancePaymentPercent || 0,
        date: adv.issueDate
      }));
      
      // Store advance invoice references
      invoiceData.paymentRelationship.advanceInvoices = advanceInvoiceRefs;
      
      // Set payment description
      invoiceData.paymentRelationship.paymentDescription = `Final Payment (${remainingPercent}%)`;
      
      // If quotation is available and services need to be adjusted for the remaining amount
      if (quotation && quotation.services && quotation.services.length > 0 && remainingPercent < 100) {
        // Use quotation services instead of provided ones to ensure accurate calculation
        invoiceData.services = quotation.services.map(service => {
          // Create a deep copy of the service
          const newService = {...service};
          
          // Apply remaining percentage to unit price
          newService.unitPrice = (service.unitPrice * remainingPercent) / 100;
          return newService;
        });
      }
      
      // Add note about outstanding advance payments if any
      if (outstandingAdvancePayments > 0) {
        invoiceData.notes = invoiceData.notes || '';
        invoiceData.notes += `\n\nNOTE: There are outstanding advance payments totaling ₹${outstandingAdvancePayments}.`;
      }
    } else {
      // No advance payments, this is a full payment
      invoiceData.paymentRelationship.paymentDescription = 'Full Payment (100%)';
    }
    
    // Create the invoice
    const finalInvoice = new Invoice(invoiceData);
    
    // Always calculate totals
    await finalInvoice.calculateTotals();
    
    // Apply discount if provided
    let discountResult = { discountApplied: false };
    
    if (discountCode) {
      // Get client ID if available
      const clientId = invoiceData.client;
      
      discountResult = await applyDiscountToInvoice(finalInvoice, discountCode, clientId);
      
      if (!discountResult.success) {
        return res.status(400).json(
          new ApiResponse(400, null, discountResult.error)
        );
      }
    }
    
    // Generate amount in words
    finalInvoice.summary.amountInWords = convertToWords(finalInvoice.summary.total);
    
    await finalInvoice.save();
    
    // Update advance invoices to reference this final invoice
    if (advanceInvoices.length > 0) {
      const updatePromises = advanceInvoices.map(advInv => 
        Invoice.findByIdAndUpdate(advInv._id, {
          'paymentRelationship.finalInvoice': finalInvoice._id
        })
      );
      
      await Promise.all(updatePromises);
    }
    
    // Calculate grand total (final invoice amount + any outstanding advance payments)
    const finalAmount = finalInvoice.summary.total;
    const grandTotal = finalAmount + outstandingAdvancePayments;
    
    // Prepare response data
    const responseData = { 
      invoice: finalInvoice,
      paymentDetails: {
        type: 'final',
        description: finalInvoice.paymentRelationship.paymentDescription,
        finalAmount: finalAmount,
        outstandingAdvanceAmount: outstandingAdvancePayments,
        grandTotal: grandTotal
      }
    };
    
    // Add advance invoice info if there are any
    if (advanceInvoices.length > 0) {
      responseData.advanceInvoices = advanceInvoices.map(ai => ({
        id: ai._id,
        number: ai.invoiceNumber,
        amount: ai.summary?.total,
        percent: ai.paymentRelationship?.advancePaymentPercent || 0,
        paymentStatus: ai.payment?.status || 'pending',
        remainingAmount: (ai.payment?.status !== 'completed') ? 
          (ai.summary?.total - (ai.payment?.totalPaid || 0)) : 0
      }));
      
      responseData.paymentDetails.remainingPercent = 100 - totalAdvancePercent;
      responseData.paymentDetails.totalAdvanceAmount = totalAdvanceAmount;
    }
    
    // Add quotation info to response if referenced
    if (quotation) {
      const quotationTotal = quotation.summary.total;
      const totalInvoicedAmount = totalAdvanceAmount + finalAmount;
      const remainingAmount = Math.max(0, quotationTotal - totalInvoicedAmount);
      
      responseData.quotationDetails = {
        id: quotation._id,
        number: quotation.invoiceNumber,
        total: quotationTotal,
        totalInvoiced: totalInvoicedAmount,
        remainingAmount: remainingAmount
      };
    }
    
    // Add discount info to response if applied
    if (discountResult.discountApplied) {
      responseData.appliedDiscount = discountResult.discount;
    }
    
    return res.status(201).json(
      new ApiResponse(
        201, 
        responseData, 
        "Final payment invoice created successfully"
      )
    );
  } catch (error) {
    console.error("Error creating final payment invoice:", error);
    
    // Handle duplicate invoice number
    if (error.code === 11000 && error.keyPattern?.invoiceNumber) {
      return res.status(400).json(
        new ApiResponse(400, null, "Invoice number already exists")
      );
    }
    
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to create final payment invoice")
    );
  }
});

/**
 * Create invoice from quotation
 * @route POST /api/v1/invoice/invoice-from-quotation
 * @access Private
 * @author sayanm085
 * @updated 2025-07-15 14:52:13
 */
export const createInvoiceFromQuotation = asyncHandler(async (req, res) => {
  const { quotationId, type, discountCode, advancepaymentpercent } = req.body;
  
  // Validate invoice type
  if (!['advance', 'final'].includes(type)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid invoice type. Must be 'advance' or 'final'")
    );
  }
  
  // Validate advance payment percentage if provided for advance invoice
  if (type === 'advance' && advancepaymentpercent) {
    const percent = Number(advancepaymentpercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      return res.status(400).json(
        new ApiResponse(400, null, "Advance payment percentage must be a number between 1 and 100")
      );
    }
  }
  
  try {
    // Find the quotation
    const quotation = await Invoice.findById(quotationId);
    
    if (!quotation) {
      return res.status(404).json(
        new ApiResponse(404, null, "Quotation not found")
      );
    }
    
    if (quotation.type !== 'quotation') {
      return res.status(400).json(
        new ApiResponse(400, null, "The specified document is not a quotation")
      );
    }
    
    // For final invoices, check if there are any advance invoices related to this quotation
    let advanceInvoices = [];
    let totalAdvancePercent = 0;
    let totalAdvanceAmount = 0;
    
    if (type === 'final') {
      // Find any advance invoices that reference this quotation
      advanceInvoices = await Invoice.find({
        'type': 'advance',
        'paymentRelationship.originalQuotation': quotationId,
        'isDeleted': false
      }).select('_id invoiceNumber summary paymentRelationship issueDate');
      
      // Calculate total advance percent and amount
      if (advanceInvoices.length > 0) {
        advanceInvoices.forEach(invoice => {
          const advPercent = invoice.paymentRelationship?.advancePaymentPercent || 0;
          const advAmount = invoice.summary?.total || 0;
          
          totalAdvancePercent += advPercent;
          totalAdvanceAmount += advAmount;
        });
        
        // Check if advance payment is already 100%
        if (totalAdvancePercent >= 100) {
          return res.status(400).json(
            new ApiResponse(400, null, "Total advance payment already covers 100% of the quotation. Cannot create final invoice.")
          );
        }
      }
    }
    
    // Create new invoice data based on quotation
    const invoiceData = quotation.toObject();
    
    // Remove MongoDB specific fields
    delete invoiceData._id;
    delete invoiceData.__v;
    delete invoiceData.createdAt;
    delete invoiceData.updatedAt;
    
    // Update fields for new invoice
    invoiceData.type = type;
    invoiceData.invoiceNumber = await generateInvoiceNumber(type);
    invoiceData.issueDate = new Date();
    
    // Remove quotation specific fields
    delete invoiceData.expectedDeliveryDate;
    
    // Initialize payment relationship structure
    invoiceData.paymentRelationship = {
      originalQuotation: quotationId,
      originalQuotationAmount: quotation.summary.total
    };
    
    // Add required fields based on invoice type
    if (type === 'final') {
      // Set due date to 30 days from now for final invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      invoiceData.dueDate = dueDate;
      
      // Handle advance invoices if they exist
      if (advanceInvoices.length > 0) {
        // Calculate remaining percentage
        const remainingPercent = 100 - totalAdvancePercent;
        
        // Format advance invoice references
        const advanceInvoiceRefs = advanceInvoices.map(adv => ({
          invoice: adv._id,
          amount: adv.summary?.total || 0,
          percent: adv.paymentRelationship?.advancePaymentPercent || 0,
          date: adv.issueDate
        }));
        
        // Store advance invoice references
        invoiceData.paymentRelationship.advanceInvoices = advanceInvoiceRefs;
        
        // Set payment description
        invoiceData.paymentRelationship.paymentDescription = `Final Payment (${remainingPercent}%)`;
        
        // Adjust services for remaining amount
        if (invoiceData.services && invoiceData.services.length > 0 && remainingPercent < 100) {
          invoiceData.services = invoiceData.services.map(service => {
            // Create a deep copy of the service
            const newService = {...service};
            
            // Apply remaining percentage to unit price
            newService.unitPrice = (service.unitPrice * remainingPercent) / 100;
            return newService;
          });
        }
      } else {
        // No advance payments, this is a full payment
        invoiceData.paymentRelationship.paymentDescription = 'Full Payment (100%)';
      }
    } else if (type === 'advance') {
      // Set due date to 7 days from now for advance invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      invoiceData.dueDate = dueDate;
      
      // Handle advance payment percentage
      const percent = Number(advancepaymentpercent) || 100;
      
      // Store advance payment percentage
      invoiceData.paymentRelationship.advancePaymentPercent = percent;
      
      // Set payment description
      invoiceData.paymentRelationship.paymentDescription = `Advance Payment (${percent}%)`;
      
      // Calculate new amounts based on the advance percentage
      if (invoiceData.services && invoiceData.services.length > 0) {
        invoiceData.services = invoiceData.services.map(service => {
          // Create a deep copy of the service
          const newService = {...service};
          
          // Apply percentage to unit price
          newService.unitPrice = (service.unitPrice * percent) / 100;
          return newService;
        });
      }
    }
    
    // Create the invoice
    const invoice = new Invoice(invoiceData);
    
    // Always recalculate totals before applying discount
    await invoice.calculateTotals();
    
    // Apply discount if provided
    let discountResult = { discountApplied: false };
    
    if (discountCode) {
      // Get client ID if available
      const clientId = invoiceData.client;
      
      discountResult = await applyDiscountToInvoice(invoice, discountCode, clientId);
      
      if (!discountResult.success) {
        return res.status(400).json(
          new ApiResponse(400, null, discountResult.error)
        );
      }
    }
    
    // Generate amount in words
    invoice.summary.amountInWords = convertToWords(invoice.summary.total);
    
    // Save the new invoice
    await invoice.save();
    
    // If this is a final invoice, update all advance invoices to reference this final invoice
    if (type === 'final' && advanceInvoices.length > 0) {
      const updatePromises = advanceInvoices.map(advInv => 
        Invoice.findByIdAndUpdate(advInv._id, {
          'paymentRelationship.finalInvoice': invoice._id
        })
      );
      
      await Promise.all(updatePromises);
    }
    
    // Prepare the response
    const responseData = {
      invoice,
      paymentDetails: {
        type: type,
        description: invoice.paymentRelationship.paymentDescription,
        quotation: {
          id: quotationId,
          number: quotation.invoiceNumber,
          total: quotation.summary.total
        }
      }
    };
    
    // Add type-specific details to response
    if (type === 'advance') {
      responseData.paymentDetails.percent = invoice.paymentRelationship.advancePaymentPercent;
    } else if (type === 'final') {
      if (advanceInvoices.length > 0) {
        responseData.paymentDetails.advanceInvoices = advanceInvoices.map(ai => ({
          id: ai._id,
          number: ai.invoiceNumber,
          amount: ai.summary?.total,
          percent: ai.paymentRelationship?.advancePaymentPercent || 0
        }));
        responseData.paymentDetails.remainingPercent = 100 - totalAdvancePercent;
        responseData.paymentDetails.totalAdvanceAmount = totalAdvanceAmount;
      }
    }
    
    // Add discount info if applied
    if (discountResult.discountApplied) {
      responseData.appliedDiscount = discountResult.discount;
    }
    
    return res.status(201).json(
      new ApiResponse(
        201, 
        responseData, 
        `${type.charAt(0).toUpperCase() + type.slice(1)} invoice created successfully from quotation`
      )
    );
  } catch (error) {
    console.error(`Error creating ${type} from quotation:`, error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || `Failed to create ${type} invoice`)
    );
  }
});

/**
 * Create a final invoice from an advance invoice
 * @route POST /api/v1/invoice/final-from-advance
 * @access Private
 * @author sayanm085
 * @updated 2025-07-15 15:52:14
 */
export const createInvoiceFromAdvance = asyncHandler(async (req, res) => {
  const { advanceInvoiceId, discountCode } = req.body;
  
  try {
    // Find the advance invoice
    const advanceInvoice = await Invoice.findById(advanceInvoiceId);
    
    if (!advanceInvoice) {
      return res.status(404).json(
        new ApiResponse(404, null, "Advance invoice not found")
      );
    }
    
    if (advanceInvoice.type !== 'advance') {
      return res.status(400).json(
        new ApiResponse(400, null, "The specified invoice is not an advance payment invoice")
      );
    }
    
    // Check if a final invoice already exists for this advance invoice
    if (advanceInvoice.paymentRelationship?.finalInvoice) {
      const existingFinalInvoice = await Invoice.findById(advanceInvoice.paymentRelationship.finalInvoice);
      
      if (existingFinalInvoice) {
        return res.status(400).json(
          new ApiResponse(400, {
            finalInvoiceId: existingFinalInvoice._id,
            finalInvoiceNumber: existingFinalInvoice.invoiceNumber
          }, "A final invoice already exists for this advance payment")
        );
      }
    }
    
    // Find the original quotation
    const quotationId = advanceInvoice.paymentRelationship?.originalQuotation;
    
    if (!quotationId) {
      return res.status(400).json(
        new ApiResponse(400, null, "This advance invoice is not linked to an original quotation")
      );
    }
    
    const quotation = await Invoice.findById(quotationId);
    
    if (!quotation) {
      return res.status(404).json(
        new ApiResponse(404, null, "Original quotation not found")
      );
    }
    
    // Get advance payment details
    const advancePercent = advanceInvoice.paymentRelationship?.advancePaymentPercent || 0;
    const advancePaymentStatus = advanceInvoice.payment?.status || 'pending';
    const advanceTotalPaid = advanceInvoice.payment?.totalPaid || 0;
    const advanceRemainingAmount = advanceInvoice.payment?.remainingAmount || advanceInvoice.summary.total;
    
    // Calculate remaining percentage and amount for final invoice
    const remainingPercent = 100 - advancePercent;
    
    // Check if there are other advance invoices for the same quotation
    const otherAdvanceInvoices = await Invoice.find({
      _id: { $ne: advanceInvoiceId },
      type: 'advance',
      'paymentRelationship.originalQuotation': quotationId,
      isDeleted: false
    }).select('_id invoiceNumber summary paymentRelationship');
    
    let totalAdvancePercent = advancePercent;
    let allAdvanceInvoices = [
      {
        invoice: advanceInvoice._id,
        amount: advanceInvoice.summary.total,
        percent: advancePercent,
        date: advanceInvoice.issueDate,
        paymentStatus: advancePaymentStatus,
        totalPaid: advanceTotalPaid,
        remainingAmount: advanceRemainingAmount
      }
    ];
    
    // Add other advance invoices and calculate total advance percentage
    if (otherAdvanceInvoices.length > 0) {
      otherAdvanceInvoices.forEach(inv => {
        const percent = inv.paymentRelationship?.advancePaymentPercent || 0;
        totalAdvancePercent += percent;
        
        allAdvanceInvoices.push({
          invoice: inv._id,
          amount: inv.summary.total,
          percent: percent,
          date: inv.issueDate,
          paymentStatus: inv.payment?.status || 'pending',
          totalPaid: inv.payment?.totalPaid || 0,
          remainingAmount: inv.payment?.remainingAmount || inv.summary.total
        });
      });
    }
    
    // Check if total advance percentage exceeds 100%
    if (totalAdvancePercent >= 100) {
      return res.status(400).json(
        new ApiResponse(400, {
          totalAdvancePercent,
          advanceInvoices: allAdvanceInvoices.map(inv => ({
            id: inv.invoice,
            percent: inv.percent
          }))
        }, "Total advance payment already covers 100% of the quotation. Cannot create final invoice.")
      );
    }
    
    // Calculate remaining percentage after all advance payments
    const finalRemainingPercent = 100 - totalAdvancePercent;
    
    // Create the final invoice based on the original quotation
    const finalInvoiceData = quotation.toObject();
    
    // Remove MongoDB specific fields
    delete finalInvoiceData._id;
    delete finalInvoiceData.__v;
    delete finalInvoiceData.createdAt;
    delete finalInvoiceData.updatedAt;
    
    // Update invoice specific fields
    finalInvoiceData.type = 'final';
    finalInvoiceData.invoiceNumber = await generateInvoiceNumber('final');
    finalInvoiceData.issueDate = new Date();
    
    // Set due date for final invoice (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    finalInvoiceData.dueDate = dueDate;
    
    // Remove quotation specific fields
    delete finalInvoiceData.expectedDeliveryDate;
    
    // Setup payment relationship
    finalInvoiceData.paymentRelationship = {
      originalQuotation: quotationId,
      originalQuotationAmount: quotation.summary.total,
      advanceInvoices: allAdvanceInvoices.map(inv => ({
        invoice: inv.invoice,
        amount: inv.amount,
        percent: inv.percent,
        date: inv.date
      })),
      paymentDescription: `Final Payment (${finalRemainingPercent}%)`
    };
    
    // Adjust service prices for the remaining percentage
    if (finalInvoiceData.services && finalInvoiceData.services.length > 0) {
      finalInvoiceData.services = finalInvoiceData.services.map(service => {
        // Create a deep copy of the service
        const newService = {...service};
        
        // Apply remaining percentage to unit price
        newService.unitPrice = (service.unitPrice * finalRemainingPercent) / 100;
        return newService;
      });
    }
    
    // Track advance payment dues in notes if any
    let advanceDueNotes = '';
    let totalAdvanceDue = 0;
    
    allAdvanceInvoices.forEach(adv => {
      if (adv.remainingAmount > 0) {
        totalAdvanceDue += adv.remainingAmount;
        advanceDueNotes += `Outstanding balance on ${adv.invoice}: ₹${adv.remainingAmount}. `;
      }
    });
    
    // Add note about advance payment dues if any
    if (totalAdvanceDue > 0) {
      finalInvoiceData.notes = finalInvoiceData.notes || '';
      finalInvoiceData.notes += `\n\nNOTE: There are outstanding advance payments totaling ₹${totalAdvanceDue}. ${advanceDueNotes}`;
    }
    
    // Create the final invoice
    const finalInvoice = new Invoice(finalInvoiceData);
    
    // Calculate totals
    await finalInvoice.calculateTotals();
    
    // Apply discount if provided
    let discountResult = { discountApplied: false };
    
    if (discountCode) {
      // Get client ID
      const clientId = finalInvoiceData.client;
      
      discountResult = await applyDiscountToInvoice(finalInvoice, discountCode, clientId);
      
      if (!discountResult.success) {
        return res.status(400).json(
          new ApiResponse(400, null, discountResult.error)
        );
      }
    }
    
    // Generate amount in words
    finalInvoice.summary.amountInWords = convertToWords(finalInvoice.summary.total);
    
    // Save the final invoice
    await finalInvoice.save();
    
    // Update all advance invoices to reference this final invoice
    const updatePromises = allAdvanceInvoices.map(adv =>
      Invoice.findByIdAndUpdate(adv.invoice, {
        'paymentRelationship.finalInvoice': finalInvoice._id
      })
    );
    
    await Promise.all(updatePromises);
    
    // Prepare response data
    const responseData = {
      invoice: finalInvoice,
      advanceInvoices: allAdvanceInvoices.map(adv => ({
        id: adv.invoice,
        amount: adv.amount,
        percent: adv.percent,
        paymentStatus: adv.paymentStatus,
        remainingAmount: adv.remainingAmount
      })),
      paymentDetails: {
        type: 'final',
        remainingPercent: finalRemainingPercent,
        totalAdvancePercent: totalAdvancePercent,
        description: finalInvoice.paymentRelationship.paymentDescription,
        totalAdvanceDue: totalAdvanceDue
      },
      quotation: {
        id: quotation._id,
        number: quotation.invoiceNumber,
        total: quotation.summary.total
      }
    };
    
    // Add discount info if applied
    if (discountResult.discountApplied) {
      responseData.appliedDiscount = discountResult.discount;
    }
    
    return res.status(201).json(
      new ApiResponse(
        201,
        responseData,
        "Final invoice created successfully from advance invoice"
      )
    );
  } catch (error) {
    console.error("Error creating final invoice from advance:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to create final invoice")
    );
  }
});

/**
 * Record payment for an invoice
 * @route POST /api/v1/invoice/:invoiceId/payment
 * @access Private
 * @author sayanm085
 * @updated 2025-07-15 15:42:00
 */
export const recordPayment = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { amount, date, reference, notes, paymentMethod } = req.body;
  
  try {
    // Validate amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json(
        new ApiResponse(400, null, "Valid payment amount is required")
      );
    }
    
    // Find the invoice
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json(
        new ApiResponse(404, null, "Invoice not found")
      );
    }
    
    // Log information for debugging
    console.log(`Recording payment for invoice: ${invoiceId}`);
    console.log(`Invoice type: ${invoice.type}`);
    console.log(`Invoice number: ${invoice.invoiceNumber}`);
    
    // Check if it's a quotation with improved error message
    if (invoice.type === 'quotation') {
      return res.status(400).json(
        new ApiResponse(400, {
          invoiceId,
          invoiceType: invoice.type,
          invoiceNumber: invoice.invoiceNumber
        }, "Cannot record payment for a quotation. Please use an advance or final invoice.")
      );
    }
    
    // Initialize payment object if not exists
    if (!invoice.payment) {
      invoice.payment = {
        status: 'pending',
        partialPayments: [],
        totalPaid: 0,
        remainingAmount: invoice.summary.total
      };
    }
    
    // Add the payment to partialPayments array
    invoice.payment.partialPayments.push({
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      reference,
      notes,
      paymentMethod
    });
    
    // Update payment status using the model method
    if (typeof invoice.updatePaymentStatus === 'function') {
      invoice.updatePaymentStatus();
    } else {
      // Manual update if method doesn't exist
      // Calculate total paid
      const totalPaid = invoice.payment.partialPayments.reduce(
        (sum, payment) => sum + (payment.amount || 0), 0
      );
      
      // Update payment tracking fields
      invoice.payment.totalPaid = totalPaid;
      invoice.payment.remainingAmount = invoice.summary.total - totalPaid;
      invoice.payment.lastPaymentDate = new Date();
      
      // Update status
      if (invoice.payment.remainingAmount <= 0) {
        invoice.payment.status = 'completed';
        invoice.status = 'paid';
      } else if (invoice.payment.totalPaid > 0) {
        invoice.payment.status = 'partial';
      } else {
        invoice.payment.status = 'pending';
      }
    }
    
    // Save the invoice
    await invoice.save();
    
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          invoice: {
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            type: invoice.type,
            payment: invoice.payment
          }
        },
        "Payment recorded successfully"
      )
    );
  } catch (error) {
    console.error("Error recording payment:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to record payment")
    );
  }
});
/**
 * Get invoice by ID
 * @route GET /api/v1/invoice/:id
 * @access Private
 */
export const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const invoice = await Invoice.findById(id)
      .populate('client', 'name email phone address gstin panNumber')

    if (!invoice) {
      return res.status(404).json(
        new ApiResponse(404, null, "Invoice not found")
      );
    }
    
    // Check if there is a discount associated with this invoice
    let discountDetails = null;
    if (invoice.discountDetails && invoice.discountDetails.discountId) {
      try {
        const discount = await Discount.findById(invoice.discountDetails.discountId)
          .select('code name type value');
        
        if (discount) {
          discountDetails = {
            ...invoice.discountDetails,
            name: discount.name,
            type: discount.type,
            value: discount.value
          };
        }
      } catch (discountError) {
        console.error("Error fetching discount details:", discountError);
        // Continue even if discount details can't be fetched
      }
    }
    
    // Prepare response based on invoice type
    let responseData = {};
    
    if (invoice.type === 'quotation') {
      responseData = { quotation: invoice };
    } else {
      responseData = { invoice };
    }
    
    // Add discount details if available
    if (discountDetails) {
      responseData.discountDetails = discountDetails;
    }
    
    return res.status(200).json(
      new ApiResponse(
        200,
        responseData,
        `${invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)} retrieved successfully`
      )
    );
  } catch (error) {
    console.error("Error retrieving invoice:", error);
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json(
        new ApiResponse(400, null, "Invalid invoice ID format")
      );
    }
    
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to retrieve invoice")
    );
  }
});

/**
 * Get invoices by type with populated client and project data
 * @route GET /api/v1/invoice/type/:type
 * @access Private
 */
export const getInvoicesByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    startDate,
    endDate,
    search,
    status
  } = req.query;
  
  // Validate invoice type
  if (!['quotation', 'advance', 'final', 'all'].includes(type)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid invoice type. Must be 'quotation', 'advance', 'final', or 'all'")
    );
  }
  
  // Build query
  const query = { isDeleted: false };
  
  // Filter by type unless 'all' is specified
  if (type !== 'all') {
    query.type = type;
  }
  
  // Filter by status if provided
  if (status) {
    query.status = status;
  }
  
  // Filter by date range if provided
  if (startDate && endDate) {
    query.issueDate = { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    };
  } else if (startDate) {
    query.issueDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.issueDate = { $lte: new Date(endDate) };
  }
  
  // Adjust search for populated structure
  if (search) {
    // Create text search index if needed
    query.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { 'sellerDetails.companyName': { $regex: search, $options: 'i' } }
      // Client and project search will be handled after population
    ];
  }
  
  // Pagination options
  const options = {
    skip: (parseInt(page) - 1) * parseInt(limit),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
  };
  
  try {
    // Get total count for pagination
    const total = await Invoice.countDocuments(query);
    
    // Fetch invoices with populated client and project data
    let invoices = await Invoice.find(query, null, options)
      .populate({
        path: 'client',
        select: 'name email phone address gstin panNumber contactPerson'
      })
      .populate({
        path: 'project',
        select: 'name description startDate endDate status budget'
      })
      .select('invoiceNumber type status issueDate dueDate project client summary createdAt sellerDetails.companyName')
      .lean(); // Use lean for better performance
    
    // If search parameter is provided, filter results for client and project after population
    if (search && invoices.length > 0) {
      const searchRegex = new RegExp(search, 'i');
      
      // Filter in memory after population
      invoices = invoices.filter(invoice => {
        // Already matched invoice number or seller company in the DB query
        if (
          searchRegex.test(invoice.invoiceNumber) || 
          searchRegex.test(invoice.sellerDetails?.companyName)
        ) {
          return true;
        }
        
        // Check populated client name
        if (invoice.client && searchRegex.test(invoice.client.name)) {
          return true;
        }
        
        // Check populated project name
        if (invoice.project && searchRegex.test(invoice.project.name)) {
          return true;
        }
        
        return false;
      });
    }
    
    // Format data for consistent response
    const formattedInvoices = invoices.map(invoice => {
      // Format dates for display
      const formattedIssueDate = invoice.issueDate 
        ? new Date(invoice.issueDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '';
      
      const formattedDueDate = invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '';
      
      // Format amount
      const formattedAmount = invoice.summary?.total
        ? new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
          }).format(invoice.summary.total)
        : '';
      
      // Create a status class for UI styling
      let statusClass = 'text-gray-600';
      switch (invoice.status) {
        case 'draft': statusClass = 'text-blue-600'; break;
        case 'sent': statusClass = 'text-yellow-600'; break;
        case 'paid': statusClass = 'text-green-600'; break;
        case 'overdue': statusClass = 'text-red-600'; break;
        case 'cancelled': statusClass = 'text-gray-600'; break;
      }
      
      return {
        ...invoice,
        formattedIssueDate,
        formattedDueDate,
        formattedAmount,
        statusClass,
        // Include client and project data which are now populated
        clientName: invoice.client?.name || '',
        projectName: invoice.project?.name || ''
      };
    });
    
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          invoices: formattedInvoices,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        },
        type === 'all' 
          ? "All invoices retrieved successfully" 
          : `${type.charAt(0).toUpperCase() + type.slice(1)}s retrieved successfully`
      )
    );
  } catch (error) {
    console.error(`Error retrieving ${type} invoices:`, error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || `Failed to retrieve ${type} invoices`)
    );
  }
});

/**
 * Get invoice statistics
 * @route GET /api/v1/invoice/stats
 * @access Private
 * @updated 2025-07-15 15:08:06
 */
export const getInvoiceStats = asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    
    // Total counts by type
    const [quotationCount, advanceCount, finalCount] = await Promise.all([
      Invoice.countDocuments({ type: 'quotation', isDeleted: false }),
      Invoice.countDocuments({ type: 'advance', isDeleted: false }),
      Invoice.countDocuments({ type: 'final', isDeleted: false })
    ]);
    
    // Recent counts (this month)
    const [recentQuotations, recentAdvance, recentFinal] = await Promise.all([
      Invoice.countDocuments({ 
        type: 'quotation',
        isDeleted: false,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Invoice.countDocuments({ 
        type: 'advance',
        isDeleted: false,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Invoice.countDocuments({ 
        type: 'final',
        isDeleted: false,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      })
    ]);
    
    // Payment status counts - updated for new payment model
    const [pendingCount, partialCount, completedCount] = await Promise.all([
      Invoice.countDocuments({ 
        type: { $in: ['advance', 'final'] },
        isDeleted: false,
        'payment.status': 'pending'
      }),
      Invoice.countDocuments({ 
        type: { $in: ['advance', 'final'] },
        isDeleted: false,
        'payment.status': 'partial'
      }),
      Invoice.countDocuments({ 
        type: { $in: ['advance', 'final'] },
        isDeleted: false,
        'payment.status': 'completed'
      })
    ]);
    
    // Count overdue invoices - due date is past and payment status is not completed
    const overdueCount = await Invoice.countDocuments({
      type: 'final',
      isDeleted: false,
      'payment.status': { $ne: 'completed' },
      dueDate: { $lt: currentDate }
    });
    
    // Advance payment statistics
    const advancePaymentStats = await Invoice.aggregate([
      {
        $match: {
          type: 'advance',
          isDeleted: false,
          'paymentRelationship.advancePaymentPercent': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$summary.total' },
          count: { $sum: 1 },
          averagePercent: { $avg: '$paymentRelationship.advancePaymentPercent' }
        }
      }
    ]);
    
    // Final payment statistics with related advance payments
    const finalWithAdvanceStats = await Invoice.aggregate([
      {
        $match: {
          type: 'final',
          isDeleted: false,
          'paymentRelationship.advanceInvoices': { $exists: true, $ne: [] }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$summary.total' }
        }
      }
    ]);
    
    // Calculate conversion rate: what percentage of quotations become invoices
    const quotationsWithInvoices = await Invoice.countDocuments({
      type: 'quotation',
      isDeleted: false,
      $or: [
        { 'paymentRelationship.finalInvoice': { $exists: true } },
        { '_id': { $in: await Invoice.distinct('paymentRelationship.originalQuotation', { type: { $in: ['advance', 'final'] } }) } }
      ]
    });
    
    const conversionRate = quotationCount > 0 ? (quotationsWithInvoices / quotationCount) * 100 : 0;
    
    // Recent invoices for quick view - include payment relationship info
    const recentInvoices = await Invoice.find({
      isDeleted: false,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('invoiceNumber type status issueDate client summary.total sellerDetails.companyName paymentRelationship');
    
    // Enhance recent invoices with payment relationship description
    const enhancedRecentInvoices = recentInvoices.map(invoice => {
      const plainInvoice = invoice.toObject();
      
      // Add formatted payment info
      if (invoice.paymentRelationship) {
        plainInvoice.paymentInfo = {
          description: invoice.paymentRelationship.paymentDescription || '',
          percent: invoice.type === 'advance' ? invoice.paymentRelationship.advancePaymentPercent : null,
          hasAdvancePayments: invoice.type === 'final' && 
                             invoice.paymentRelationship.advanceInvoices && 
                             invoice.paymentRelationship.advanceInvoices.length > 0
        };
      }
      
      return plainInvoice;
    });
    
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          counts: {
            total: quotationCount + advanceCount + finalCount,
            quotations: quotationCount,
            advance: advanceCount,
            final: finalCount
          },
          recent: {
            quotations: recentQuotations,
            advance: recentAdvance,
            final: recentFinal,
            total: recentQuotations + recentAdvance + recentFinal
          },
          payments: {
            pending: pendingCount,
            partial: partialCount,
            completed: completedCount,
            overdue: overdueCount
          },
          advancePayments: {
            count: advancePaymentStats.length > 0 ? advancePaymentStats[0].count : 0,
            totalAmount: advancePaymentStats.length > 0 ? advancePaymentStats[0].totalAmount : 0,
            averagePercent: advancePaymentStats.length > 0 ? Math.round(advancePaymentStats[0].averagePercent) : 0
          },
          finalPayments: {
            withAdvanceCount: finalWithAdvanceStats.length > 0 ? finalWithAdvanceStats[0].count : 0,
            totalAmount: finalWithAdvanceStats.length > 0 ? finalWithAdvanceStats[0].totalAmount : 0,
          },
          conversion: {
            rate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
            quotationsWithInvoices
          },
          recentInvoices: enhancedRecentInvoices,
          meta: {
            lastUpdated: new Date().toISOString(),
            timestamp: "2025-07-15 15:08:06",
            user: "sayanm085"
          }
        },
        "Invoice statistics retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving invoice statistics:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to retrieve invoice statistics")
    );
  }
});

/**
 * Generate invoice number for frontend
 * @route GET /api/v1/invoice/generate-number/:type
 * @access Private
 */
export const generateInvoiceNumberForType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  // Validate invoice type
  if (!['quotation', 'advance', 'final'].includes(type)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid invoice type. Must be 'quotation', 'advance', or 'final'")
    );
  }
  
  try {
    const invoiceNumber = await generateInvoiceNumber(type);
    
    return res.status(200).json(
      new ApiResponse(
        200,
        { invoiceNumber },
        "Invoice number generated successfully"
      )
    );
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to generate invoice number")
    );
  }
});



/**
 * Get default seller details for frontend
 * @route GET /api/v1/invoice/seller-details
 * @access Private
 */
export const getDefaultSellerDetails = asyncHandler(async (req, res) => {
  try {
    const defaultSellerDetails = {
      name: "Sayan Mondal",
      companyName: "Shotlin",
      address: "379/N, BANIPUR PALPARA WARD 13 BANIPUR PALPARA S.N. DEY ROAD North 24 Parganas, West Bengal 743287, India",
      gstNumber: "AAHATPM4170HDC",
      placeOfOrigin: "West Bengal"
    };
    
    return res.status(200).json(
      new ApiResponse(
        200,
        { sellerDetails: defaultSellerDetails },
        "Default seller details retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving default seller details:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to retrieve default seller details")
    );
  }
});

export default {
  createQuotation,
  createAdvancePayment,
  createFinalPayment,
  createInvoiceFromQuotation,
  getInvoiceById,
  recordPayment,
  getInvoicesByType,
  getInvoiceStats,
  generateInvoiceNumberForType,
  getDefaultSellerDetails
};