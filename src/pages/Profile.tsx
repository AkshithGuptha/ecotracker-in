import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { User, Award, BarChart3, Trophy, Medal, Crown, Flame, CalendarClock, Star, Leaf, CheckCircle, Lock } from "lucide-react";
import { authFetch } from "@/lib/auth";
import { getEntries, scopedKey, POINTS_EVENT, getPoints } from "@/lib/carbon";

const Profile = () => {
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    location: "",
    bio: "",
    joinDate: "",
    profilePicture: "",
  });

  const [formData, setFormData] = useState({ ...profileData });

  const [ecoGoals, setEcoGoals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [carbonStreak, setCarbonStreak] = useState<number>(0);
  const [carbonImproved, setCarbonImproved] = useState<boolean>(false);
  const [livePoints, setLivePoints] = useState<number>(() => getPoints());
  const avatarChoices = [
    "https://api.dicebear.com/7.x/thumbs/svg?seed=Leaf",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=River",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=Sun",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=Forest",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=Bamboo",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=Ocean",
  ];
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<{ title: string; target?: string; progress?: number; deadline?: string }>({ title: "" });
  const [loading, setLoading] = useState(true);

  // ✅ Fetch profile from backend (and re-fetch on points/quiz updates)
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const res = await authFetch("/api/profile");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        setProfileData(data);
        setFormData(data);
        setEcoGoals(data.ecoGoals || []);
        setActivities(data.activities || []);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Initial fetch
    fetchProfile();

    // Re-fetch handler for points/quiz/localStorage updates
    const refetch = () => {
      // Minor debounce to avoid rapid repeat refetches
      setTimeout(() => { fetchProfile(); }, 150);
    };

  // Listen for local points update events
  const onPointsEvent = () => { setLivePoints(getPoints()); refetch(); };
  window.addEventListener(POINTS_EVENT, onPointsEvent as EventListener);
    // Listen for storage changes (cross-tab) and re-fetch when quiz or user data change
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith('quiz:completed') || e.key.includes('carbon:points') || e.key === 'user' || e.key === 'userData') {
        refetch();
      }
    };
    window.addEventListener('storage', onStorage as EventListener);

    return () => { mounted = false; window.removeEventListener(POINTS_EVENT, onPointsEvent as EventListener); window.removeEventListener('storage', onStorage as EventListener); };
  }, []);

  // Compute carbon improvement/streak asynchronously
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await getEntries();
        if (!mounted) return;
        if (Array.isArray(entries) && entries.length >= 2) {
          const sorted = entries.slice().sort((a,b)=>a.date.localeCompare(b.date));
          const last = sorted[sorted.length-1];
          const prev = sorted[sorted.length-2];
          setCarbonImproved(Boolean(last && prev && last.value < prev.value));
          // compute streak
          let streak = 1;
          for (let i = sorted.length-1; i>0 && streak<4; i--) {
            if (sorted[i].value < sorted[i-1].value) streak++; else break;
          }
          setCarbonStreak(streak);
        } else {
          setCarbonImproved(false);
          setCarbonStreak(0);
        }
      } catch (err) {
        console.error('Error computing carbon streak:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ✅ Save profile to backend
  const handleUpdateProfile = async () => {
    try {
      const res = await authFetch(
        "/api/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            location: formData.location,
            bio: formData.bio,
            profilePicture: (formData as any).profilePicture,
          }),
        }
      );
      const data = await res.json();
      setProfileData(data);
      setFormData(data);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
        className: "bg-green-50 border-green-200",
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({
        title: "Update Failed",
        description: "Something went wrong while saving.",
        variant: "destructive",
      });
    }
  };

  const handleAddGoal = async () => {
    try {
      if (!newGoal.title) return;
      const res = await authFetch("/api/profile/goals", {
        method: "POST",
        body: JSON.stringify(newGoal),
      });
      const updatedGoals = await res.json();
      setEcoGoals(updatedGoals);
      setNewGoal({ title: "" });
      setShowAddGoal(false);
      toast({
        title: "New Goal Added",
        description: "Your goal was created successfully.",
        className: "bg-green-50 border-green-200",
      });
    } catch (err) {
      console.error("Error adding goal:", err);
      toast({
        title: "Failed to add goal",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <DashboardLayout>
      <div className="space-y-8 px-4 lg:px-8 py-6">
        {/* HEADER */}
        <div className="flex items-center space-x-3">
          <User className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid grid-cols-3 w-full rounded-lg bg-gray-100 p-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="history">Activity History</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */
          }
          <TabsContent value="profile" className="space-y-6">
            {/* TOP GRID: USER INFO + STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* USER INFO */}
              <Card className="shadow-lg">
                <CardHeader className="flex flex-col items-center">
                  <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-4 overflow-hidden">
                    {profileData.profilePicture ? (
                      <img src={profileData.profilePicture} alt="avatar" className="h-24 w-24 object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-green-600" />
                    )}
                  </div>
                  <CardTitle className="text-center">{profileData.username || ""}</CardTitle>
                  <CardDescription className="text-center">{profileData.location || ""}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{profileData.bio || ""}</p>
                  </div>
                </CardContent>
              </Card>

              {/* STATS */}
              <Card className="lg:col-span-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <span>Your Eco Impact</span>
                  </CardTitle>
                  <CardDescription>Summary of your environmental contributions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                      const stats = (profileData as any).stats || {};
                      // Prefer live local points (keeps parity with Dashboard) but fallback to backend stats
                      const totalPoints = typeof livePoints === 'number' && livePoints >= 0 ? livePoints : (stats.totalPoints || 0);
                      // actionCount may be computed server-side; fall back to stats
                      const actionCount = stats.actionCount || 0;
                      const eventsAttended = stats.eventsAttended || 0;
                      // Prefer local quiz completions from storage so UI updates immediately
                      const rawQuiz = localStorage.getItem(scopedKey('quiz:completed')) || localStorage.getItem('quiz:completed') || "";
                      let quizzesCompleted = stats.quizzesCompleted || 0;
                      try {
                        const map = rawQuiz ? JSON.parse(rawQuiz) : {};
                        quizzesCompleted = Object.keys(map || {}).length || quizzesCompleted;
                      } catch { /* ignore parse errors */ }
                      const treesSaved = (profileData as any).treesSaved || 0;
                      const co2Reduced = (profileData as any).co2Reduced || 0;
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-800 dark:text-green-200">{totalPoints}</div>
                          <div className="text-sm text-green-700 dark:text-green-100">Total Points</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{actionCount}</div>
                          <div className="text-sm text-blue-700 dark:text-blue-100">Eco Actions</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{eventsAttended}</div>
                          <div className="text-sm text-purple-700 dark:text-purple-100">Events Attended</div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{quizzesCompleted}</div>
                          <div className="text-sm text-yellow-700 dark:text-yellow-100">Quizzes Completed</div>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{treesSaved}</div>
                          <div className="text-sm text-emerald-700 dark:text-emerald-100">Trees Saved</div>
                        </div>
                        <div className="bg-cyan-50 dark:bg-cyan-900/30 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-cyan-800 dark:text-cyan-200">{co2Reduced}kg</div>
                          <div className="text-sm text-cyan-700 dark:text-cyan-100">CO₂ Reduced</div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* ECO GOALS (TASKS) */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span>Your Eco Goals</span>
                </CardTitle>
                <CardDescription>Track your progress toward sustainability targets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {ecoGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No goals yet. Add your first one below.</p>
                ) : (
                  ecoGoals.map((goal: any) => (
                    <div key={goal._id || goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{goal.title}</h4>
                          {goal.target && <p className="text-sm text-muted-foreground">Target: {goal.target}</p>}
                        </div>
                        <span className="text-xs px-2 py-1 rounded border">{goal.deadline || "-"}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="h-2 bg-gray-200 rounded w-full overflow-hidden">
                          <div className="h-2 bg-green-600" style={{ width: `${goal.progress || 0}%` }} />
                        </div>
                        <span className="text-sm font-medium w-12">{goal.progress || 0}%</span>
                      </div>
                    </div>
                  ))
                )}

                {!showAddGoal ? (
                  <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAddGoal(true)}>
                    + Add New Goal
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Title</Label>
                        <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g. Reduce Plastic Usage" />
                      </div>
                      <div>
                        <Label>Target</Label>
                        <Input value={newGoal.target || ""} onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })} placeholder="e.g. Avoid single-use plastic" />
                      </div>
                      <div>
                        <Label>Progress (%)</Label>
                        <Input type="number" value={newGoal.progress || 0} onChange={(e) => setNewGoal({ ...newGoal, progress: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Deadline</Label>
                        <Input type="text" value={newGoal.deadline || ""} onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })} placeholder="Month date, year" />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddGoal(false)}>Cancel</Button>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddGoal}>Save Goal</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* EDIT PROFILE */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar Picker */}
                <div className="space-y-2">
                  <Label>Profile Icon</Label>
                  <div className="flex flex-wrap gap-3">
                    {avatarChoices.map((src) => (
                      <button
                        key={src}
                        type="button"
                        className={`h-14 w-14 rounded-full overflow-hidden ring-2 ${formData.profilePicture === src ? "ring-green-600" : "ring-transparent"}`}
                        onClick={() => setFormData({ ...formData, profilePicture: src })}
                        aria-label="Choose avatar"
                      >
                        <img src={src} alt="avatar" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Input
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleUpdateProfile} className="bg-green-600 hover:bg-green-700">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACHIEVEMENTS TAB */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span>Your Achievements</span>
                </CardTitle>
                <CardDescription>Badges earned from your activity</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const stats = (profileData as any).stats || {};
                  const pts = stats.totalPoints || 0;
                  const actions = stats.actionCount || 0;
                  const quizzes = stats.quizzesCompleted || 0;
                  const days = (profileData as any).streakDays || 0;

                  const badges: Array<{ key: string; title: string; desc: string; icon: JSX.Element; color: string }>= [];
                  // Helper to push tiered badges
                  const tier = (value: number, thresholds: number[]) => thresholds.reduce((lvl, t, i) => (value >= t ? i + 1 : lvl), 0);
                  const titleWithTier = (base: string, lvl: number) => lvl > 1 ? `${base} ${['I','II','III','IV'][lvl-1]}` : base;

                  // Points tiers
                  const ptsThresholds = [100, 250, 500, 1000];
                  const ptsLvl = tier(pts, ptsThresholds);
                  if (ptsLvl >= 1) badges.push({ key: `pts-${ptsLvl}`, title: titleWithTier('Eco Earner', ptsLvl), desc: `Earned ${ptsThresholds[ptsLvl-1]}+ points`, icon: ptsLvl >= 3 ? <Crown className="h-5 w-5"/> : <Medal className="h-5 w-5"/>, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' });

                  // Actions tiers
                  const actThresholds = [10, 20, 50];
                  const actLvl = tier(actions, actThresholds);
                  if (actLvl >= 1) badges.push({ key: `act-${actLvl}`, title: titleWithTier('Action Starter', actLvl), desc: `Completed ${actThresholds[actLvl-1]}+ eco actions`, icon: <Award className="h-5 w-5"/>, color: 'bg-blue-50 text-blue-700 border-blue-200' });

                  // Quizzes tiers
                  const quizThresholds = [1, 5, 10];
                  const quizLvl = tier(quizzes, quizThresholds);
                  if (quizLvl >= 1) badges.push({ key: `quiz-${quizLvl}`, title: titleWithTier('Quiz Whiz', quizLvl), desc: `Completed ${quizThresholds[quizLvl-1]}+ quizzes`, icon: <Trophy className="h-5 w-5"/>, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' });

                  // Activity streak (days) single badge remains
                  if (days >= 7) badges.push({ key: 'streak-7', title: '7-Day Streak', desc: 'Active for 7 consecutive days', icon: <Flame className="h-5 w-5" />, color: 'bg-orange-50 text-orange-700 border-orange-200' });

                  // Quiz Grade badges (per-user, from localStorage quiz:completed::<userId>)
                  try {
                    const QUIZ_KEY = scopedKey('quiz:completed');
                    const raw = localStorage.getItem(QUIZ_KEY);
                    const map = raw ? (JSON.parse(raw) as Record<string, { score?: number }>) : {};
                    const scores = Object.values(map).map(v => Number(v?.score) || 0);
                    const best = scores.length ? Math.max(...scores) : 0;
                    if (best >= 100) badges.push({ key: 'grade-perfect', title: 'Perfect Score', desc: 'Scored 100% on a quiz', icon: <Star className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' });
                    else if (best >= 90) badges.push({ key: 'grade-a', title: 'Grade A', desc: 'Scored 90%+ on a quiz', icon: <Star className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' });
                    else if (best >= 80) badges.push({ key: 'grade-b', title: 'Grade B', desc: 'Scored 80%+ on a quiz', icon: <Star className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' });
                  } catch {}

                  // Carbon reduction badges — use async-computed state
                  if (carbonImproved) {
                    badges.push({ key: 'carbon-cutter', title: 'Carbon Cutter', desc: 'Reduced emissions vs previous day', icon: <Leaf className="h-5 w-5" />, color: 'bg-teal-50 text-teal-700 border-teal-200' });
                  }
                  if (carbonStreak >= 3) {
                    badges.push({ key: 'streak-saver', title: 'Carbon Streak', desc: 'Reduced emissions 3 days in a row', icon: <Flame className="h-5 w-5" />, color: 'bg-rose-50 text-rose-700 border-rose-200' });
                  }

                  return (
                    <div className="space-y-6">
                      {badges.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No badges yet. Keep learning and tracking to unlock achievements!</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {badges.map(b => (
                            <div
                              key={b.key}
                              className={`border rounded-lg p-4 flex items-start space-x-3 ${b.color} backdrop-blur-sm hover:shadow-lg transition transform hover:-translate-y-0.5`}
                            >
                              <div className="shrink-0">{b.icon}</div>
                              <div>
                                <div className="font-medium">{b.title}</div>
                                <div className="text-sm opacity-90">{b.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Next Milestones */}
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-700">Next Milestones</div>
                        <div className="space-y-3">
                          {/* Actions toward next level */}
                          {(() => {
                            const thresholds = actThresholds;
                            const next = thresholds.find(t => actions < t) ?? thresholds[thresholds.length-1];
                            const title = actions < 10 ? 'Action Starter I' : actions < 20 ? 'Action Starter II' : 'Action Starter III';
                            return (
                              <div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Eco Actions</span>
                                  <span>{actions}/{next} until {title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress className="flex-1" value={Math.min(100, (Math.min(actions, next)/next)*100)} />
                                  {Array.from({ length: 3 }).map((_,i) => {
                                    const earned = actions >= (i===0?10:i===1?20:50);
                                    return earned ? (
                                      <Award key={i} className="h-4 w-4 text-blue-600 transition-transform duration-300" aria-label={`Unlocked: ${i===0?'10':i===1?'20':'50'} actions`} />
                                    ) : (
                                      <Award key={i} className="h-4 w-4 text-blue-400 opacity-30" aria-hidden />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                          {/* Points toward next level */}
                          {(() => {
                            const thresholds = ptsThresholds;
                            const next = thresholds.find(t => pts < t) ?? thresholds[thresholds.length-1];
                            const lvlName = pts < 100 ? 'Eco Earner I' : pts < 250 ? 'Eco Earner II' : pts < 500 ? 'Eco Earner III' : 'Eco Earner IV';
                            return (
                              <div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Points</span>
                                  <span>{pts}/{next} until {lvlName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress className="flex-1" value={Math.min(100, (Math.min(pts, next)/next)*100)} />
                                  {Array.from({ length: 4 }).map((_,i) => {
                                    const thr = i===0?100:i===1?250:i===2?500:1000;
                                    const earned = pts >= thr;
                                    const Icon = i>=2 ? Crown : Medal;
                                    return earned ? (
                                      <Icon key={i} className="h-4 w-4 text-emerald-600 transition-transform duration-300" aria-label={`Unlocked: ${thr}+ points`} />
                                    ) : (
                                      <Icon key={i} className="h-4 w-4 text-emerald-400 opacity-30" aria-hidden />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                          {/* Quizzes toward next level */}
                          {(() => {
                            const thresholds = quizThresholds;
                            const next = thresholds.find(t => quizzes < t) ?? thresholds[thresholds.length-1];
                            const lvlName = quizzes < 1 ? 'Quiz Whiz I' : quizzes < 5 ? 'Quiz Whiz II' : 'Quiz Whiz III';
                            return (
                              <div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Quizzes</span>
                                  <span>{quizzes}/{next} until {lvlName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress className="flex-1" value={Math.min(100, (Math.min(quizzes, next)/next)*100)} />
                                  {Array.from({ length: 3 }).map((_,i) => {
                                    const thr = i===0?1:i===1?5:10;
                                    const earned = quizzes >= thr;
                                    return earned ? (
                                      <Trophy key={i} className="h-4 w-4 text-yellow-600 transition-transform duration-300" aria-label={`Unlocked: ${thr} quizzes`} />
                                    ) : (
                                      <Trophy key={i} className="h-4 w-4 text-yellow-400 opacity-30" aria-hidden />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                          {/* Streak toward 7-Day Streak */}
                          <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Activity Streak</span>
                              <span>{days}/7 until 7-Day Streak</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress className="flex-1" value={Math.min(100, (days/7)*100)} />
                              {days >= 7 ? (
                                <Flame className="h-4 w-4 text-orange-600 transition-transform duration-300" aria-label="Unlocked: 7-day streak" />
                              ) : (
                                <Flame className="h-4 w-4 text-orange-400 opacity-30" aria-hidden />
                              )}
                            </div>
                          </div>
                          {/* Carbon reduction streak toward 3 */}
                          <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Carbon Reduction Streak</span>
                              <span>{Math.min(carbonStreak,3)}/3 until Carbon Streak</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress className="flex-1" value={Math.min(100, (Math.min(carbonStreak,3)/3)*100)} />
                              {Array.from({ length: 3 }).map((_,i) => (
                                i < carbonStreak ? (
                                  <Flame key={i} className="h-4 w-4 text-rose-600 transition-transform duration-300" aria-label={`Unlocked: day ${i+1} reduced`} />
                                ) : (
                                  <Flame key={i} className="h-4 w-4 text-rose-400 opacity-30" aria-hidden />
                                )
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY HISTORY TAB */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarClock className="h-5 w-5 text-purple-600" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Track your actions, quizzes and changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                {activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice().reverse().map((a: any, idx: number) => (
                      <div key={a._id || idx} className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <div className="font-medium capitalize">{a.type || 'activity'}</div>
                          <div className="text-sm text-muted-foreground">{a.description || a.title || '-'}</div>
                        </div>
                        <div className="text-right">
                          {typeof a.points === 'number' && (
                            <div className={`text-sm font-semibold ${a.points >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                              {a.points >= 0 ? `+${a.points}` : a.points} pts
                            </div>
                          )}
                          <div className="text-xs text-gray-500">{a.date ? new Date(a.date).toLocaleString() : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No activities yet. Your quiz completions and carbon saves will appear here.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
