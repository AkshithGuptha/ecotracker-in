import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, default: "Anonymous" },
  createdAt: { type: Date, default: Date.now },
});

const CommunitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    author: { type: String, required: true },
    authorAvatar: { type: String, default: "" },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: { type: [mongoose.Schema.Types.ObjectId], default: () => [] },
    comments: { type: [commentSchema], default: () => [] },
  },
  { timestamps: true }
);

export default mongoose.model("Community", CommunitySchema);
