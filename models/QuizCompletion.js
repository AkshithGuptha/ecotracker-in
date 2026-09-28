import mongoose from "mongoose";

const QuizCompletionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  completedAt: { type: Date, default: Date.now },
});

export default mongoose.model("QuizCompletion", QuizCompletionSchema);
