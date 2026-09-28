import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, ShieldCheck } from "lucide-react";
import { setToken, setUserRole, setUserData } from "@/lib/auth";

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ApiResponse {
  message?: string;
  [key: string]: any;
}

const Signup = () => {
  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { loginWithPopup, loginWithRedirect, user: auth0User, isAuthenticated, isLoading: auth0Loading } = useAuth0();

  const API_BASE = import.meta.env.VITE_API_BASE || "";

  // Sync Auth0 authenticated user
  useEffect(() => {
    const syncAuth0User = async () => {
      if (isAuthenticated && auth0User && auth0User.email) {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/auth/auth0`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: auth0User.email,
              name: auth0User.name,
              picture: auth0User.picture,
              sub: auth0User.sub,
              role: 'user',
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Auth0 registration failed');
          }

          const data = await res.json();
          setToken(data.token);
          setUserRole('user');
          setUserData({ ...(data.user || {}), role: 'user' });

          navigate('/dashboard');
        } catch (err: any) {
          console.error("Auth0 signup error:", err);
          setError(`Auth0 Sign-up Error: ${err.message || 'Unknown error'}`);
        } finally {
          setLoading(false);
        }
      }
    };
    syncAuth0User();
  }, [isAuthenticated, auth0User, API_BASE, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAuth0SignUp = async () => {
    try {
      await loginWithPopup({
        authorizationParams: { screen_hint: 'signup' }
      });
    } catch (popupErr: any) {
      console.warn("Auth0 popup failed/blocked, trying redirect:", popupErr);
      try {
        await loginWithRedirect({
          authorizationParams: { screen_hint: 'signup' }
        });
      } catch (redirectErr: any) {
        console.warn("Auth0 client redirect failed, trying server endpoint:", redirectErr);
        window.location.href = `${API_BASE}/signup`;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("⚠️ Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.message || "Error registering user");
        return;
      }

      setSuccess("✅ Registration successful! Redirecting to login...");
      localStorage.removeItem("token");
      localStorage.removeItem("auth:role");
      localStorage.removeItem("auth:userId");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        setError("⚠️ Server not reachable");
      } else {
        console.error(err);
        setError("⚠️ An unexpected error occurred");
      }
    } finally {
      setLoading(false);
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
          <CardTitle className="text-xl font-semibold text-white">Create Account</CardTitle>
          <CardDescription className="text-zinc-400">Join us and start tracking sustainably</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-zinc-300 text-xs">Name</Label>
              <Input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="bg-zinc-900/90 border-zinc-800 text-white focus:border-emerald-500 placeholder:text-zinc-600"
                required
              />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Email</Label>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className="bg-zinc-900/90 border-zinc-800 text-white focus:border-emerald-500 placeholder:text-zinc-600"
                required
              />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Password</Label>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="bg-zinc-900/90 border-zinc-800 text-white focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Confirm Password</Label>
              <Input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="bg-zinc-900/90 border-zinc-800 text-white focus:border-emerald-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold transition-all duration-200"
              disabled={loading || auth0Loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>

          {error && <p className="text-red-400 text-sm mt-3 font-medium">{error}</p>}
          {success && <p className="text-emerald-400 text-sm mt-3 font-medium">{success}</p>}

          {/* Divider */}
          <div className="my-5 flex items-center">
            <div className="flex-grow h-px bg-zinc-800"></div>
            <span className="px-3 text-zinc-500 text-xs uppercase tracking-widest font-mono">or</span>
            <div className="flex-grow h-px bg-zinc-800"></div>
          </div>

          {/* Auth0 Button */}
          <Button
            type="button"
            onClick={handleAuth0SignUp}
            disabled={loading || auth0Loading}
            className="w-full bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 text-white font-medium flex items-center justify-center gap-2 py-2.5 transition-all duration-200"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Continue with Auth0</span>
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Already have an account?{" "}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
