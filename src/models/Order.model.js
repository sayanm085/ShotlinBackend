// Importing required modules
import mongoose from "mongoose";


const orderSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products: [{
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled']
    },
    shippingAddress: {
      type: addressSchema,
      required: true
    },
    orderedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  const Order = mongoose.model('Order', orderSchema);
  export default Order;
  