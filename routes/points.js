import express from "express";
import User from "../models/user.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /api/points
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("points");
    res.json({ points: user.points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/points/redeem
router.post("/redeem", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (user.points < amount) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    user.points -= amount;
    await user.save();

    res.json({ message: "Points redeemed", points: user.points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;