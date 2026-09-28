import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { setToken, setUserRole, setUserData } from "@/lib/auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, ShieldCheck } from "lucide-react";

type UserRoleType = 'user' | 'organizer' | 'ngo';

const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<UserRoleType>("user");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const { loginWithPopup, loginWithRedirect, getAccessTokenSilently, user: auth0User, isAuthenticated, isLoading: auth0Loading } = useAuth0();

  const API_BASE = import.meta.env.VITE_API_BASE || "";

  // Sync Auth0 authenticated user with EcoTrackr backend
  useEffect(() => {
    const syncAuth0User = async () => {
      if (isAuthenticated && auth0User && auth0User.email) {
        setIsLoading(true);
        try {
          const accessToken = await getAccessTokenSilently();
          const res = await fetch(`${API_BASE}/api/auth/auth0`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
              email: auth0User.email,
              name: auth0User.name,
              picture: auth0User.picture,
              sub: auth0User.sub,
              role: role,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Auth0 authentication failed');
          }

          const data = await res.json();
          setToken(data.token);
          setUserRole(data.role || role);
          setUserData({ ...(data.user || {}), role: data.role || role });

          const redirectRole = data.role || role;
          let redirectPath = '/dashboard';
          if (redirectRole === 'ngo') redirectPath = '/ngo/dashboard';
          else if (redirectRole === 'organizer') redirectPath = '/organiser/dashboard';

          navigate(redirectPath);
        } catch (error: any) {
          console.error("Auth0 login error:", error);
          alert(`Auth0 Sign-in Error: ${error.message || 'Unknown error'}`);
        } finally {
          setIsLoading(false);
        }
      }
    };
    syncAuth0User();
  }, [isAuthenticated, auth0User, API_BASE, navigate, role, getAccessTokenSilently]);

  const handleAuth0SignIn = async () => {
    try {
      await loginWithPopup();
    } catch (popupErr: any) {
      console.warn("Auth0 popup failed/blocked, trying redirect:", popupErr);
      try {
        await loginWithRedirect();
      } catch (redirectErr: any) {
        console.warn("Auth0 client redirect failed, trying server endpoint:", redirectErr);
        window.location.href = `${API_BASE}/login`;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('Authentication failed: No token received');
      }

      setToken(data.token);
      setUserRole(role);
      setUserData({ ...data.user, role });

      const redirectRole = data.role || role;
      let redirectPath = '/dashboard';

      switch (redirectRole) {
        case 'ngo':
          redirectPath = '/ngo/dashboard';
          break;
        case 'organizer':
          redirectPath = '/organiser/dashboard';
          break;
        default:
          redirectPath = '/dashboard';
      }

      navigate(redirectPath);
    } catch (error) {
      console.error('Login error:', error);
      alert(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-login-image flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-950/50 text-white">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Leaf className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-500 bg-clip-text text-transparent">
              EcoTrack
            </span>
          </div>
          <CardTitle className="text-xl font-semibold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-zinc-400">Sign in to track your carbon footprint</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <Label className="text-zinc-300 text-xs uppercase tracking-wider font-mono">Sign in as</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={role === "user" ? "default" : "outline"}
                  className={role === "user" ? "bg-emerald-600 hover:bg-emerald-500 text-white border-0" : "border-zinc-800 text-zinc-300 hover:bg-zinc-900"}
                  onClick={() => setRole("user")}
                >
                  User
                </Button>
                <Button
                  type="button"
                  variant={role === "organizer" ? "default" : "outline"}
                  className={role === "organizer" ? "bg-purple-600 hover:bg-purple-500 text-white border-0" : "border-zinc-800 text-zinc-300 hover:bg-zinc-900"}
                  onClick={() => setRole("organizer")}
                >
                  Organizer
                </Button>
                <Button
                  type="button"
                  variant={role === "ngo" ? "default" : "outline"}
                  className={role === "ngo" ? "bg-blue-600 hover:bg-blue-500 text-white border-0" : "border-zinc-800 text-zinc-300 hover:bg-zinc-900"}
                  onClick={() => setRole("ngo")}
                >
                  NGO
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-zinc-300 text-xs">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="bg-zinc-900/90 border-zinc-800 text-white focus:border-emerald-500 placeholder:text-zinc-600"
                required
              />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-zinc-900/90 border-zinc-800 text-white focus:border-emerald-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold transition-all duration-200"
              disabled={isLoading || auth0Loading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center">
            <div className="flex-grow h-px bg-zinc-800"></div>
            <span className="px-3 text-zinc-500 text-xs uppercase tracking-widest font-mono">or</span>
            <div className="flex-grow h-px bg-zinc-800"></div>
          </div>

          {/* Auth0 Login Button */}
          <Button
            type="button"
            onClick={handleAuth0SignIn}
            disabled={isLoading || auth0Loading}
            className="w-full bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 text-white font-medium flex items-center justify-center gap-2 py-2.5 transition-all duration-200"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Continue with Auth0</span>
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
