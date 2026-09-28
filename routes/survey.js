import express from "express";
import Survey from "../models/Survey.js";
import fetch from "node-fetch";

const router = express.Router();

// Generate survey using AI
router.get("/generate/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an assistant generating eco-survey questions." },
          { role: "user", content: "Generate 5 questions to calculate a person's carbon footprint (transport, energy, food, lifestyle)." }
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    const questions = generatedText
      .split("\n")
      .filter(q => q.trim() !== "")
      .map(q => ({ question: q, generatedByAI: true }));

    const newSurvey = new Survey({ userId, questions });
    await newSurvey.save();

    res.json({ survey: newSurvey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Save answers
router.post("/answer/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { answers } = req.body;

    const survey = await Survey.findById(surveyId);
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    survey.questions.forEach((q, i) => {
      q.answer = answers[i] || "";
    });

    await survey.save();
    res.json({ message: "Answers saved", survey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

