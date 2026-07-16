const router = require("express").Router();
const controller = require("../controllers/authController");
const otpController = require("../controllers/otpController");
const User = require("../models/userModel");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiters");

// Was public with no auth — leaked every user's PII. Admin-only now.
router.get("/users", adminAuthMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.post("/register", authLimiter, controller.registerUser);
router.post("/login", authLimiter, controller.loginUser);

router.post("/user/send-otp", otpLimiter, otpController.sendOTP);
router.post("/user/verify-otp", otpLimiter, otpController.verifyOTP);

module.exports = router;
