import { Router } from "express";
import { registerUser,loginUser,logoutUser , refreshAccessToken,profileData ,profileEdit,verifyEmail,resendotp,forgotPassword,currentuser,getAllUsers } from "../controllers/User.controllers.js";
import {addrescreate,useralladdress ,updateUserAddress,deleteUserAddress} from "../controllers/Address.controllers.js";
import {
  createClient,
  getClientById,
  getAllClients,
  getClientSuggestions,
  updateClient,
  deleteClient
} from "../controllers/Client.cotrollers.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";


const router = Router();


router.route("/register").post(registerUser)
router.route("/verify-email").post(verifyEmail)
router.route("/forgot-password").post(forgotPassword)
router.route("/resend-otp").post(resendotp)
router.route("/login").post(loginUser)
router.route("/logout").get(verifyJWT,logoutUser)
router.route("/refresh-accessToken").get(refreshAccessToken)
router.route("/profile").get(verifyJWT,profileData)
router.route("/profile").put(verifyJWT,upload.single("avatar"),profileEdit)
router.route("/currentuser").get(verifyJWT,currentuser)
// Address Routes 
router.route("/address").post(verifyJWT,addrescreate)
router.route("/useraddress").get(verifyJWT,useralladdress)
router.route("/updateaddress/:addressId").put(verifyJWT,updateUserAddress)
router.route("/deleteaddress/:addressId").delete(verifyJWT,deleteUserAddress)


// Client Routes   

router.route("/clients").post( createClient);
router.route("/clients/:id").get( getClientById);
router.route("/clients").get(getAllClients);
router.route("/clients-suggestions").get(getClientSuggestions);
router.route("/clients/:id").put( updateClient);
router.route("/clients/:id").delete( deleteClient);


router.route("/getalluser").get(getAllUsers)



export default router;