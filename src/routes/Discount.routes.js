import { Router } from "express";

import { createDiscount, getAllDiscounts, getActiveDiscounts, getDiscountById, updateDiscount, deleteDiscount, validateDiscountCode, applyDiscount, getDiscountStats } from "../controllers/Discount.controllers.js";

const router = Router();
router.route("/createDiscount").post(createDiscount);
// Public routes
router.route("/active").get(getActiveDiscounts);
router.route("/validate").post(validateDiscountCode);


// Apply discount (requires auth but not admin)
router.route("/apply").post(applyDiscount);


// Discount CRUD operations
router.route("/")
  .post(createDiscount)
  .get(getAllDiscounts);

router.route("/:id")
  .get(getDiscountById)
  .put(updateDiscount)
  .delete(deleteDiscount);

// Stats route
router.route("/stats").get(getDiscountStats);

export default router;