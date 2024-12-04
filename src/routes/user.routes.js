import { Router } from "express";
import { registerUser,loginUser,logoutUser , refreshAccessToken } from "../controllers/User.controllers.js";
import verifyJWT from "../middlewares/auth.middleware.js";


const router = Router();


router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").get(verifyJWT,logoutUser)
router.route("/refresh-accessToken").get(refreshAccessToken)



export default router;