import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Lightbulb, Car, Utensils, BarChart3, Globe, Zap, ShieldCheck, ArrowUpRight, TrendingDown } from "lucide-react";
import { getCooldownRemainingMs, getWeeklyData, saveTodayEmissions, getPoints, getEntries } from "@/lib/carbon";

const CarbonTracker = () => {
  const [formData, setFormData] = useState({
    commuteType: 'car',
    commuteDistance: '15',
    electricityUsage: '12',
    dietType: 'meat'
  });
  
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [breakdown, setBreakdown] = useState({
    commute: 0,
    electricity: 0,
    diet: 0
  });

  // Daily save + weekly chart state
  const [cooldownMs, setCooldownMs] = useState<number>(0);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [points, setPoints] = useState<number>(getPoints());
  const [awardMessage, setAwardMessage] = useState<string>("");
  const [awardPositive, setAwardPositive] = useState<boolean | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [emissionHistory, setEmissionHistory] = useState<any[]>([]);

  const commuteFactors = {
    car: 0.21, // kg CO2 per km
    bus: 0.08,
    train: 0.06,
    motorbike: 0.10,
    bike: 0,
    walk: 0
  };

  const dietFactors = {
    meat: 2.5, // kg CO2 per day
    vegetarian: 1.7,
    vegan: 1.5
  };

  const timeString = useMemo(() => now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), [now]);
  const dateString = useMemo(() => now.toLocaleDateString([], { weekday: "short", year: "numeric", month: "short", day: "2-digit" }), [now]);

  const calculateEmissions = () => {
    const commuteEmissions = (commuteFactors[formData.commuteType as keyof typeof commuteFactors] || 0) * 
                            (parseFloat(formData.commuteDistance) || 0) * 2; // round trip
    
    const electricityEmissions = (parseFloat(formData.electricityUsage) || 0) * 0.5; // kg CO2 per kWh
    const dietEmissions = dietFactors[formData.dietType as keyof typeof dietFactors] || 0;

    const newBreakdown = {
      commute: commuteEmissions,
      electricity: electricityEmissions,
      diet: dietEmissions
    };

    setBreakdown(newBreakdown);
    setTotalEmissions(commuteEmissions + electricityEmissions + dietEmissions);
  };

  // Recalculate automatically when form changes
  useEffect(() => {
    calculateEmissions();
  }, [formData]);

  const tips = {
    commute: [
      "Use public transport to reduce commuting emissions by up to 75%",
      "Switch to cycling or walking for trips under 3km",
      "Carpooling saves 50% fuel per passenger"
    ],
    electricity: [
      "Switch to LED fixtures to cut lighting energy by 80%",
      "Unplug idle electronics to eliminate phantom load",
      "Utilize smart thermostats for efficient thermal regulation"
    ],
    diet: [
      "Incorporating Meatless Mondays reduces dietary emissions significantly",
      "Source local organic produce to slash transport supply chain overhead",
      "Reduce food waste with structured weekly meal planning"
    ]
  };

  const maxEmission = Math.max(1, breakdown.commute, breakdown.electricity, breakdown.diet);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const entries = await getEntries();
        if (entries && entries.length > 0) {
          setEmissionHistory(entries);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  // Initialize weekly data
  useEffect(() => {
    const loadWeeklyData = async () => {
      let weeklyData = await getWeeklyData();
      const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

      const hasBackendValues = Array.isArray(weeklyData) && weeklyData.some(d => typeof d.value === 'number' && d.value > 0);
      if (!hasBackendValues) {
        try {
          const entries = await getEntries();
          if (entries && entries.length > 0) {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
            monday.setHours(0,0,0,0);

            const weekData: any[] = [];
            for (let i = 0; i < 7; i++) {
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              const dateStr = d.toISOString().slice(0,10);
              const entry = entries.find(e => e.date === dateStr);
              weekData.push({ label: labels[i], date: dateStr, value: entry ? entry.value : 0 });
            }
            weeklyData = weekData;
          }
        } catch (err) {
          console.error('Error building weekly data:', err);
        }
      }

      setWeekly(weeklyData);
    };
    loadWeeklyData();
  }, []);

  // Live clock
  useEffect(() => {
    const tid = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tid);
  }, []);

  const formatMs = (ms: number) => {
    if (ms <= 0) return "";
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleSaveToday = async () => {
    setAwardMessage("");
    setAwardPositive(null);
    const res = await saveTodayEmissions(totalEmissions);
    if (!res.saved) {
      if (res.reason === "cooldown") {
        setCooldownMs(res.remainingMs || 0);
      }
      return;
    }

    setCooldownMs(getCooldownRemainingMs(Date.now()));
    let weeklyData = await getWeeklyData();
    setWeekly(weeklyData);
    const newPoints = getPoints();
    setPoints(newPoints);

    if (typeof res.pointsAwarded === "number" && res.comparison) {
      if (res.comparison === "improved") {
        setAwardPositive(true);
        setAwardMessage(`Great job! Carbon output decreased vs yesterday. +${res.pointsAwarded} Eco-Points awarded.`);
      } else if (res.comparison === "worsened") {
        setAwardPositive(false);
        setAwardMessage(`Carbon output increased vs yesterday. ${res.pointsAwarded} points deducted.`);
      } else if (res.comparison === "same") {
        setAwardPositive(false);
        setAwardMessage(`Carbon output unchanged vs yesterday. ${res.pointsAwarded} points deducted.`);
      } else {
        setAwardPositive(null);
        setAwardMessage("Today's emissions recorded successfully into Earth DB.");
      }
    } else {
      setAwardPositive(null);
      setAwardMessage("Today's emissions recorded successfully into Earth DB.");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#070B0E] text-white p-2 md:p-6 space-y-8 font-sans">
        {/* Igloo / Earth Ambient Glow Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px]" />
        </div>

        {/* Top Header & Status Bar */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              EARTH INC ECOSYSTEM // CARBON MONITOR
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent flex items-center gap-3">
              <Globe className="w-9 h-9 text-emerald-400" />
              Planetary Carbon Tracker
            </h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              Precision personal footprint analytics powering decentralized planetary decarbonization.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-900/80 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-md">
            <div className="text-right">
              <div className="text-xs font-mono text-zinc-500">{dateString}</div>
              <div className="text-xl font-bold font-mono text-emerald-400">{timeString}</div>
              {cooldownMs > 0 && (
                <div className="text-xs text-amber-400 font-mono mt-1">
                  Next entry in {formatMs(cooldownMs)}
                </div>
              )}
            </div>
            <div className="h-10 w-px bg-zinc-800" />
            <div className="text-center">
              <div className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Eco-Points</div>
              <div className="text-2xl font-black text-white bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                {points}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Section */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Interactive Calculator Input Card */}
          <Card className="bg-zinc-950/70 border border-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-950/30 text-white">
            <CardHeader className="border-b border-zinc-800/80 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-emerald-300">
                <Calculator className="w-5 h-5 text-emerald-400" />
                Real-Time Activity Calculator
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Log daily commuting, energy consumption, and nutritional factors
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Commute Section */}
              <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-emerald-400" />
                  <Label className="text-sm font-semibold text-zinc-200">Commute & Travel</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-400 mb-1 block">Transport Type</Label>
                    <Select
                      value={formData.commuteType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, commuteType: value }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white focus:ring-emerald-500">
                        <SelectValue placeholder="Select transport" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectItem value="car">Car (Fuel/Gas)</SelectItem>
                        <SelectItem value="bus">Public Bus</SelectItem>
                        <SelectItem value="train">Metro / Train</SelectItem>
                        <SelectItem value="motorbike">Motorbike</SelectItem>
                        <SelectItem value="bike">Bicycle (Zero CO₂)</SelectItem>
                        <SelectItem value="walk">Walking (Zero CO₂)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400 mb-1 block">Distance (km / day)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 15"
                      value={formData.commuteDistance}
                      onChange={(e) => setFormData(prev => ({ ...prev, commuteDistance: e.target.value }))}
                      className="bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Electricity Section */}
              <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <Label className="text-sm font-semibold text-zinc-200">Residential Electricity</Label>
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 mb-1 block">Daily Consumption (kWh)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 12"
                    value={formData.electricityUsage}
                    onChange={(e) => setFormData(prev => ({ ...prev, electricityUsage: e.target.value }))}
                    className="bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Diet Section */}
              <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-teal-400" />
                  <Label className="text-sm font-semibold text-zinc-200">Nutritional Profile</Label>
                </div>
                <Select
                  value={formData.dietType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dietType: value }))}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white focus:ring-emerald-500">
                    <SelectValue placeholder="Select diet profile" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="meat">Omnivore / Meat-Inclusive (2.5 kg CO₂)</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian (1.7 kg CO₂)</SelectItem>
                    <SelectItem value="vegan">Plant-Based / Vegan (1.5 kg CO₂)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={calculateEmissions}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium"
                >
                  Recalculate Live
                </Button>

                <Button
                  onClick={handleSaveToday}
                  disabled={totalEmissions <= 0 || cooldownMs > 0}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                >
                  {cooldownMs > 0 ? `Saved (Cooldown ${formatMs(cooldownMs)})` : "Commit to Earth DB"}
                </Button>
              </div>

              {awardMessage && (
                <div
                  className={`text-xs font-mono rounded-xl p-3 border ${
                    awardPositive === true
                      ? "text-emerald-300 bg-emerald-950/60 border-emerald-500/40"
                      : awardPositive === false
                      ? "text-rose-300 bg-rose-950/60 border-rose-500/40"
                      : "text-zinc-300 bg-zinc-900 border-zinc-800"
                  }`}
                >
                  {awardMessage}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dynamic Results & Breakdown Card */}
          <Card className="bg-zinc-950/70 border border-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-950/30 text-white flex flex-col justify-between">
            <div>
              <CardHeader className="border-b border-zinc-800/80 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-emerald-300">
                  <BarChart3 className="w-5 h-5 text-teal-400" />
                  Calculated Carbon Impact
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Real-time footprint telemetry and impact classification
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Total Score Banner */}
                <div className="text-center p-8 bg-gradient-to-b from-emerald-950/40 to-zinc-900/80 border border-emerald-500/30 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Globe className="w-32 h-32 text-emerald-400" />
                  </div>
                  <div className="text-5xl font-black text-white font-mono tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">
                    {totalEmissions.toFixed(2)} <span className="text-2xl font-semibold text-emerald-400">kg CO₂e</span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-2 uppercase font-mono tracking-widest">
                    Est. Daily Carbon Footprint Output
                  </p>

                  {totalEmissions > 0 && (
                    <Badge className={`mt-4 px-3 py-1 text-xs uppercase font-mono ${
                      totalEmissions < 8
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : totalEmissions < 18
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {totalEmissions < 8 ? 'Optimal Footprint' : totalEmissions < 18 ? 'Moderate Footprint' : 'High Output Alert'}
                    </Badge>
                  )}
                </div>

                {/* Category Breakdown Progress */}
                {totalEmissions > 0 && (
                  <div className="space-y-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400">Category Telemetry</h4>
                    <div className="space-y-4">
                      {/* Commute */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                            <Car className="w-3.5 h-3.5 text-emerald-400" /> Commute
                          </span>
                          <span className="font-mono text-emerald-300">{breakdown.commute.toFixed(1)} kg</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(breakdown.commute / maxEmission) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Electricity */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                            <Zap className="w-3.5 h-3.5 text-amber-400" /> Electricity
                          </span>
                          <span className="font-mono text-amber-300">{breakdown.electricity.toFixed(1)} kg</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${(breakdown.electricity / maxEmission) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Diet */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                            <Utensils className="w-3.5 h-3.5 text-teal-400" /> Diet
                          </span>
                          <span className="font-mono text-teal-300">{breakdown.diet.toFixed(1)} kg</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${(breakdown.diet / maxEmission) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>

            {/* Earth Verification Footer */}
            <div className="p-4 border-t border-zinc-800/80 text-xs text-zinc-500 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified by Earth Protocol
              </span>
              <span>Atlas DB Connected</span>
            </div>
          </Card>
        </div>

        {/* Weekly Trend Section (Mon-Sun) */}
        <div className="relative z-10">
          <Card className="bg-zinc-950/70 border border-emerald-500/20 backdrop-blur-xl shadow-2xl text-white">
            <CardHeader className="border-b border-zinc-800/80 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-emerald-300">
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                7-Day Planetary Trend Telemetry
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Historical records for the active calendar week (Mon–Sun)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-7 gap-2 md:gap-4 items-end h-48 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/60">
                {weekly.map((d, idx) => {
                  const maxVal = Math.max(1, ...weekly.map((w: any) => w.value));
                  const heightPct = Math.min(100, Math.max(8, (d.value / maxVal) * 100));
                  return (
                    <div key={d.date || idx} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono text-zinc-400 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {d.value.toFixed(1)}k
                      </span>
                      <div className="w-full bg-zinc-800 rounded-t-lg h-36 flex items-end overflow-hidden p-1">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-600 via-teal-400 to-emerald-300 rounded-md transition-all duration-500 group-hover:brightness-125"
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-zinc-300 mt-2">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earth Decarbonization Tips */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-950/70 border border-emerald-500/20 backdrop-blur-xl text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
                <Car className="w-4 h-4" /> Mobility Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-zinc-300">
                {tips.commute.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/70 border border-emerald-500/20 backdrop-blur-xl text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                <Zap className="w-4 h-4" /> Energy Conservation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-zinc-300">
                {tips.electricity.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/70 border border-emerald-500/20 backdrop-blur-xl text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-teal-400">
                <Utensils className="w-4 h-4" /> Sustainable Nutrition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-zinc-300">
                {tips.diet.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CarbonTracker;
