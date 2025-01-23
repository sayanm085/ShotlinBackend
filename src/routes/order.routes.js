const { Router } = require("express");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const { createOrder, ordervarify, getOrders, getOrderById } = require("../controllers/OrderList.controllers.js");

const router = Router();

router.route("/create-order").post(verifyJWT, createOrder);
router.route("/order-varify").post(verifyJWT, ordervarify);
router.route("/get-orders").get(verifyJWT, getOrders);
router.route("/get-order/:id").get(verifyJWT, getOrderById);

module.exports = router;
