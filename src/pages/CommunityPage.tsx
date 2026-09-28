import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Heart, MessageCircle, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { getToken, authFetch } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const CommunityPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const navigate = useNavigate();

  // 🔹 Logged in user display name (fetched on first load for client display only)
  const [displayName, setDisplayName] = useState<string>("");
  const [myUserId, setMyUserId] = useState<string>("");

  // Loading animation component
  const LoadingFox = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-24 h-24 mb-4">
        <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
          <div className="text-4xl">🦊</div>
        </div>
      </div>
      <p className="text-gray-500">Loading community posts...</p>
    </div>
  );

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/community/leaderboard");
        if (response.ok) {
          const data = await response.json();
          setLeaderboardData(data);
        } else {
          console.error("Failed to fetch leaderboard");
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const featuredStories = [
    { image: "/placeholder.svg", title: "Solar Success Story", description: "How the Johnson family reduced their carbon footprint by 70% with solar panels and smart home tech." },
    { image: "/placeholder.svg", title: "Urban Gardening Revolution", description: "Community transforms abandoned lot into thriving urban garden, feeding 50+ families sustainably." },
    { image: "/placeholder.svg", title: "Zero Waste Champion", description: "Local business eliminates 99% of waste through innovative recycling and composting programs." },
  ];

  // 🔹 Check if a post is expired (older than 24 hours)
  const isPostExpired = (createdAt: string): boolean => {
    if (!createdAt) return true; // Treat missing or invalid dates as expired
    
    const postDate = new Date(createdAt);
    // Handle invalid date
    if (isNaN(postDate.getTime())) return true;
    
    const now = new Date();
    const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 24; // 24 hours TTL
  };

  // 🔹 Filter out expired posts and update state if needed
  const filterExpiredPosts = useCallback((posts: any[]): any[] => {
    const validPosts = posts.filter(post => {
      const isExpired = isPostExpired(post.createdAt);
      // If post is expired and not yet marked as expired, log it
      if (isExpired && !post._expired) {
        console.log(`Removing expired post: ${post._id}`, {
          createdAt: post.createdAt,
          content: post.content?.substring(0, 50) + '...'
        });
      }
      return !isExpired;
    });
    
    // Only update state if posts were actually removed
    if (validPosts.length < posts.length) {
      setPosts(validPosts);
    }
    
    return validPosts;
  }, []);

  // 🔹 Fetch and process posts
  const fetchAndProcessPosts = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return [];
      }

      // Get user profile
      const profileRes = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!profileRes.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const userData = await profileRes.json();
      setDisplayName(userData.username || userData.email || "");
      const userId = String(userData._id);
      setMyUserId(userId);

      // Fetch posts for the current user
      const postsRes = await fetch(`/api/community?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store' // Prevent caching to always get fresh data
      });

      if (!postsRes.ok) {
        throw new Error('Failed to fetch user posts');
      }
      
      let userPosts = await postsRes.json();
      
      // Filter out any expired posts that might have slipped through
      userPosts = filterExpiredPosts(userPosts);
      
      // Sort by creation date (newest first) and filter out any expired posts
      userPosts = userPosts
        .filter((post: any) => !isPostExpired(post.createdAt))
        .sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      
      return userPosts;
    } catch (err) {
      console.error("Error fetching posts:", err);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  }, [navigate, filterExpiredPosts]);

  // 🔹 Initial fetch and setup
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      setIsLoadingPosts(true);
      try {
        const posts = await fetchAndProcessPosts();
        if (isMounted) {
          setPosts(posts);
        }
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      }
    };
    
    loadInitialData();
    
    // Set up refresh interval (every 5 minutes)
    const refreshInterval = setInterval(async () => {
      if (!isLoadingPosts && isMounted) {
        console.log('Refreshing posts...');
        try {
          const updatedPosts = await fetchAndProcessPosts();
          if (isMounted) {
            setPosts(updatedPosts);
          }
        } catch (error) {
          console.error("Error refreshing posts:", error);
        }
      }
    }, 5 * 60 * 1000);
    
    // Set up expiration check (every minute)
    const expirationCheck = setInterval(() => {
      if (!isLoadingPosts && isMounted) {
        setPosts(prevPosts => filterExpiredPosts([...prevPosts]));
      }
    }, 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
      clearInterval(expirationCheck);
    };
  }, [fetchAndProcessPosts, isLoadingPosts]);

  // 🔹 Add new post (uses /api/community)
  const handleAddPost = async () => {
    if (!newPost.trim()) return;
    try {
      setIsPosting(true);
      const res = await authFetch("/api/community", {
        method: "POST",
        body: JSON.stringify({ content: newPost }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('Community post creation failed', errBody);
        throw new Error(errBody.error || "Failed to post");
      }

      const created = await res.json();
      // Refresh posts list from server to ensure consistent ordering and TTL filtering
      const refreshed = await fetchAndProcessPosts();
      setPosts([created, ...refreshed.filter(p => p._id !== created._id)]);
      setNewPost("");
    } catch (err) {
      console.error("Error adding community post:", err);
      toast({ title: "Could not post", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  // 🔹 Like a post (toggle)
  const handleLike = async (postId: string) => {
    try {
      const res = await authFetch(`/api/community/${postId}/like`, { method: "POST" });
      if (!res.ok) {
        console.error('Like failed', await res.text().catch(() => '')); return;
      }
      const updated = await res.json();
      setPosts(posts.map((p) => (p._id === postId ? updated : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const isLikedByMe = (post: any) => {
    if (!myUserId) return false;
    return Array.isArray(post.likedBy) && post.likedBy.some((id: any) => String(id) === String(myUserId));
  };

  // 🔹 Add a comment to community post
  const handleComment = async (postId: string, text: string) => {
    if (!text.trim()) return;
    try {
      const res = await authFetch(`/api/community/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        console.error('Comment failed', await res.text().catch(() => '')); return;
      }
      const updated = await res.json();
      setPosts(posts.map((p) => (p._id === postId ? updated : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const res = await authFetch(`/api/community/${postId}`, { 
        method: "DELETE" 
      });
      
      if (res.ok) {
        setPosts(posts.filter((p) => p._id !== postId));
        toast({
          title: "Success",
          description: "Post deleted successfully",
          variant: "default"
        });
      } else {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  // Add TTL indicator to show when posts will expire
  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expires = new Date(created.getTime() + 24 * 60 * 60 * 1000); // 24 hours from creation
    const now = new Date();
    
    if (now > expires) return "Expires soon";
    
    const hoursLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    return `Expires in ${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community Hub</h1>
          <p className="text-muted-foreground">Connect, share, and grow together in our eco-community</p>
        </div>

        {/* Leaderboard Section */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Eco Leaders
            </CardTitle>
            <CardDescription>Top environmental champions this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingLeaderboard ? (
                <div className="flex justify-center items-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : leaderboardData.length > 0 ? (
                leaderboardData.map((user) => (
                  <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {user.rank}
                      </div>
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">CO₂ Saved: {user.co2Saved}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{user.score} points</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No leaderboard data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Community Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Community Feed
            </CardTitle>
            <CardDescription>Share your green journey with others</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add new post */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPost();
                }}
              />
              <Button onClick={handleAddPost} disabled={isPosting}>
                {isPosting ? "Posting..." : "Post"}
              </Button>
            </div>

            {/* Render posts */}
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post._id} className="border-b border-border pb-4 last:border-b-0">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      {post.authorAvatar ? (
                        <AvatarImage src={post.authorAvatar} />
                      ) : (
                        <AvatarFallback>
                          {post.author?.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{post.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-foreground mb-3">{post.content}</p>

                  {/* Like Button */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-1 transition-colors ${isLikedByMe(post) ? "text-red-500" : "hover:text-red-500"}`}
                        title="Like"
                      >
                        <Heart className={`h-4 w-4 ${isLikedByMe(post) ? "fill-red-500 text-red-500" : ""}`} />
                        {post.likes || 0}
                      </button>
                      
                      {/* Only show delete button if current user is the post author */}
                      {post.user && String(post.user._id) === myUserId && (
                        <button
                          onClick={() => handleDelete(post._id)}
                          className="text-sm text-red-600 hover:text-red-800 transition-colors"
                          title="Delete post"
                        >
                          Delete
                        </button>
                      )}
                      
                      {/* Show time remaining until expiration */}
                      {post.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {getTimeRemaining(post.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {post.comments.map((c: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-sm text-foreground bg-muted/40 p-2 rounded"
                        >
                          <span className="font-medium">{c.author || "Anonymous"}: </span>
                          {c.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Write a reply..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
                          handleComment(post._id, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        if (input.value.trim() !== "") {
                          handleComment(post._id, input.value);
                          input.value = "";
                        }
                      }}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Featured Stories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              Featured Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featuredStories.map((story, index) => (
                <div key={index} className="flex gap-3 p-3 border border-border rounded-lg">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-16 h-16 rounded-lg object-cover bg-muted"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm">{story.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{story.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CommunityPage;
