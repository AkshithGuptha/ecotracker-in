import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Leaf,
  Award,
  TrendingDown,
  Target,
  BookOpen,
  Calendar,
  Zap,
  Globe,
  ArrowUpRight,
  ShieldCheck,
  Activity
} from "lucide-react";
import { getWeeklyData, getPoints, POINTS_EVENT, getEntries, scopedKey, WeeklyDatum } from "@/lib/carbon";
import { DigitalEarth } from "@/components/Earth/DigitalEarth";
import { AnimatedNumber } from "@/components/Motion/AnimatedNumber";
import { Reveal } from "@/components/Motion/Reveal";

const Dashboard = () => {
  // Dynamic dashboard stats
  const [pointsToday, setPointsToday] = useState(0);
  const [actionsTaken, setActionsTaken] = useState(0);
  const [goalStreak, setGoalStreak] = useState(0);
  const [weekly, setWeekly] = useState<WeeklyDatum[]>([]);

  const DAY_BASE_KEY = scopedKey("dashboard:points:baseline");

  const startOfDay = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  const ensureBaseline = () => {
    const todayISO = toISO(startOfDay());
    const key = `${DAY_BASE_KEY}:${todayISO}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, String(getPoints()));
    }
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(`${DAY_BASE_KEY}:`) && !k.endsWith(todayISO)) {
        try { localStorage.removeItem(k); } catch {}
      }
    });
  };

  const getBaseline = () => {
    const key = `${DAY_BASE_KEY}:${toISO(startOfDay())}`;
    return parseInt(localStorage.getItem(key) || "0", 10) || 0;
  };

  const getQuizCompletedMap = (): Record<string, { score: number; completedAt: number }> => {
    try {
      const raw = localStorage.getItem("quiz:completed");
      const parsed: Record<string, any> = raw ? JSON.parse(raw) : {};
      const normalized: Record<string, { score: number; completedAt: number }> = {};
      Object.keys(parsed || {}).forEach((k) => {
        const v = parsed[k] || {};
        const score = typeof v.score === "number" ? v.score : 0;
        const ts = typeof v.completedAt === "number" ? v.completedAt : Date.now();
        if (Number.isFinite(ts) && ts > 0) {
          normalized[k] = { score, completedAt: ts };
        }
      });
      return normalized;
    } catch {
      return {};
    }
  };

  const isSameDay = (a: Date, b: Date) => Number.isFinite(a.getTime()) && a.toDateString() === b.toDateString();

  async function computeActionsToday() {
    const today = startOfDay();
    const entries = await getEntries();
    const hasCarbonToday = entries.some((e) => e.date === toISO(today));
    const qmap = getQuizCompletedMap();
    const quizToday = Object.values(qmap).filter((r) => {
      const d = new Date(r.completedAt);
      return isSameDay(d, today);
    }).length;
    return (hasCarbonToday ? 1 : 0) + quizToday;
  }

  async function computeStreak() {
    const entries = await getEntries();
    const qmap = getQuizCompletedMap();
    const actionDates = new Set<string>();
    entries.forEach((e) => actionDates.add(e.date));
    Object.values(qmap).forEach((r) => {
      const d = new Date(r.completedAt);
      if (Number.isFinite(d.getTime())) actionDates.add(toISO(d));
    });
    let streak = 0;
    const d = startOfDay();
    while (true) {
      const iso = toISO(d);
      if (actionDates.has(iso)) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  async function refreshStats() {
    ensureBaseline();
    const baseline = getBaseline();
    const current = getPoints();
    setPointsToday(Math.max(0, current - baseline));
    const actions = await computeActionsToday();
    setActionsTaken(actions);
    const streak = await computeStreak();
    setGoalStreak(streak);
    const weeklyData = await getWeeklyData();
    setWeekly(weeklyData);
  }

  useEffect(() => {
    refreshStats();
    const onPoints = () => refreshStats();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return refreshStats();
      if (e.key.startsWith("carbon:") || e.key.startsWith("quiz:")) refreshStats();
    };
    window.addEventListener(POINTS_EVENT, onPoints as EventListener);
    window.addEventListener("storage", onStorage);
    const id = setInterval(refreshStats, 60_000);
    return () => {
      window.removeEventListener(POINTS_EVENT, onPoints as EventListener);
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, []);

  const challenges = [
    { title: "Use Public Transport", progress: 75, target: "5 days this week" },
    { title: "Reduce Food Waste", progress: 60, target: "3 meals saved" },
    { title: "Energy Conservation", progress: 90, target: "20% reduction" },
  ];

  const maxEmissions = Math.max(...weekly.map((d) => d.value), 1);
  const todayEntry = weekly.length > 0 ? weekly[weekly.length - 1].value : 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#050807] text-white p-2 md:p-6 space-y-8 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#18A66A]/20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18A66A]/10 border border-[#39FF88]/30 text-[#39FF88] text-xs font-mono tracking-wider uppercase">
              <Globe className="w-3.5 h-3.5" /> PERSONAL EARTH CONTROL CENTER
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent mt-1">
              Steward Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/tracker">
              <Button className="bg-[#39FF88] hover:bg-[#18A66A] text-[#050807] font-bold text-xs uppercase font-mono tracking-wider rounded-full px-5">
                + Log Carbon Activity
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Dashboard Centerpiece: Mini Interactive Earth & Telemetry */}
        <Reveal direction="up">
          <Card className="bg-[#07110D]/90 border border-[#18A66A]/30 backdrop-blur-2xl text-white shadow-2xl p-6 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Mini Earth 3D Widget */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#18A66A]/20 pb-6 lg:pb-0 lg:pr-6">
                <DigitalEarth size="md" className="w-[260px] h-[260px]" scrollDriven={false} />
                <span className="text-[10px] font-mono text-[#39FF88] uppercase tracking-widest mt-2 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#39FF88]" /> Live Telemetry Synced
                </span>
              </div>

              {/* Core Telemetry Cards around Mini Earth */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-zinc-950/80 border border-[#18A66A]/30 space-y-1">
                  <div className="text-xs font-mono text-[#7D8C85] uppercase">Today's CO₂ Output</div>
                  <div className="text-3xl font-black font-mono text-white">
                    <AnimatedNumber value={todayEntry} decimals={1} suffix=" kg" />
                  </div>
                  <div className="text-[11px] font-mono text-[#39FF88]">↓ 18% from yesterday</div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-950/80 border border-[#18A66A]/30 space-y-1">
                  <div className="text-xs font-mono text-[#7D8C85] uppercase">Points Earned Today</div>
                  <div className="text-3xl font-black font-mono text-[#39FF88]">
                    +<AnimatedNumber value={pointsToday} decimals={0} />
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">Total: {getPoints()} pts</div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-950/80 border border-[#18A66A]/30 space-y-1">
                  <div className="text-xs font-mono text-[#7D8C85] uppercase">Active Goal Streak</div>
                  <div className="text-3xl font-black font-mono text-[#1687D9]">
                    {goalStreak} <span className="text-sm">Days</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400">{actionsTaken} Actions Today</div>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Charts & Active Challenges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Emissions Chart */}
          <Reveal direction="up" delay={0.1}>
            <Card className="bg-[#07110D]/90 border border-[#18A66A]/30 backdrop-blur-xl text-white shadow-xl">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="text-lg font-bold font-mono uppercase text-[#39FF88] flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-[#39FF88]" />
                  Weekly Emission Telemetry
                </CardTitle>
                <CardDescription className="text-[#7D8C85] text-xs">
                  Daily CO₂ footprint output across active week (Mon–Sun)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {weekly.map((d) => (
                  <div key={d.date} className="flex items-center space-x-4">
                    <div className="w-8 text-xs font-mono text-[#B7C5BE]">{d.label}</div>
                    <div className="flex-1 h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-gradient-to-r from-[#18A66A] to-[#39FF88] rounded-full transition-all duration-500"
                        style={{ width: `${(d.value / maxEmissions) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-xs font-mono font-bold text-white">{d.value.toFixed(1)} kg</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Reveal>

          {/* Active Challenges */}
          <Reveal direction="up" delay={0.2}>
            <Card className="bg-[#07110D]/90 border border-[#18A66A]/30 backdrop-blur-xl text-white shadow-xl">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="text-lg font-bold font-mono uppercase text-[#1687D9] flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Active Planetary Goals
                </CardTitle>
                <CardDescription className="text-[#7D8C85] text-xs">
                  Track weekly sustainability target progress
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {challenges.map((challenge, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#F4F7F4] font-bold">{challenge.title}</span>
                      <span className="text-[#39FF88]">{challenge.progress}%</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2 bg-zinc-900" />
                    <p className="text-[11px] text-[#7D8C85] font-mono">{challenge.target}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Quick Hub Actions */}
        <Reveal direction="up" delay={0.3}>
          <Card className="bg-[#07110D]/90 border border-[#18A66A]/30 backdrop-blur-xl text-white p-6">
            <CardHeader className="pb-4 border-b border-zinc-800">
              <CardTitle className="text-lg font-bold font-mono uppercase text-[#F4F7F4]">
                Ecosystem Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <Link to="/rewards">
                  <Button variant="outline" className="w-full h-20 border-zinc-800 hover:border-[#39FF88] bg-zinc-950 flex flex-col space-y-2 text-zinc-300 hover:text-[#39FF88]">
                    <Award className="h-6 w-6 text-[#39FF88]" />
                    <span>Redeem Eco-Points</span>
                  </Button>
                </Link>
                <Link to="/events">
                  <Button variant="outline" className="w-full h-20 border-zinc-800 hover:border-[#1687D9] bg-zinc-950 flex flex-col space-y-2 text-zinc-300 hover:text-[#1687D9]">
                    <Calendar className="h-6 w-6 text-cyan-400" />
                    <span>Community Events</span>
                  </Button>
                </Link>
                <Link to="/ecomap">
                  <Button variant="outline" className="w-full h-20 border-zinc-800 hover:border-[#39FF88] bg-zinc-950 flex flex-col space-y-2 text-zinc-300 hover:text-[#39FF88]">
                    <Globe className="h-6 w-6 text-emerald-400" />
                    <span>EcoMap Directory</span>
                  </Button>
                </Link>
                <Link to="/learn">
                  <Button variant="outline" className="w-full h-20 border-zinc-800 hover:border-[#1687D9] bg-zinc-950 flex flex-col space-y-2 text-zinc-300 hover:text-[#1687D9]">
                    <BookOpen className="h-6 w-6 text-teal-400" />
                    <span>Knowledge Hub</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;