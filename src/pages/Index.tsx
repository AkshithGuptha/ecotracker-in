import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Leaf,
  Award,
  MapPin,
  BookOpen,
  Users,
  ArrowRight,
  Globe,
  Zap,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  TreePine,
  Wind,
  Compass,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { DigitalEarth } from "@/components/Earth/DigitalEarth";
import { EarthScene } from "@/components/Earth/EarthScene";
import { Reveal } from "@/components/Motion/Reveal";
import { AnimatedNumber } from "@/components/Motion/AnimatedNumber";
import { EcoTrackNavbar } from "@/components/Navigation/EcoTrackNavbar";
import { EcoTrackFooter } from "@/components/Footer/EcoTrackFooter";

const Index = () => {
  // Demo Interactive Tracker State
  const [commuteDistance, setCommuteDistance] = useState<number>(18);
  const [electricityKwh, setElectricityKwh] = useState<number>(14);
  const [activeDiet, setActiveDiet] = useState<"meat" | "vegetarian" | "vegan">("vegetarian");

  const dietFactors = { meat: 2.5, vegetarian: 1.7, vegan: 1.5 };
  const estimatedCo2 = (commuteDistance * 0.21 * 2) + (electricityKwh * 0.5) + dietFactors[activeDiet];
  const treesEquivalent = Math.round((estimatedCo2 * 365) / 21);

  return (
    <div className="min-h-screen bg-[#050807] text-[#F4F7F4] font-sans selection:bg-[#39FF88] selection:text-black overflow-x-hidden relative">
      {/* Background Ambient Spotlights & Fine Mesh Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#18A66A]/10 rounded-full blur-[180px]" />
        <div className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] bg-[#1687D9]/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] bg-[#39FF88]/05 rounded-full blur-[200px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18a66a0d_1px,transparent_1px),linear-gradient(to_bottom,#18a66a0d_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Floating Glass Navbar */}
      <EcoTrackNavbar />

      {/* ===================================================
          SECTION 01: THE PLANET (Hero Digital Earth)
      =================================================== */}
      <section className="relative z-10 pt-32 pb-20 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[90vh]">
        <Reveal direction="up" delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18A66A]/10 border border-[#39FF88]/30 text-[#39FF88] text-xs font-mono tracking-widest uppercase backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-[#39FF88] animate-ping" />
            ECOTRACK // DIGITAL EARTH INTERFACE
          </div>
        </Reveal>

        <Reveal direction="up" delay={0.2}>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.95] text-center max-w-5xl">
            YOUR IMPACT <br />
            <span className="bg-gradient-to-r from-[#F4F7F4] via-[#39FF88] to-[#1687D9] bg-clip-text text-transparent">
              MATTERS.
            </span>
          </h1>
        </Reveal>
        <Reveal direction="up" delay={0.3}>
          <p className="text-[#B7C5BE] text-base sm:text-lg text-center max-w-2xl font-sans leading-relaxed mt-6">
            Every journey, every kilowatt, every choice leaves a footprint. EcoTrack provides real-time planetary carbon telemetry to measure and minimize your impact.
          </p>
        </Reveal>

        <Reveal direction="up" delay={0.5} className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link to="/tracker">
            <Button className="h-13 px-8 bg-gradient-to-r from-[#39FF88] via-[#18A66A] to-[#1687D9] hover:brightness-110 text-[#050807] font-extrabold text-xs uppercase tracking-wider rounded-full shadow-2xl shadow-[#39FF88]/20 transition-all hover:scale-105 flex items-center gap-2">
              <span>Start Footprint Telemetry</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="outline" className="h-13 px-8 border-[#18A66A]/40 hover:border-[#39FF88] bg-zinc-950/60 text-white font-mono text-xs uppercase tracking-wider rounded-full backdrop-blur-md">
              Create Steward Account
            </Button>
          </Link>
        </Reveal>
      </section>

      {/* ===================================================
          SECTION 02: YOUR FOOTPRINT (Carbon Particles & Data)
      =================================================== */}
      <section className="relative z-10 py-20 border-y border-[#18A66A]/20 bg-[#07110D]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <Reveal direction="up">
            <div className="text-center space-y-2 mb-12">
              <span className="text-xs font-mono text-[#39FF88] uppercase tracking-widest">// SECTION 02 — FOOTPRINT TELEMETRY</span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#F4F7F4]">
                The Planet Keeps Score
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Reveal direction="up" delay={0.1}>
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-[#18A66A]/20 backdrop-blur-md space-y-2">
                <div className="text-xs font-mono text-[#7D8C85] uppercase">Global CO₂ Logged</div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-[#39FF88]">
                  <AnimatedNumber value={1420500} decimals={0} suffix=" kg" />
                </div>
                <div className="text-[11px] font-mono text-emerald-400">Verified by Atlas DB</div>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.2}>
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-[#18A66A]/20 backdrop-blur-md space-y-2">
                <div className="text-xs font-mono text-[#7D8C85] uppercase">Active Stewards</div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-[#1687D9]">
                  <AnimatedNumber value={88420} decimals={0} />
                </div>
                <div className="text-[11px] font-mono text-cyan-400">Across 62 Countries</div>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.3}>
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-[#18A66A]/20 backdrop-blur-md space-y-2">
                <div className="text-xs font-mono text-[#7D8C85] uppercase">Eco-Points Issued</div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-[#39FF88]">
                  <AnimatedNumber value={2840000} decimals={0} />
                </div>
                <div className="text-[11px] font-mono text-emerald-400">Redeemed for Impact</div>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.4}>
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-[#18A66A]/20 backdrop-blur-md space-y-2">
                <div className="text-xs font-mono text-[#7D8C85] uppercase">Trees Equivalent</div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-[#1687D9]">
                  <AnimatedNumber value={67640} decimals={0} />
                </div>
                <div className="text-[11px] font-mono text-cyan-400">Annual Offset Capacity</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================================================
          SECTION 03: TRACK (Interactive Carbon Simulator)
      =================================================== */}
      <section className="relative z-10 py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <Reveal direction="up">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-mono text-[#39FF88] uppercase tracking-widest">// SECTION 03 — INTERACTIVE TRACKER</span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#F4F7F4]">
                What Moved You Today?
              </h2>
            </div>
            <p className="text-[#B7C5BE] text-sm max-w-md font-sans">
              Test our real-time interactive calculation engine below. Adjust your daily parameters to see instant emission telemetry.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Slider Controls */}
          <Reveal direction="right" className="lg:col-span-7">
            <Card className="bg-[#07110D]/90 border border-[#18A66A]/30 backdrop-blur-2xl text-white shadow-2xl p-4">
              <CardHeader>
                <CardTitle className="text-xl font-bold uppercase tracking-wider text-[#39FF88] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#39FF88]" /> Footprint Controls
                </CardTitle>
                <CardDescription className="text-[#7D8C85] text-xs">
                  Simulate daily commute distance, electricity consumption, and nutritional diet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {/* Commute */}
                <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#B7C5BE] font-bold">Daily Commute Distance</span>
                    <span className="text-[#39FF88] font-bold">{commuteDistance} km / day</span>
                  </div>
                  <Slider
                    value={[commuteDistance]}
                    onValueChange={(val) => setCommuteDistance(val[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="py-2"
                  />
                </div>

                {/* Electricity */}
                <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#B7C5BE] font-bold">Residential Electricity</span>
                    <span className="text-cyan-400 font-bold">{electricityKwh} kWh / day</span>
                  </div>
                  <Slider
                    value={[electricityKwh]}
                    onValueChange={(val) => setElectricityKwh(val[0])}
                    min={0}
                    max={60}
                    step={1}
                    className="py-2"
                  />
                </div>

                {/* Diet selector */}
                <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                  <div className="text-xs font-mono text-[#B7C5BE] font-bold mb-2">Nutritional Profile</div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {(["meat", "vegetarian", "vegan"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setActiveDiet(d)}
                        className={`py-2 px-3 rounded-lg border capitalize transition-all ${
                          activeDiet === d
                            ? "bg-[#18A66A]/20 border-[#39FF88] text-[#39FF88] font-bold"
                            : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          {/* Live Telemetry Result Panel */}
          <Reveal direction="left" className="lg:col-span-5">
            <Card className="bg-[#07110D]/90 border border-[#18A66A]/30 backdrop-blur-2xl text-white shadow-2xl h-full flex flex-col justify-between p-4">
              <div>
                <CardHeader>
                  <CardTitle className="text-xl font-bold uppercase tracking-wider text-[#1687D9] flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" /> Simulated Output
                  </CardTitle>
                  <CardDescription className="text-[#7D8C85] text-xs">
                    Estimated daily carbon output based on inputs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="p-8 rounded-2xl bg-zinc-950/80 border border-[#18A66A]/40 text-center relative overflow-hidden">
                    <div className="text-5xl font-black font-mono text-white tracking-tight">
                      <AnimatedNumber value={estimatedCo2} decimals={2} />
                      <span className="text-2xl text-[#39FF88] ml-2">kg CO₂e</span>
                    </div>
                    <div className="text-xs font-mono text-[#7D8C85] uppercase tracking-widest mt-2">
                      Est. Daily Emissions
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Equivalent Trees Needed:</span>
                      <span className="text-[#39FF88] font-bold">{treesEquivalent} Trees / Year</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Est. Eco-Points / Day:</span>
                      <span className="text-cyan-400 font-bold">+{Math.max(5, Math.round(30 - estimatedCo2))} pts</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <Link to="/tracker">
                  <Button className="w-full bg-[#39FF88] hover:bg-[#18A66A] text-[#050807] font-extrabold uppercase font-mono text-xs tracking-wider rounded-xl py-6 transition-all">
                    Launch Full Carbon Tracker
                  </Button>
                </Link>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ===================================================
          SECTION 07: ECOMAP PREVIEW (Geospatial Environmental Map)
      =================================================== */}
      <section className="relative z-10 py-24 border-t border-[#18A66A]/20 bg-[#07110D]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <Reveal direction="up">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-[#39FF88] uppercase tracking-widest">// SECTION 07 — PLANETARY ECOMAP</span>
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#F4F7F4]">
                  Locate Local Green Hubs
                </h2>
              </div>
              <Link to="/ecomap">
                <Button variant="outline" className="border-[#18A66A]/40 text-[#39FF88] hover:border-[#39FF88] font-mono text-xs uppercase tracking-wider rounded-full">
                  Open Interactive Map <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Reveal direction="up" delay={0.1}>
              <Card className="bg-zinc-950/80 border border-[#18A66A]/20 p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#39FF88]">
                  <Leaf className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-mono uppercase text-white">♻️ Recycling Infrastructure</h3>
                <p className="text-xs text-zinc-400">Direct navigation to municipal plastic, glass, and compost disposal nodes.</p>
              </Card>
            </Reveal>

            <Reveal direction="up" delay={0.2}>
              <Card className="bg-zinc-950/80 border border-[#18A66A]/20 p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#1687D9]">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-mono uppercase text-white">🔋 E-Waste & Solar Hubs</h3>
                <p className="text-xs text-zinc-400">Certified electronic waste collection drop-offs and public solar charging stations.</p>
              </Card>
            </Reveal>

            <Reveal direction="up" delay={0.3}>
              <Card className="bg-zinc-950/80 border border-[#18A66A]/20 p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <TreePine className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-mono uppercase text-white">🌱 Green Spaces & NGOs</h3>
                <p className="text-xs text-zinc-400">Local urban forestry projects, community gardens, and partner NGO headquarters.</p>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================================================
          SECTION 10: FINAL EARTH STATEMENT & CTA
      =================================================== */}
      <section className="relative z-10 py-32 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-8">
        <Reveal direction="up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18A66A]/10 border border-[#39FF88]/30 text-[#39FF88] text-xs font-mono tracking-widest uppercase backdrop-blur-md">
            <ShieldCheck className="w-4 h-4" /> SMALL ACTIONS. PLANET-SIZED IMPACT.
          </div>
        </Reveal>

        <Reveal direction="up" delay={0.2}>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight max-w-4xl mx-auto leading-tight">
            START YOUR <span className="bg-gradient-to-r from-[#39FF88] via-teal-200 to-[#1687D9] bg-clip-text text-transparent">ECOTRACK JOURNEY</span> TODAY.
          </h2>
        </Reveal>

        <Reveal direction="up" delay={0.3}>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link to="/tracker">
              <Button className="h-14 px-10 bg-[#39FF88] hover:bg-[#18A66A] text-[#050807] font-black text-sm uppercase tracking-wider rounded-full shadow-2xl shadow-[#39FF88]/30 transition-all hover:scale-105">
                START TRACKING NOW
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" className="h-14 px-10 border-[#18A66A]/40 text-white hover:border-[#39FF88] font-mono text-xs uppercase tracking-wider rounded-full">
                CREATE STEWARD ACCOUNT
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <EcoTrackFooter />
    </div>
  );
};

export default Index;
