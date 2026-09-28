import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";

const router = express.Router();

// ✅ POST /api/auth/google
router.post("/", async (req, res) => {
  try {
    const { credential, role } = req.body || {};
    if (!credential) {
      return res.status(400).json({ message: "No credential provided" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ message: "Google authentication is not configured" });
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload || {};
    if (!email) {
      return res.status(400).json({ message: "Google token missing email information" });
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
        password: "",
        role: userRole,
        profilePicture: picture || "",
      });
      await user.save();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ message: "JWT_SECRET is not configured" });
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
    console.error("Google authentication error:", err);
    res.status(500).json({ message: "Google authentication failed: " + err.message });
  }
});

export default router;
