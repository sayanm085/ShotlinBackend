import mongoose from 'mongoose';
import mongoosePaginate from "mongoose-paginate-v2";
// Define the Contact schema
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/,
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    match: /^\+?[1-9]\d{1,14}$/, // Optional: Validates international phone numbers
  },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    contactuniquenumber: { // Unique identifier for the contact message
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    status: { // Status of the contact message
       enum: ['pending', 'in-progress', 'resolved', 'closed'],
        type: String,
        required: true,
        default: 'pending',
    },
    priority: { // Priority of the contact message
        enum: ['low', 'medium', 'high'],
        type: String,
        required: true,
        default: 'medium',
    },
    adminresponse: [
    {
      response: {
        type: String,
        required: false,
        trim: true,
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model for admin
        required: false,
      },
      respondedAt: {
        type: Date,
        default: Date.now,
      },
    }
    ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Adding pagination plugin
contactSchema.plugin(mongoosePaginate);



// Create the Contact model
const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
