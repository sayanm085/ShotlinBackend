import Discount from '../models/Discount.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Create a new discount
 * @route POST /api/v1/discounts
 * @access Admin only
 */
export const createDiscount = asyncHandler(async (req, res) => {
  const {
    code,
    name,
    description,
    type,
    value,
    currency,
    startDate,
    endDate,
    usageLimit,
    perCustomerLimit,
    minimumOrderValue,
    maximumDiscountAmount,
    applicableTo,
    applicableServices,
    applicableClients,
    tiers,
    isActive
  } = req.body;

  // Check for duplicate code
  const existingDiscount = await Discount.findOne({ code: code.toUpperCase() });
  if (existingDiscount) {
    return res.status(400).json(
      new ApiResponse(400, null, "Discount code already exists")
    );
  }

  // Validate discount type-specific data
  if (type === 'percentage' && (value < 0 || value > 100)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Percentage discount must be between 0 and 100")
    );
  }

  if (type === 'flat' && !currency) {
    return res.status(400).json(
      new ApiResponse(400, null, "Currency is required for flat discounts")
    );
  }

  if (type === 'tiered' && (!tiers || tiers.length === 0)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Tiers are required for tiered discounts")
    );
  }

  // Validate dates
  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json(
      new ApiResponse(400, null, "End date must be after start date")
    );
  }

  try {
    const discountData = {
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      currency: type === 'flat' ? currency : undefined,
      startDate,
      endDate,
      usageLimit,
      perCustomerLimit,
      minimumOrderValue,
      maximumDiscountAmount,
      applicableTo,
      applicableServices,
      applicableClients,
      tiers,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?._id || req.user?.id
    };

    const discount = new Discount(discountData);
    await discount.save();

    return res.status(201).json(
      new ApiResponse(
        201,
        { discount },
        "Discount created successfully"
      )
    );
  } catch (error) {
    console.error("Error creating discount:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to create discount")
    );
  }
});

/**
 * Get all discounts with filtering options
 * @route GET /api/v1/discounts
 * @access Admin only
 */
export const getAllDiscounts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    isActive,
    type,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Build query
  const query = {};
  
  // Filter by status
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  // Filter by type
  if (type) {
    query.type = type;
  }
  
  // Filter by date range (for active discounts)
  if (startDate && endDate) {
    query.$or = [
      { 
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) }
      }
    ];
  }
  
  // Search by code or name
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  try {
    const discounts = await Discount.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');
    
    const total = await Discount.countDocuments(query);
    
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          discounts,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        },
        "Discounts retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving discounts:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to retrieve discounts")
    );
  }
});

/**
 * Get active discounts
 * @route GET /api/v1/discounts/active
 * @access Public
 */
export const getActiveDiscounts = asyncHandler(async (req, res) => {
  const currentDate = new Date();
  
  try {
    const activeDiscounts = await Discount.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).select('code name description type value currency minimumOrderValue');
    
    return res.status(200).json(
      new ApiResponse(
        200,
        { discounts: activeDiscounts },
        "Active discounts retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving active discounts:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to retrieve active discounts")
    );
  }
});

/**
 * Get discount by ID
 * @route GET /api/v1/discounts/:id
 * @access Admin only
 */
export const getDiscountById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const discount = await Discount.findById(id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .populate('applicableServices', 'name')
      .populate('applicableClients', 'name');
    
    if (!discount) {
      return res.status(404).json(
        new ApiResponse(404, null, "Discount not found")
      );
    }
    
    return res.status(200).json(
      new ApiResponse(
        200,
        { discount },
        "Discount retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving discount:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to retrieve discount")
    );
  }
});

/**
 * Update discount
 * @route PUT /api/v1/discounts/:id
 * @access Admin only
 */
export const updateDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  
  try {
    // Find the existing discount
    const existingDiscount = await Discount.findById(id);
    
    if (!existingDiscount) {
      return res.status(404).json(
        new ApiResponse(404, null, "Discount not found")
      );
    }
    
    // Check for duplicate code if code is being updated
    if (updateData.code && updateData.code !== existingDiscount.code) {
      const duplicateCode = await Discount.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      
      if (duplicateCode) {
        return res.status(400).json(
          new ApiResponse(400, null, "Discount code already exists")
        );
      }
      
      // Ensure code is uppercase
      updateData.code = updateData.code.toUpperCase();
    }
    
    // Validate type-specific data
    if (updateData.type === 'percentage' && updateData.value !== undefined) {
      if (updateData.value < 0 || updateData.value > 100) {
        return res.status(400).json(
          new ApiResponse(400, null, "Percentage discount must be between 0 and 100")
        );
      }
    }
    
    // Validate dates if both are provided
    if (updateData.startDate && updateData.endDate) {
      if (new Date(updateData.endDate) <= new Date(updateData.startDate)) {
        return res.status(400).json(
          new ApiResponse(400, null, "End date must be after start date")
        );
      }
    } else if (updateData.startDate && !updateData.endDate) {
      // If only start date is provided, check against existing end date
      if (new Date(updateData.startDate) >= new Date(existingDiscount.endDate)) {
        return res.status(400).json(
          new ApiResponse(400, null, "Start date must be before end date")
        );
      }
    } else if (!updateData.startDate && updateData.endDate) {
      // If only end date is provided, check against existing start date
      if (new Date(updateData.endDate) <= new Date(existingDiscount.startDate)) {
        return res.status(400).json(
          new ApiResponse(400, null, "End date must be after start date")
        );
      }
    }
    
    // Add updatedBy field
    updateData.updatedBy = req.user?._id || req.user?.id;
    
    // Update the discount
    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json(
      new ApiResponse(
        200,
        { discount: updatedDiscount },
        "Discount updated successfully"
      )
    );
  } catch (error) {
    console.error("Error updating discount:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to update discount")
    );
  }
});

/**
 * Delete discount
 * @route DELETE /api/v1/discounts/:id
 * @access Admin only
 */
export const deleteDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const discount = await Discount.findById(id);
    
    if (!discount) {
      return res.status(404).json(
        new ApiResponse(404, null, "Discount not found")
      );
    }
    
    await Discount.findByIdAndDelete(id);
    
    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Discount deleted successfully"
      )
    );
  } catch (error) {
    console.error("Error deleting discount:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to delete discount")
    );
  }
});

/**
 * Validate a discount code
 * @route POST /api/v1/discounts/validate
 * @access Public
 */
export const validateDiscountCode = asyncHandler(async (req, res) => {
  const { code, orderAmount, customerId, services } = req.body;
  
  if (!code) {
    return res.status(400).json(
      new ApiResponse(400, null, "Discount code is required")
    );
  }
  
  try {
    const discount = await Discount.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });
    
    if (!discount) {
      return res.status(404).json(
        new ApiResponse(404, null, "Invalid discount code")
      );
    }
    
    const currentDate = new Date();
    
    // Check if discount is currently valid
    if (currentDate < discount.startDate || currentDate > discount.endDate) {
      return res.status(400).json(
        new ApiResponse(400, null, "Discount code has expired or not yet active")
      );
    }
    
    // Check usage limit
    if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
      return res.status(400).json(
        new ApiResponse(400, null, "This discount has reached its usage limit")
      );
    }
    
    // Check minimum order value
    if (orderAmount && discount.minimumOrderValue && orderAmount < discount.minimumOrderValue) {
      return res.status(400).json(
        new ApiResponse(
          400, 
          { 
            valid: false,
            minimumOrderValue: discount.minimumOrderValue 
          }, 
          `Minimum order amount of ${discount.currency || 'INR'} ${discount.minimumOrderValue} required`
        )
      );
    }
    
    // Check service applicability if services are provided
    if (services && services.length > 0 && 
        discount.applicableTo === 'specific_services' && 
        discount.applicableServices && 
        discount.applicableServices.length > 0) {
      
      const serviceIds = services.map(s => s.toString());
      const applicableServiceIds = discount.applicableServices.map(s => s.toString());
      
      const hasApplicableService = serviceIds.some(id => 
        applicableServiceIds.includes(id)
      );
      
      if (!hasApplicableService) {
        return res.status(400).json(
          new ApiResponse(400, { valid: false }, "Discount not applicable to selected services")
        );
      }
    }
    
    // Check client applicability if customerId is provided
    if (customerId && 
        discount.applicableTo === 'specific_clients' && 
        discount.applicableClients && 
        discount.applicableClients.length > 0) {
      
      const applicableClientIds = discount.applicableClients.map(c => c.toString());
      
      if (!applicableClientIds.includes(customerId.toString())) {
        return res.status(400).json(
          new ApiResponse(400, { valid: false }, "Discount not applicable to this client")
        );
      }
    }
    
    // Calculate discount amount if order amount is provided
    let discountAmount = 0;
    if (orderAmount) {
      switch (discount.type) {
        case 'percentage':
          discountAmount = (orderAmount * discount.value) / 100;
          
          // Apply maximum discount cap if specified
          if (discount.maximumDiscountAmount && discountAmount > discount.maximumDiscountAmount) {
            discountAmount = discount.maximumDiscountAmount;
          }
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
              
            // Apply maximum discount cap if specified
            if (discount.maximumDiscountAmount && discountAmount > discount.maximumDiscountAmount) {
              discountAmount = discount.maximumDiscountAmount;
            }
          }
          break;
      }
    }
    
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          valid: true,
          discount: {
            _id: discount._id,
            code: discount.code,
            name: discount.name,
            type: discount.type,
            value: discount.value,
            minimumOrderValue: discount.minimumOrderValue,
            maximumDiscountAmount: discount.maximumDiscountAmount,
            discountAmount: discountAmount,
            finalAmount: orderAmount ? (orderAmount - discountAmount) : null
          }
        },
        "Discount code is valid"
      )
    );
  } catch (error) {
    console.error("Error validating discount code:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to validate discount code")
    );
  }
});

/**
 * Apply a discount and increment usage count
 * @route POST /api/v1/discounts/apply
 * @access Private
 */
export const applyDiscount = asyncHandler(async (req, res) => {
  const { code, orderAmount, customerId, orderId } = req.body;
  
  if (!code || !orderAmount || !orderId) {
    return res.status(400).json(
      new ApiResponse(400, null, "Discount code, order amount, and order ID are required")
    );
  }
  
  try {
    const discount = await Discount.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });
    
    if (!discount) {
      return res.status(404).json(
        new ApiResponse(404, null, "Invalid discount code")
      );
    }
    
    // Validate discount (reuse validation logic)
    const currentDate = new Date();
    
    if (currentDate < discount.startDate || currentDate > discount.endDate) {
      return res.status(400).json(
        new ApiResponse(400, null, "Discount code has expired or not yet active")
      );
    }
    
    if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
      return res.status(400).json(
        new ApiResponse(400, null, "This discount has reached its usage limit")
      );
    }
    
    if (discount.minimumOrderValue && orderAmount < discount.minimumOrderValue) {
      return res.status(400).json(
        new ApiResponse(
          400, 
          null, 
          `Minimum order amount of ${discount.currency || 'INR'} ${discount.minimumOrderValue} required`
        )
      );
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
    
    // Increment usage count
    discount.usageCount += 1;
    await discount.save();
    
    // Return the applied discount
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          discountId: discount._id,
          code: discount.code,
          discountAmount: discountAmount,
          finalAmount: orderAmount - discountAmount
        },
        "Discount applied successfully"
      )
    );
  } catch (error) {
    console.error("Error applying discount:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to apply discount")
    );
  }
});

/**
 * Get discount usage statistics
 * @route GET /api/v1/discounts/stats
 * @access Admin only
 */
export const getDiscountStats = asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Count total discounts
    const totalDiscounts = await Discount.countDocuments();
    
    // Count active discounts
    const activeDiscounts = await Discount.countDocuments({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    });
    
    // Count expired discounts
    const expiredDiscounts = await Discount.countDocuments({
      endDate: { $lt: currentDate }
    });
    
    // Count upcoming discounts
    const upcomingDiscounts = await Discount.countDocuments({
      startDate: { $gt: currentDate }
    });
    
    // Get most used discounts
    const mostUsedDiscounts = await Discount.find()
      .sort({ usageCount: -1 })
      .limit(5)
      .select('code name type value usageCount');
    
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          stats: {
            total: totalDiscounts,
            active: activeDiscounts,
            expired: expiredDiscounts,
            upcoming: upcomingDiscounts
          },
          mostUsed: mostUsedDiscounts
        },
        "Discount statistics retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving discount statistics:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to retrieve discount statistics")
    );
  }
});