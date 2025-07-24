import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Project Model Definition
 * Last updated: 2025-07-14 18:57:11
 * Author: sayanm085
 */

const projectSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold', 'cancelled'],
    default: 'active'
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Only keep the client index
projectSchema.index({ client: 1, status: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;