import { createZoomMeeting } from "../utils/zoomService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mailsend from "../utils/nodemailer.utils.js";
import MeetingSchedule from "../models/MeetingSchedule.model.js";
import DailySchedule from "../models/DailySchedule.model.js";


const createMeetingSchedule = async (req, res) => {
    const { dateid, timeSlotid, email,phone,serviceName,description } = req.body;
    

    const userId = req.user._id;

    console.log("userId",userId);

    // Check if a daily schedule exists for the given date
    const dailySchedule = await DailySchedule.findById(dateid);
    if (!dailySchedule) {
        return res.status(404).json(new ApiResponse(404, "Daily Schedule not found"));
    }

    // Check if the time slot is available for booking
    const timeSlot = dailySchedule.timeSlots.id(timeSlotid);
    if (!timeSlot) {
        return res.status(404).json(new ApiResponse(404, "Time Slot not found"));
    }

   // Check if the user has already booked a meeting for the given date 
    const existingMeeting = await MeetingSchedule.findOne({ userId, meetingDate: dailySchedule.date });
    if (existingMeeting) {
        return res.status(400).json(new ApiResponse(400, "Meeting already exists for this date"));
    }

    // Check if the time slot is available for booking
    if (timeSlot.status === "full") {
        return res.status(400).json(new ApiResponse(400, "Time Slot is already full"));
    }

    // Create a new Zoom meeting 
    const meetingLink = await createZoomMeeting(serviceName, dailySchedule.date, timeSlot.startTime);

    // Create and save the new meeting schedule
    const newMeeting = await MeetingSchedule.create({
        userId,
        email,
        phone,
        meetingLink,
        serviceName,
        meetingDate: dailySchedule.date,
        meetingTime: timeSlot.startTime,
        description
    });

    // Update the time slot with the new booking
    timeSlot.currentBookings += 1;
    
    await dailySchedule.save();

    // Send a confirmation email to the user
    await mailsend({
        to: email,
        subject: "Meeting Schedule Confirmation",
        text: `Your meeting has been scheduled successfully for ${dailySchedule.date} at ${timeSlot.startTime}.`
    });

    res.status(201).json(new ApiResponse(201, "Meeting scheduled successfully", "newMeeting"));   
};

const createDailySchedule = asyncHandler(async (req, res) => {
    const { date, timeSlots } = req.body;
  
    // Check if a daily schedule already exists for the given date
    const existingDailySchedule = await DailySchedule.findOne({ date });
    if (existingDailySchedule) {
        return res.status(400).json(new ApiResponse(400, "Daily Schedule already exists for this date"));
    }
  
    // Create and save the new daily schedule (create() saves automatically)
    const newDailySchedule = await DailySchedule.create({ date, timeSlots });
  
    res.status(201).json(new ApiResponse(201, "Daily Schedule created successfully", newDailySchedule));
});
  

const getMeetingSchedule = async (req, res) => {
    
};


export { createMeetingSchedule , createDailySchedule , getMeetingSchedule };