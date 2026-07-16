const router = require("express").Router();
const controller = require("../controllers/adminAuthController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");

// Creating new admin accounts requires an existing admin session — this used
// to be a public, unauthenticated endpoint that handed out admin access to anyone.
router.post("/register", adminAuthMiddleware, controller.registerAdmin);
router.post("/login", authLimiter, controller.loginAdmin);
router.get("/profile", adminAuthMiddleware, controller.getAdminProfile);
router.put("/profile", adminAuthMiddleware, controller.updateAdminProfile);
router.patch("/password", adminAuthMiddleware, controller.changePassword);

module.exports = router;
