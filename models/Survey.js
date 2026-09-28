import mongoose from "mongoose";

const SurveySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: [
    {
      question: { type: String, required: true },
      answer: { type: String },
      generatedByAI: { type: Boolean, default: true }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Survey", SurveySchema);
