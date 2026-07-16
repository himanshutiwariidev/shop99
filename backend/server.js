const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const crypto = require("crypto");
const helmet = require("helmet");
const hpp = require("hpp");
const compression = require("compression");
const { DataTypes } = require("sequelize");

const sequelize = require("./config/db");
require("./models/relations");
const { generalLimiter } = require("./middleware/rateLimiters");
const app = express();

// Behind Nginx: needed for correct client IPs (rate limiting) and secure cookies.
app.set("trust proxy", 1);

/* ================= MIDDLEWARE ================= */

// JSON API only — no HTML is served here, so the default CSP would just add
// noise. Other helmet protections (HSTS, noSniff, frameguard, etc.) still apply.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(hpp());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  "https://shop99.co.in",
  "https://www.shop99.co.in",
  "https://admin.shop99.co.in",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl, server-to-server, mobile apps) with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use("/api", generalLimiter);

/* ================= ROUTES ================= */

/* ================= ROUTES ================= */
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/shipping", require("./routes/shippingRoutes"));
app.use("/api/banners", require("./routes/bannerRoutes"));
app.use("/api/brands", require("./routes/brandRoutes"));
// app.use("/api/settings", require("./routes/settingRoutes"));

app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin-auth", require("./routes/adminAuthRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"))
app.use("/api/user-addresses", require("./routes/userAddressRoutes"))
app.use("/api/wishlist", require("./routes/wishlistRoutes"))

app.use("/api/reviews", require("./routes/productReviewRoutes"));

app.use("/api/payment", require("./routes/paymentRoutes"))

app.use("/api/orders", require("./routes/orderRoutes"))

app.use("/api/offers", require("./routes/offerRoutes"));

app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/attributes", require("./routes/attributeRoutes"));
app.use("/api/category-attributes", require("./routes/categoryAttributeRoutes"));

app.use("/api/product-attributes", require("./routes/productAttributeRoutes"));
app.use("/api/product-variants", require("./routes/productVariantRoutes"));


app.use("/api/otp", require("./routes/otpRoutes"));

app.use("/api/seo", require("./routes/seoRoutes"));

app.use("/api/footer", require("./routes/footerRoutes"));
app.use("/api/about", require("./routes/aboutRoutes"));
app.use(
  "/api/newsletter-subscriptions",
  require("./routes/newsletterSubscriptionRoutes")
);

app.use("/api/popular-products", require("./routes/popularProductRoutes"));
app.use("/api/most-selling-products", require("./routes/mostSellingProductRoutes"));
app.use("/api/latest-products", require("./routes/latestProductRoutes"));
app.use("/api/deals", require("./routes/dealRoutes"));
app.use("/api/blogs", require("./routes/blogsRoutes"));

/* ================= SERVER START ================= */
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB Connected");

    await sequelize.sync(); // ⭐ auto create tables
    // await sequelize.sync({ alter: true });
    console.log("✅ Tables Synced");
    const PORT = process.env.PORT || 9001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

  } catch (err) {
    console.error("❌ DB Error:", err);
  }
};



start();

