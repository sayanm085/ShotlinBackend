import { Router } from "express";
import {createContactUs , getAllContacts} from "../controllers/Contact.controllers.js";
import { createMeetingSchedule , createDailySchedule , UserExistMeeting ,getRealtimeDailySchedule,createZoomMeetings ,getAllMeetingSchedule } from "../controllers/MeetingSchedule.controllers.js";
import {verifyJWT,verifyAdminJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/contact-us').post(createContactUs);
router.route('/contact-us').get(getAllContacts);





router.route('/meeting-schedule').post(verifyJWT,createMeetingSchedule);
router.route('/meeting-schedule').get(verifyJWT,UserExistMeeting);
router.route('/daily-schedule').get(getRealtimeDailySchedule );
router.route('/daily-schedule').post(verifyAdminJWT,createDailySchedule);
router.route('/zoom-meeting').post(createZoomMeetings);
router.route('/allmeeting-schedule').get(getAllMeetingSchedule);

export default router;