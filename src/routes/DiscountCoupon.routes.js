const { Router } = require("express");
const { verifyAdminJWT } = require("../middlewares/auth.middleware.js");
const { createCoupon, getCoupons } = require("../controllers/DiscountCoupon.controllers.js");
const router = Router();

router.route("/create-coupon").post(verifyAdminJWT, createCoupon);
router.route("/get-coupons").get(verifyAdminJWT, getCoupons);

module.exports = router;
