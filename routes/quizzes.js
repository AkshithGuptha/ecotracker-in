import express from "express";
import auth from "../middleware/auth.js";
import Quiz from "../models/Quiz.js";
import QuizCompletion from "../models/QuizCompletion.js";

const router = express.Router();

// Get all quizzes (global, can add filtering later)
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find().select('-__v');
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get specific quiz by ID
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's quiz completions (personalized)
router.get("/completions", auth, async (req, res) => {
  try {
    const completions = await QuizCompletion.find({ user: req.user._id })
      .populate('quiz', 'title points')
      .sort({ completedAt: -1 });
    res.json(completions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Complete a quiz (personalized, with cooldown and points)
router.post("/complete", auth, async (req, res) => {
  try {
    const { quizId, score } = req.body;

    // Check cooldown (24 hours)
    const recentCompletion = await QuizCompletion.findOne({
      user: req.user._id,
      quiz: quizId,
      completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentCompletion) {
      return res.status(400).json({ message: "You can only complete this quiz once per day" });
    }

    // Create completion
    const completion = new QuizCompletion({
      user: req.user._id,
      quiz: quizId,
      score: score
    });
    await completion.save();

    // Award points based on score
    const quiz = await Quiz.findById(quizId);
    const basePoints = quiz.points || 100;
    const awardedPoints = Math.round(basePoints * (score / 100));

    // Update user stats
    req.user.stats.totalPoints += awardedPoints;
    req.user.stats.quizzesCompleted += 1;
    await req.user.save();

    // Populate quiz in completion for response
    await completion.populate('quiz');

    res.json({
      completion,
      awardedPoints
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
