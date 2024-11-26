import { Router } from "express";
import { registerUser,loginUser,logoutUser } from "../controllers/User.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";


const router = Router();


router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").get(verifyJWT,logoutUser)



export default router;