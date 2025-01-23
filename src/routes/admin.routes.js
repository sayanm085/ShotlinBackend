const { Router } = require("express");
const { createAdmin, loginAdmin, logoutAdmin } = require("../controllers/admin.controllers.js");
const { verifyAdminJWT } = require("../middlewares/auth.middleware.js");

const router = Router();

router.route("/createAdmin").post(createAdmin);
router.route("/loginAdmin").post(loginAdmin);
router.route("/logoutAdmin").post(verifyAdminJWT, logoutAdmin);

module.exports = router;