import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Leaf, Menu, X, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToken, getUserRole, clearToken } from "@/lib/auth";

export const EcoTrackNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const token = getToken();
  const role = getUserRole();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Impact", path: "/#impact" },
    { label: "Track", path: "/tracker" },
    { label: "EcoMap", path: "/ecomap" },
    { label: "Rewards", path: "/rewards" },
    { label: "Knowledge", path: "/learn" },
  ];

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-8 py-3 ${
        isScrolled
          ? "bg-[#050807]/80 backdrop-blur-xl border-b border-emerald-500/20 shadow-2xl shadow-emerald-950/40"
          : "bg-transparent border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-[2px] flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(57,255,136,0.3)] transition-all">
            <Leaf className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-widest font-mono uppercase bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent">
              ECOTRACK
            </span>
            <span className="text-[9px] font-mono text-emerald-400/80 -mt-1 tracking-wider uppercase">
              Digital Earth Interface
            </span>
          </div>
        </Link>

        {/* Center Floating Navigation Capsule */}
        <nav className="hidden md:flex items-center space-x-1 bg-zinc-950/60 border border-emerald-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-full ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(57,255,136,0.15)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Authentication / Profile Actions */}
        <div className="hidden md:flex items-center space-x-3">
          {token ? (
            <div className="flex items-center space-x-2">
              <Link to={role === "ngo" ? "/ngo/dashboard" : role === "organizer" ? "/organiser/dashboard" : "/dashboard"}>
                <Button
                  variant="outline"
                  className="border-emerald-500/30 bg-zinc-900/60 text-emerald-300 hover:border-emerald-400 text-xs font-mono uppercase tracking-wider rounded-full flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-zinc-400 hover:text-rose-400 rounded-full p-2"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-zinc-300 hover:text-white text-xs font-mono uppercase tracking-wider rounded-full"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/tracker">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold rounded-full px-6 text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
                  Launch App
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden p-2 text-zinc-300 hover:text-white"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden mt-3 p-5 bg-[#050807]/95 border border-emerald-500/30 rounded-2xl backdrop-blur-2xl space-y-3 font-mono text-xs">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setIsMobileOpen(false)}
              className="block px-3 py-2 text-zinc-300 hover:text-emerald-400 rounded-lg hover:bg-emerald-500/10"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
            {token ? (
              <Button onClick={handleLogout} variant="outline" className="w-full border-rose-500/30 text-rose-300">
                Sign Out
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMobileOpen(false)}>
                  <Button variant="outline" className="w-full border-zinc-800 text-zinc-300">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileOpen(false)}>
                  <Button className="w-full bg-emerald-500 text-zinc-950 font-bold">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default EcoTrackNavbar;
