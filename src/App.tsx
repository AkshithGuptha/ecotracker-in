import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ui/themeContext";
import { AuthProvider } from "./lib/auth";
import { ProductsProvider } from "./contexts/ProductsContext";

// User Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import SelectRole from "./pages/SelectRole";
import Dashboard from "./pages/Dashboard";
import CarbonTracker from "./pages/CarbonTracker";
import Rewards from "./pages/Rewards";
import EcoMap from "./pages/EcoMap";
import LearnQuiz from "./pages/LearnQuiz";
import Events from "./pages/Events";
import CommunityPage from "./pages/CommunityPage";
import MyRegistrations from "./pages/MyRegistrations";
import AboutUsPage from "./pages/AboutUsPage";
import CreateEvent from "./pages/organiser/CreateEvent";
import Profile from "./pages/Profile";
import Impact from "./pages/Impact";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import ContactUs from "./pages/ContactUs";

// NGO Pages
import NgoLogin from "./pages/NgoLogin";
import NgoRegister from "./pages/NgoRegister";
import NgoDashboardLocal from "./pages/NgoDashboardLocal";
import OrganiserDashboard from "./pages/OrganiserDashboard";
import ProtectedNgoRoute from "./routes/ProtectedNgoRoute";
import RedeemPage from "./pages/user/RedeemPage";
import AddProduct from "./pages/ngo/AddProduct";
// Google Sign-In script is loaded in index.html

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <TooltipProvider>
              <ProductsProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/about" element={<AboutUsPage />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/ngologin" element={<NgoLogin />} />
                  <Route path="/ngoregister" element={<NgoRegister />} />
                  <Route path="/redeem" element={<RedeemPage />} />

                  {/* Protected Routes */}
                  <Route path="/dashboard/about-us" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <AboutUsPage />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  {/* Events Routes */}
                  <Route path="/events" element={<Events />} />
                  <Route path="/my-registrations" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <MyRegistrations />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  {/* NGO Routes */}
                  <Route path="/ngo/login" element={<NgoLogin />} />
                  <Route path="/ngo/register" element={<NgoRegister />} />
                  <Route 
                    path="/ngo/dashboard" 
                    element={
                      <ProtectedRoute>
                        <RoleRoute roles={['ngo']}>
                          <NgoDashboardLocal />
                        </RoleRoute>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/ngo/products/add" 
                    element={
                      <ProtectedRoute>
                        <RoleRoute roles={['ngo']}>
                          <AddProduct />
                        </RoleRoute>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Organiser Routes */}
                  <Route path="/organiser/dashboard" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['organizer']}>
                        <OrganiserDashboard />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/organiser/events/new" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['organizer']}>
                        <CreateEvent />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/organiser/events/:id/edit" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['organizer']}>
                        <CreateEvent />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  {/* Protected User Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <Dashboard />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/tracker" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <CarbonTracker />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />

                  <Route path="/carbon-tracker" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <CarbonTracker />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />

                  <Route path="/rewards" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <Rewards />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />

                  <Route path="/impact" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <Impact />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />

                  <Route path="/learn" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <LearnQuiz />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/ecomap" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <EcoMap />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/eco-map" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <EcoMap />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/community" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <CommunityPage />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dashboard/community" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <CommunityPage />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/learn-quiz" element={
                    <ProtectedRoute>
                      <RoleRoute roles={['user']}>
                        <LearnQuiz />
                      </RoleRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all route for unknown paths */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ProductsProvider>
            </TooltipProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
