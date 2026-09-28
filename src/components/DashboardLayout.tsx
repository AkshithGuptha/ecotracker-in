import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTheme } from "@/components/ui/themeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Home,
  BarChart3,
  Award,
  MapPin,
  BookOpen,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ChevronDown,
  Settings,
  UserCircle,
  Building2,
} from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { getPoints, POINTS_EVENT } from "@/lib/carbon";
import { clearToken } from "@/lib/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [ecoPoints, setEcoPoints] = useState<number>(0);
  const [role, setRole] = useState<"user" | "organiser">("user");
  const [userId, setUserId] = useState<string>("");
  const [organisation, setOrganisation] = useState<string>("");
  const [organisedCount, setOrganisedCount] = useState<number>(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await authFetch("/api/profile");
        const data = await res.json();
        setDisplayName(data.username || data.email || "");
        if (data._id) setUserId(String(data._id));
        if (data.organisation || data.organization || data.company) {
          setOrganisation(data.organisation || data.organization || data.company);
        }
        if (data.profilePicture) setAvatarUrl(data.profilePicture);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Initialize and subscribe to Eco Points changes
    try {
      setEcoPoints(getPoints());
    } catch {}

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { points?: number } | undefined;
      if (detail && typeof detail.points === "number") {
        setEcoPoints(detail.points);
      } else {
        try {
          setEcoPoints(getPoints());
        } catch {}
      }
    };

    window.addEventListener(POINTS_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(POINTS_EVENT, handler as EventListener);
    };
  }, []);

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: BarChart3, label: "Carbon Tracker", path: "/carbon-tracker" },
    { icon: Award, label: "Rewards", path: "/rewards" },
    { icon: MapPin, label: "EcoMap", path: "/ecomap" },
    { icon: BookOpen, label: "Learn & Quizzes", path: "/learn-quiz" },
    { icon: Calendar, label: "Events & NGO Collab", path: "/events" },
  ];

  if (role === "organiser") {
    menuItems.push(
      { icon: Calendar, label: "Create Event", path: "/organiser" },
      { icon: User, label: "Profile & Settings", path: "/profile" }
    );
  } else {
    menuItems.push(
      { icon: User, label: "Community", path: "/community" },
      { icon: User, label: "About Us", path: "/about" },
      { icon: User, label: "Profile & Settings", path: "/profile" }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          isSidebarOpen ? "block" : "hidden"
        }`}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-gray-800 shadow-lg">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-600 text-white">
                <Leaf className="h-6 w-6" />
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-5 px-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  location.pathname === item.path
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-4 h-6 w-6 ${
                    location.pathname === item.path
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                  }`}
                />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-semibold">EcoTrack</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    location.pathname === item.path
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 ${
                      location.pathname === item.path
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                    }`}
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div>
                <div className="text-base font-medium text-gray-800 dark:text-white">
                  {displayName || 'User'}
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {role === 'organiser' ? 'Organization' : 'User'}
                </div>
              </div>
            </div>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              {/* Search bar can be added here */}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Welcome message */}
              <div className="hidden md:flex items-center mr-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Welcome back, <span className="font-medium text-gray-900 dark:text-white">{displayName || 'User'}</span>!
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <Button
                    variant="ghost"
                    className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {displayName ? (
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                    <span className="hidden md:inline ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      {displayName || 'User'}
                    </span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </Button>
                </div>
                {isUserMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {role === 'organiser' ? 'Organization' : 'User'}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {role === 'organiser' && (
                      <Link
                        to="/ngo/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Organization
                      </Link>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
