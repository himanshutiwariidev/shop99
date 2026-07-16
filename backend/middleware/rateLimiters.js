const rateLimit = require("express-rate-limit");

// General ceiling for all /api traffic.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// Login/register — slows down credential-stuffing and brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later." },
});

// OTP send/verify — SMS costs money per request and OTPs are brute-forceable.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests, please try again later." },
});

module.exports = { generalLimiter, authLimiter, otpLimiter };
