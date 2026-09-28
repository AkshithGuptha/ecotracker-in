import React from "react";
import { Link } from "react-router-dom";
import { Leaf, Globe, ShieldCheck, ArrowUpRight } from "lucide-react";

export const EcoTrackFooter: React.FC = () => {
  return (
    <footer className="relative z-10 bg-[#050807] border-t border-emerald-500/20 text-white pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 p-[2px] flex items-center justify-center text-emerald-400">
                <Leaf className="h-4 w-4" />
              </div>
              <span className="text-xl font-black font-mono tracking-widest uppercase bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent">
                ECOTRACK
              </span>
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Digital Earth Interface for personal footprint tracking, automated rewards, and planetary decarbonization telemetry.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase">
              <ShieldCheck className="w-3.5 h-3.5" /> Earth Protocol Verified
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 font-mono text-xs">
            <h4 className="text-zinc-200 font-bold uppercase tracking-wider">// Ecosystem</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link to="/tracker" className="hover:text-emerald-400 transition-colors">Carbon Tracker</Link></li>
              <li><Link to="/ecomap" className="hover:text-emerald-400 transition-colors">EcoMap Directory</Link></li>
              <li><Link to="/rewards" className="hover:text-emerald-400 transition-colors">Eco-Store & Rewards</Link></li>
              <li><Link to="/learn" className="hover:text-emerald-400 transition-colors">Knowledge Hub</Link></li>
            </ul>
          </div>

          {/* Platform Status */}
          <div className="space-y-3 font-mono text-xs">
            <h4 className="text-zinc-200 font-bold uppercase tracking-wider">// System Telemetry</h4>
            <ul className="space-y-2 text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>MongoDB Atlas: Connected</span>
              </li>
              <li><span>API Status: Operational</span></li>
              <li><span>Protocol Version: v2.4.0</span></li>
            </ul>
          </div>

          {/* Call to Action */}
          <div className="space-y-3 font-mono text-xs">
            <h4 className="text-zinc-200 font-bold uppercase tracking-wider">// Steward Access</h4>
            <p className="text-zinc-400 text-[11px]">
              Ready to start your personal sustainability journey?
            </p>
            <Link to="/signup" className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold">
              <span>Create Steward Account</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>ECOTRACK DIGITAL EARTH INTERFACE</span>
          </div>
          <div>© 2026 EcoTrack Inc. All rights reserved. Planetary Decarbonization System.</div>
        </div>
      </div>
    </footer>
  );
};

export default EcoTrackFooter;
