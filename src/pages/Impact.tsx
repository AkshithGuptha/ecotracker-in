import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Leaf, Award, TrendingDown, TreePine, Zap, Globe, ArrowUpRight, ShieldCheck, Users } from "lucide-react";
import { EcoTrackNavbar } from "@/components/Navigation/EcoTrackNavbar";
import { EcoTrackFooter } from "@/components/Footer/EcoTrackFooter";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EcoButton } from "@/components/ui/EcoButton";
import { Earth2DVisual } from "@/components/visual/Earth2DVisual";
import { AnimatedNumber } from "@/components/Motion/AnimatedNumber";
import { Reveal } from "@/components/Motion/Reveal";
import { getPoints, getEntries } from "@/lib/carbon";

const Impact = () => {
  const [userPoints, setUserPoints] = useState<number>(getPoints());
  const [totalSavedCo2, setTotalSavedCo2] = useState<number>(14.8);
  const [treesPlanted, setTreesPlanted] = useState<number>(26);

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        const entries = await getEntries();
        if (entries && entries.length > 0) {
          const sum = entries.reduce((acc, curr) => acc + (curr.value || 0), 0);
          setTotalSavedCo2(sum > 0 ? sum : 14.8);
          setTreesPlanted(Math.max(1, Math.round((sum * 365) / 21)));
        }
      } catch (err) {
        console.error("Error loading impact data:", err);
      }
    };
    fetchImpactData();
  }, []);

  const communityLeaderboard = [
    { rank: "01", name: "Sarah Chen", points: 2840, saved: "142.5 kg" },
    { rank: "02", name: "Marcus Vance", points: 2410, saved: "118.2 kg" },
    { rank: "03", name: "Elena Rostova", points: 2190, saved: "95.4 kg" },
    { rank: "04", name: "David Park", points: 1980, saved: "88.1 kg" },
  ];

  return (
    <div className="min-h-screen bg-[#050807] text-[#F4F7F4] font-sans selection:bg-[#39FF88] selection:text-black overflow-x-hidden relative">
      {/* Background Ambient Spotlights & Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#18A66A]/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-[#1687D9]/10 rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18a66a0d_1px,transparent_1px),linear-gradient(to_bottom,#18a66a0d_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <EcoTrackNavbar />

      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <Reveal direction="up">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18A66A]/10 border border-[#39FF88]/30 text-[#39FF88] text-xs font-mono tracking-widest uppercase backdrop-blur-md">
              <Globe className="w-3.5 h-3.5" /> PLANETARY IMPACT TELEMETRY
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
              YOUR IMPACT <span className="bg-gradient-to-r from-[#39FF88] to-[#1687D9] bg-clip-text text-transparent">VISUALIZED</span>
            </h1>
            <p className="text-[#89978F] text-sm font-sans">
              Real-time measurement of personal decarbonization, equivalent tree planting, and collective community action.
            </p>
          </div>
        </Reveal>

        {/* Hero Impact Centerpiece & Visual */}
        <Reveal direction="up" delay={0.2}>
          <GlassPanel className="p-8 sm:p-12 relative overflow-hidden border border-[#18A66A]/30" glow="emerald">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="text-xs font-mono text-[#39FF88] uppercase tracking-widest">// CUMULATIVE DECARBONIZATION</div>
                <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tight">
                  <AnimatedNumber value={totalSavedCo2} decimals={1} suffix=" kg" />
                  <span className="text-2xl text-[#39FF88] ml-2">CO₂e Saved</span>
                </div>
                <p className="text-[#C7D2CC] text-sm leading-relaxed">
                  Your sustained activity reductions have prevented substantial greenhouse gases from entering the atmosphere.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <span className="text-[#89978F] block">Tree Offset Equivalent</span>
                    <span className="text-2xl font-bold text-[#39FF88] mt-1 block">
                      <AnimatedNumber value={treesPlanted} decimals={0} suffix=" Trees" />
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <span className="text-[#89978F] block">Eco-Points Balance</span>
                    <span className="text-2xl font-bold text-[#1687D9] mt-1 block">
                      <AnimatedNumber value={userPoints} decimals={0} suffix=" pts" />
                    </span>
                  </div>
                </div>
              </div>

              {/* 2D Earth Graphic Centerpiece */}
              <div className="lg:col-span-5 flex justify-center">
                <Earth2DVisual size="lg" glowColor="teal" />
              </div>
            </div>
          </GlassPanel>
        </Reveal>

        {/* Global Community Leaderboard */}
        <Reveal direction="up" delay={0.3}>
          <GlassPanel className="p-8 border border-[#18A66A]/20" glow="blue">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
              <div>
                <span className="text-xs font-mono text-[#35B9FF] uppercase tracking-widest">// COMMUNITY TELEMETRY</span>
                <h3 className="text-2xl font-bold uppercase tracking-tight text-white mt-1">Steward Impact Leaderboard</h3>
              </div>
              <Link to="/rewards">
                <EcoButton variant="secondary" size="sm">
                  View Eco-Store
                </EcoButton>
              </Link>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {communityLeaderboard.map((steward) => (
                <div key={steward.rank} className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between hover:border-[#18A66A]/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-[#39FF88]">{steward.rank}</span>
                    <span className="text-white font-bold">{steward.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-zinc-400">{steward.saved} CO₂ Saved</span>
                    <span className="text-[#1687D9] font-bold">{steward.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </Reveal>
      </main>

      <EcoTrackFooter />
    </div>
  );
};

export default Impact;
