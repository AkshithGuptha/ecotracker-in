import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import NGO from "../models/ngo.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    user = new User({
      username,
      email,
      password: hashed,
      role: 'user' // Default role for regular registration
    });
    await user.save();

    const payload = { user: { id: user._id } };
    const jwtSecret = process.env.JWT_SECRET || "ecotrack_jwt_secret_key_2026";
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

    res.json({ token, userId: user._id, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user exists in User collection
    let user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      const payload = { user: { id: user._id } };
      const jwtSecret = process.env.JWT_SECRET || "ecotrack_jwt_secret_key_2026";
      const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

      return res.json({
        token,
        userId: user._id,
        email: user.email,
        role: user.role,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }

    // Check if NGO exists in NGO collection
  // Check if NGO exists in NGO collection
let ngo = await NGO.findOne({ email });
if (ngo) {
  const isMatch = await bcrypt.compare(password, ngo.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  // ✅ FIXED PAYLOAD
  const payload = { ngo: { id: ngo._id } };
  const jwtSecret = process.env.JWT_SECRET || "ecotrack_jwt_secret_key_2026";
  const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

  return res.json({
    token,
    userId: ngo._id,
    email: ngo.email,
    role: "ngo",
    user: {
      id: ngo._id,
      organizationName: ngo.organizationName,
      email: ngo.email,
      role: "ngo"
    }
  });
}


    return res.status(400).json({ message: "Invalid credentials" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
