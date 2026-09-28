import express from "express";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get logged-in user's profile
router.get("/", auth, async (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.password; // remove password before sending
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update profile
router.put("/", auth, async (req, res) => {
  try {
    const { username, email, location, bio, profilePicture } = req.body;
    const user = req.user;

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Add Eco Goal
router.post("/goals", auth, async (req, res) => {
  try {
    const user = req.user;
    user.ecoGoals.push(req.body);
    await user.save();
    res.json(user.ecoGoals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add goal" });
  }
});

// Update Goal Progress
router.put("/goals/:goalId", auth, async (req, res) => {
  try {
    const user = req.user;
    const goal = user.ecoGoals.id(req.params.goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    goal.progress = req.body.progress ?? goal.progress;
    await user.save();

    res.json(goal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update goal" });
  }
});

// Add Activity
router.post("/activities", auth, async (req, res) => {
  try {
    const user = req.user;
    const { type, points } = req.body;

    user.activities.push(req.body);

    // Update stats
    user.stats.totalPoints += points || 0;
    if (type === "action") user.stats.actionCount++;
    if (type === "event") user.stats.eventsAttended++;
    if (type === "quiz") user.stats.quizzesCompleted++;

    await user.save();

    res.json(user.activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to log activity" });
  }
});

// Change password
router.put("/password", auth, async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong current password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update password" });
  }
});

export default router;
