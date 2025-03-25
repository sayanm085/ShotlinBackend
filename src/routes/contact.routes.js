import { Router } from "express";
import {createContactUs} from "../controllers/Contact.controllers.js";
import { createMeetingSchedule , createDailySchedule , getMeetingSchedule,getRealtimeDailySchedule  } from "../controllers/MeetingSchedule.controllers.js";
import {verifyJWT,verifyAdminJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/contact-us').post(createContactUs);
router.route('/meeting-schedule').post(verifyJWT,createMeetingSchedule);
router.route('/meeting-schedule').get(verifyAdminJWT,getMeetingSchedule);
router.route('/daily-schedule').get(getRealtimeDailySchedule );
router.route('/daily-schedule').post(verifyAdminJWT,createDailySchedule);

export default router;