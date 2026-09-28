import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { auth } from "express-openid-connect";

import authRoutes from "./routes/auth.js";
import googleAuthRouter from "./routes/google.js";
import auth0AuthRouter from "./routes/auth0.js";
import profileRoutes from "./routes/profile.js";
import carbonRoutes from "./routes/carbon.js";
import postsRoutes from "./routes/posts.js";
import eventsRoutes from "./routes/events.js";
import surveyRoutes from "./routes/survey.js";
import uploadsRoutes from "./routes/uploads.js";
import ngoRoutes from "./routes/ngo.js";
import productsRoutes from "./routes/products.js";
import rewardsRoutes from "./routes/rewards.js";
import rewardsNgoRoutes from "./routes/rewards-ngo.js";
import contactRoutes from "./routes/contact.js";
import registrationsRoutes from "./routes/registrations.js";
import quizzesRoutes from "./routes/quizzes.js";
import communityRoutes from "./routes/community.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Needed because this file uses ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------
// CORS
// --------------------
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        ALLOWED_ORIGINS.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked from origin ${origin}`));
    },
    credentials: true,
  })
);

// --------------------
// Middleware
// --------------------
app.use(express.json({ limit: "10mb" }));

// --------------------
// Auth0 OpenID Connect Middleware
// --------------------
const auth0Config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET || process.env.AUTH0_SECRET,
  baseURL: process.env.BASE_URL || "http://localhost:5000",
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  ...(process.env.CLIENT_SECRET ? { clientSecret: process.env.CLIENT_SECRET } : { clientAuthMethod: "none" }),
};

if (auth0Config.secret && auth0Config.clientID && auth0Config.issuerBaseURL) {
  app.use(auth(auth0Config));

  app.get("/signup", (req, res) =>
    res.oidc.login({
      returnTo: "/",
      authorizationParams: { screen_hint: "signup" },
    })
  );
}


// --------------------
// MongoDB
// --------------------
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("❌ MONGODB_URI is not configured");
} else {
  mongoose
    .connect(mongoURI)
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) =>
      console.error("❌ MongoDB connection error:", err)
    );
}

// --------------------
// Health check route
// --------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// --------------------
// API routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/auth/google", googleAuthRouter);
app.use("/api/auth/auth0", auth0AuthRouter);
app.use("/api/profile", profileRoutes);
app.use("/api/carbon", carbonRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/ngo", ngoRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/rewards/ngo", rewardsNgoRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/registrations", registrationsRoutes);
app.use("/api/quizzes", quizzesRoutes);
app.use("/api/community", communityRoutes);

// --------------------
// Serve uploaded files
// --------------------
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"))
);

// --------------------
// Serve React production build
// --------------------
const frontendPath = path.join(__dirname, "dist");

app.use(express.static(frontendPath));

// React Router fallback
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});

// --------------------
// Start server
// --------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
