import mongoose from 'mongoose';
import mongoosePaginate from "mongoose-paginate-v2";


const MeetingScheduleSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true 
    },
    email: { 
      type: String, 
      required: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    phone: { 
      type: String, 
      required: true,
      // Regex pattern allows international numbers; adjust as needed.
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    meetingLink: { 
      type: String, 
      required: true,
      // Basic URL validation; customize if needed.
      match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    serviceName: { 
      type: String, 
      required: true,
      trim: true
    },
    meetingDate: {
      type: Date,
      required: true,
      index: true // Indexed for faster queries based on meeting date
    },
    meetingTime: {
      type: String,
      required: true,
      // Example pattern for time in 12-hour format with AM/PM. Adjust as necessary.
      match: [/^(0?[1-9]|1[012]):[0-5][0-9]\s?(AM|PM)$/i, 'Please enter a valid time']
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);
// Adding pagination plugin
MeetingScheduleSchema.plugin(mongoosePaginate);


const MeetingSchedule = mongoose.model('MeetingSchedule', MeetingScheduleSchema);

export default MeetingSchedule;
