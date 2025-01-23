const { Router } = require("express");
const { createContactUs } = require("../controllers/Contact.controllers.js");

const router = Router();

router.route('/contact-us').post(createContactUs);

module.exports = router;