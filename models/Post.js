import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, default: "Anonymous" },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    author: { type: String, required: true },
    authorAvatar: { type: String, default: "" },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: { type: [mongoose.Schema.Types.ObjectId], default: () => [] },
    comments: [commentSchema],
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
