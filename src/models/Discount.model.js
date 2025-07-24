import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
    // Basic Information
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    
    // Discount Type and Value
    type: {
        type: String,
        required: true,
        enum: ['percentage', 'flat', 'tiered'],
        default: 'percentage'
    },
    value: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'INR',
        required: function() {
            return this.type === 'flat';
        }
    },
    
    // Validity Period
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    
    // Usage Limits
    usageLimit: {
        type: Number,
        default: 10, // null means unlimited
    },
    usageCount: {
        type: Number,
        default: 0
    },
    perCustomerLimit: {
        type: Number,
        default: null, // null means unlimited
    },
    
    // Eligibility
    minimumOrderValue: {
        type: Number,
        default: 0
    },
    maximumDiscountAmount: {
        type: Number,
        default: null // null means no cap
    },
    
    // Applicability
    applicableTo: {
        type: String,
        enum: ['all', 'specific_services', 'specific_clients'],
        default: 'all'
    },
    applicableServices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],
    applicableClients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    }],
    
    // For tiered discounts
    tiers: [{
        minimumValue: {
            type: Number,
            required: function() {
                return this.parent().type === 'tiered';
            }
        },
        discountValue: {
            type: Number,
            required: function() {
                return this.parent().type === 'tiered';
            }
        },
        isPercentage: {
            type: Boolean,
            default: true
        }
    }],
    
    // Status
    isActive: {         
        type: Boolean,
        default: true,
    },
    
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
}); 

// Index for faster lookups
discountSchema.index({ code: 1 });
discountSchema.index({ isActive: 1 });
discountSchema.index({ startDate: 1, endDate: 1 });

// Method to check if discount is valid for a given date
discountSchema.methods.isValidOn = function(date = new Date()) {
    return this.isActive && 
           date >= this.startDate && 
           date <= this.endDate &&
           (this.usageLimit === null || this.usageCount < this.usageLimit);
};

// Method to calculate discount amount
discountSchema.methods.calculateDiscount = function(orderAmount, customerHistory = []) {
    // Check minimum order value
    if (orderAmount < this.minimumOrderValue) {
        return 0;
    }
    
    // Check per customer usage limit
    if (this.perCustomerLimit !== null) {
        const customerUsageCount = customerHistory.filter(
            history => history.discountCode === this.code
        ).length;
        
        if (customerUsageCount >= this.perCustomerLimit) {
            return 0;
        }
    }
    
    let discountAmount = 0;
    
    // Calculate based on discount type
    switch (this.type) {
        case 'percentage':
            discountAmount = (orderAmount * this.value) / 100;
            break;
        
        case 'flat':
            discountAmount = this.value;
            break;
            
        case 'tiered':
            // Find the applicable tier
            const applicableTier = [...this.tiers]
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
    if (this.maximumDiscountAmount !== null && discountAmount > this.maximumDiscountAmount) {
        discountAmount = this.maximumDiscountAmount;
    }
    
    return discountAmount;
};

// Middleware to check if discount is valid before saving
discountSchema.pre('save', function(next) {
    if (this.endDate <= this.startDate) {
        return next(new Error('End date must be after start date'));
    }
    
    if (this.type === 'percentage' && this.value > 100) {
        return next(new Error('Percentage discount cannot exceed 100%'));
    }
    
    next();
});

export default mongoose.model("Discount", discountSchema);