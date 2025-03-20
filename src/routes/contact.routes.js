import { Router } from "express";
import {createContactUs} from "../controllers/Contact.controllers.js";
import { createMeetingSchedule , createDailySchedule , getMeetingSchedule } from "../controllers/MeetingSchedule.controllers.js";
import {verifyJWT,verifyAdminJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/contact-us').post(createContactUs);
router.route('/meeting-schedule').post(verifyJWT,createMeetingSchedule);
router.route('/daily-schedule').post(verifyAdminJWT,createDailySchedule);

export default router;