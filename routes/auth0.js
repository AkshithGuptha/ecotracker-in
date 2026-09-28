import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

// ✅ POST /api/auth/auth0
router.post("/", async (req, res) => {
  try {
    const { email, name, picture, sub, role } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "Email is required from Auth0 profile" });
    }

    const userRole = (role && ['user', 'ngo', 'organizer'].includes(role)) ? role : 'user';

    let user = await User.findOne({ email });

    if (!user) {
      let baseUsername = (name || email.split("@")[0]).replace(/[^a-zA-Z0-9_]/g, "");
      if (!baseUsername) baseUsername = "user";
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter++}`;
      }

      user = new User({
        username,
        email,
        password: "", // Auth0 authenticated user
        role: userRole,
        profilePicture: picture || "",
      });
      await user.save();
    }

    const jwtSecret = process.env.JWT_SECRET || "ecotrack_jwt_secret_key_2026";
    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      role: user.role,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error("Auth0 authentication error:", err);
    res.status(500).json({ message: "Auth0 authentication failed: " + err.message });
  }
});

// ✅ GET /api/auth/auth0/me (Returns current OIDC user session info)
router.get("/me", (req, res) => {
  if (req.oidc && req.oidc.isAuthenticated()) {
    return res.json({
      isAuthenticated: true,
      user: req.oidc.user,
    });
  }
  return res.json({
    isAuthenticated: false,
    user: null,
  });
});

export default router;
