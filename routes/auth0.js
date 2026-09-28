import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const accessToken = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!accessToken) {
      return res.status(401).json({ message: "Auth0 access token is required" });
    }

    const issuer = process.env.ISSUER_BASE_URL;
    if (!issuer) {
      return res.status(500).json({ message: "Auth0 issuer is not configured" });
    }

    const userInfoResponse = await fetch(new URL("/userinfo", issuer), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      return res.status(401).json({ message: "Invalid Auth0 access token" });
    }

    const auth0User = await userInfoResponse.json();
    const { email, name, picture, sub } = auth0User;
    const { role } = req.body || {};

    if (!email || !sub) {
      return res.status(401).json({ message: "Auth0 profile is missing required claims" });
    }

    const userRole = role && ["user", "ngo", "organizer"].includes(role) ? role : "user";
    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const baseUsername =
        (name || normalizedEmail.split("@")[0]).replace(/[^a-zA-Z0-9_]/g, "") || "user";
      let username = baseUsername;
      let counter = 1;

      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter++}`;
      }

      user = await User.create({
        username,
        email: normalizedEmail,
        password: `social:${crypto.randomUUID()}`,
        role: userRole,
        profilePicture: picture || "",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const token = jwt.sign(
      { user: { id: user._id, role: user.role, auth0Sub: sub } },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
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
    return res.status(500).json({ message: "Auth0 authentication failed" });
  }
});

router.get("/me", (req, res) => {
  if (req.oidc?.isAuthenticated()) {
    return res.json({ isAuthenticated: true, user: req.oidc.user });
  }
  return res.json({ isAuthenticated: false, user: null });
});

export default router;
