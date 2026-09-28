import express from "express";
import mongoose from "mongoose";
import Community from "../models/Community.js";
import User from "../models/user.js";
import auth from "../middleware/auth.js";

// Add TTL index for auto-deleting posts after 24 hours
const TTL_24H = 24 * 60 * 60; // 24 hours in seconds

// Create TTL index if it doesn't exist
Community.collection.createIndex(
  { createdAt: 1 }, 
  { expireAfterSeconds: TTL_24H, name: "posts_ttl" }
).catch(console.error);

const router = express.Router();

// Get leaderboard - top 5 users by points
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await User.find({}, 'username profilePicture points')
      .sort({ points: -1 })
      .limit(5)
      .lean();
    
    // Add rank and format the data
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      name: user.username,
      score: user.points || 0,
      co2Saved: `${Math.floor((user.points || 0) * 0.15)} kg`, // Example calculation: 1 point = 0.15kg CO2 saved
      avatar: user.profilePicture || "/placeholder.svg"
    }));
    
    res.json(rankedLeaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// List posts (filtered by user if userId query param is provided)
router.get("/", auth, async (req, res) => {
  try {
    const { userId } = req.query;
    const query = {};
    
    if (userId) {
      // Only return posts for the specified user
      if (!req.user || String(userId) !== String(req.user._id)) {
        return res.status(403).json({ error: "Unauthorized access to user posts" });
      }
      query.user = userId;
    }
    
    const posts = await Community.find(query)
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 }); // Newest first
      
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Add post
router.post("/", auth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { content } = req.body;
    if (!content || !String(content).trim()) return res.status(400).json({ error: 'Content required' });

    const post = new Community({ 
      content: String(content).trim(),
      user: req.user._id,
      author: req.user.username || req.user.email || 'User',
      authorAvatar: req.user.profilePicture || ''
    });
    try {
      const saved = await post.save();
      console.log(`[community] Saved post ${saved._id} by user ${req.user._id}`);
      const populatedPost = await Community.findById(saved._id).populate("user", "username profilePicture");
      return res.status(201).json(populatedPost);
    } catch (saveErr) {
      console.error('[community] Error saving post:', saveErr);
      return res.status(500).json({ error: 'Failed to save post', details: String(saveErr.message || saveErr) });
    }
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Like a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: 'Invalid post id' });
    const post = await Community.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const userId = req.user._id;
    if (post.likedBy.some(id => String(id) === String(userId))) {
      // toggle: remove like
      post.likedBy = post.likedBy.filter(id => String(id) !== String(userId));
    } else {
      post.likedBy.push(userId);
    }
    post.likes = post.likedBy.length;
    await post.save();
    const populated = await Community.findById(post._id).populate('user', 'username profilePicture');
    res.json(populated);
  } catch (err) {
    console.error('Like error', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Add a comment
router.post('/:postId/comment', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'Comment required' });
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: 'Invalid post id' });
    const post = await Community.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const author = req.user.username || req.user.email || 'Anonymous';
    post.comments.push({ text: String(text).trim(), author });
    await post.save();
    const populated = await Community.findById(post._id).populate('user', 'username profilePicture');
    res.json(populated);
  } catch (err) {
    console.error('Comment error', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete a post (only by owner or admin)
router.delete("/:postId", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Validate post ID format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    
    // Find the post first
    const post = await Community.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Check if the current user is the owner of the post
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (String(post.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: "Unauthorized: You can only delete your own posts" 
      });
    }
    
    // Delete the post
    await Community.findByIdAndDelete(postId);
    
    res.json({ success: true, message: "Post deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
