import express from "express";
import Post from "../models/Post.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Get a single post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Create new post
router.post("/", auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }
    const user = req.user;
    const displayName = user.username || user.email || "User";
    const newPost = new Post({ userId: user._id, author: displayName, authorAvatar: user.profilePicture || "", content });
    try {
      const saved = await newPost.save();
      console.log(`[posts] Saved post ${saved._id} by user ${user._id}`);
      return res.status(201).json(saved);
    } catch (saveErr) {
      console.error('[posts] Error saving post:', saveErr);
      return res.status(500).json({ error: 'Failed to save post', details: String(saveErr.message || saveErr) });
    }
  } catch (err) {
    console.error('[posts] Create post error:', err);
    res.status(500).json({ error: "Failed to create post", details: String(err.message || err) });
  }
});

// Like a post (unique per user)
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user._id;
    const hasLiked = post.likedBy.some((id) => String(id) === String(userId));
    if (hasLiked) {
      return res.status(400).json({ error: "Already liked" });
    }
    post.likedBy.push(userId);
    post.likes = post.likedBy.length;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to like post" });
  }
});

// Add a comment
router.post("/:id/comment", async (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ text, author: author || "Anonymous" });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Delete a post (owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const user = req.user;
    if (post.userId?.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
