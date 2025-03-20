import mongoose from 'mongoose';

const DailyScheduleSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    // Embedded time slots within the daily schedule
    timeSlots: [
      {
        startTime: {
          type: String,
          required: true
        },
        endTime: {
          type: String,
          required: true
        },
        currentBookings: {
          type: Number,
          default: 0
        },
        maxBookings: {
          type: Number,
          default: 2
        },
        status: {
          type: String,
          enum: ['available', 'full'],
          default: 'available'
        }
      }
    ],
    // Overall daily schedule status based on timeSlots,
    status: {
      type: String,
      enum: ['active', 'full'],
      default: 'active'
    }
  },
  { timestamps: true }
);

// Pre-save hook to update statuses for each time slot and the overall day
DailyScheduleSchema.pre('save', function (next) {
  // Update each time slot's status based on current bookings
  this.timeSlots = this.timeSlots.map((slot) => {
    slot.status = slot.currentBookings >= slot.maxBookings ? 'full' : 'available';
    return slot;
  });
  
  // If every time slot is full, mark the entire day as full
  this.status = this.timeSlots.every((slot) => slot.status === 'full') ? 'full' : 'active';
  
  next();
});

const DailySchedule = mongoose.model('DailySchedule', DailyScheduleSchema);

export default DailySchedule;
