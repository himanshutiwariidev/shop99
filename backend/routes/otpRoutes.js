// routes/otpRoutes.js

const express = require("express");
const router = express.Router();

const {
  sendOTP,
  verifyOTP
} = require("../controllers/otpController");
const { otpLimiter } = require("../middleware/rateLimiters");

router.post("/send-otp", otpLimiter, sendOTP);
router.post("/verify-otp", otpLimiter, verifyOTP);

module.exports = router;