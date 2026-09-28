import { Navigate, useLocation } from "react-router-dom";
import { getToken, getUserRole, hasAnyRole, UserRole } from "@/lib/auth";
import { useEffect } from "react";

type RoleRouteProps = {
  children: JSX.Element;
  roles: UserRole[];
  defaultRedirect?: string;
};

const roleDefaultRoutes: Record<UserRole, string> = {
  'user': '/dashboard',
  'ngo': '/ngo/dashboard',
  'organizer': '/organiser/dashboard',
  'default': '/dashboard',
};

const RoleRoute = ({ 
  children, 
  roles, 
  defaultRedirect 
}: RoleRouteProps) => {
  const location = useLocation();
  const token = getToken();
  const userRole = getUserRole();
  
  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user has default role, they can access any route but need to set their role
  if (userRole === 'default') {
    // Store the intended destination before role selection
    if (location.pathname !== '/select-role') {
      return <Navigate to="/select-role" state={{ from: location }} replace />;
    }
    return children;
  }

  // Check if user has any of the required roles
  if (!hasAnyRole(roles)) {
    // Redirect to default route for user's role
    const redirectTo = defaultRedirect || roleDefaultRoutes[userRole] || '/';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RoleRoute;
