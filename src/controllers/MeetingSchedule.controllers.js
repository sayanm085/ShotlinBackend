import { createZoomMeeting } from "../utils/zoomService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mailsend from "../utils/nodemailer.utils.js";
import MeetingSchedule from "../models/MeetingSchedule.model.js";
import DailySchedule from "../models/DailySchedule.model.js";
import redisClient from "../db/Radis.db.js";

import {meetingScheduleTemplate} from "../email template/email template.js";

const createMeetingSchedule = async (req, res) => {
    const { dateid, timeSlotid, email,phone,serviceName,description } = req.body;
    

    const userId = req.user._id;

    // Check if a daily schedule exists for the given date
    const dailySchedule = await DailySchedule.findById(dateid);
    if (!dailySchedule) {
        return res.status(404).json(new ApiResponse(404, "Daily Schedule not found" ,"failed"));
    }

    // Check if the time slot is available for booking
    const timeSlot = dailySchedule.timeSlots.id(timeSlotid);
    if (!timeSlot) {
        return res.status(404).json(new ApiResponse(404, "Time Slot not found","failed"));
    }

   // Check if the user has already booked a meeting for the given date 
    const existingMeeting = await MeetingSchedule.findOne({ userId, meetingDate: dailySchedule.date });
    if (existingMeeting) {
        return res.status(400).json(new ApiResponse(400, "Meeting already exists for this date","failed"));
    }

    // Check if the time slot is available for booking
    if (timeSlot.status === "full") {
        return res.status(400).json(new ApiResponse(400, "Time Slot is already full","failed"));
    }

    // Create a new Zoom meeting 
    const meetingLink = await createZoomMeeting(serviceName, dailySchedule.date, timeSlot.startTime);
    // const meetingLink ="https://us05web.zoom.us/j/89194651313?pwd=zWkJ6zeFmUbK1Za0aBcZcH4HTcTY1u.1"

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

   
    res.status(201).json(new ApiResponse(201, "Meeting scheduled successfully", "success"));

     // Send a confirmation email to the user
    try {
      await mailsend(
        email,
        "Meeting Schedule Confirmation",
        meetingScheduleTemplate(
          dailySchedule.date,
          timeSlot.startTime,
          meetingLink
        )
      );
      console.log("Email sent successfully.");
    } catch (error) {
      console.error("Error sending email:", error);
    }
       
};

// Create a new Daily Schedule and update Redis cache
const createDailySchedule = asyncHandler(async (req, res) => {
    const { date, timeSlots } = req.body;
  
    // Check if a daily schedule already exists for the given date
    const existingDailySchedule = await DailySchedule.findOne({ date });
    if (existingDailySchedule) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Daily Schedule already exists for this date"));
    }
  
    // Create and save the new daily schedule (create() saves automatically)
    const newDailySchedule = await DailySchedule.create({ date, timeSlots });
  
    // Record the new schedule in Redis cache using the date as a key (YYYY-MM-DD)
    const scheduleKey = `dailySchedule:${new Date(date)
      .toISOString()
      .split("T")[0]}`;
    // Cache the schedule for 1 hour (3600 seconds)
    await redisClient.set(scheduleKey, JSON.stringify(newDailySchedule), "EX", 3600);
  
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "Daily Schedule created successfully",
          newDailySchedule
        )
      );
  });
  
  // Get realtime daily schedules (from today onward) with Redis caching
  const getRealtimeDailySchedule = async (req, res) => {
    try {
      // Calculate the start of today (midnight)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dateKey = startOfToday.toISOString().split("T")[0];
      const redisKey = `dailySchedule:${dateKey}`;
  
      // Attempt to retrieve cached schedules from Redis
      const cached = await redisClient.get(redisKey);
      if (cached) {
        return res.status(200).json(
          new ApiResponse(200, "Daily schedules found (cache)", JSON.parse(cached))
        );
      }
  
      // Query MongoDB for schedules starting today; use lean() for faster response and low overhead.
      // Optionally, use projection to only return necessary fields.
      const schedules = await DailySchedule.find(
        { date: { $gte: startOfToday } },
        { __v: 0 } // Example projection; omit __v field. Adjust as needed.
      ).lean();
  
      if (!schedules || schedules.length === 0) {
        return res.status(404).json(new ApiResponse(404, "No daily schedules found"));
      }
  
      // Cache the result in Redis with an expiration of 1 hour (3600 seconds)
      await redisClient.set(redisKey, JSON.stringify(schedules), "EX", 3600);
  
      return res.status(200).json(new ApiResponse(200, "Daily schedules found", schedules));
    } catch (error) {
      console.error("Error fetching daily schedules:", error);
      return res.status(500).json(new ApiResponse(500, "Internal Server Error", error.message));
    }
  };
  
const getMeetingSchedule = async (req, res) => {
    
};


export { createMeetingSchedule , createDailySchedule , getMeetingSchedule,getRealtimeDailySchedule  };