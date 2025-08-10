// src/components/Layout/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import LoadingSpinner from "./LoadingSpinner";

/**
 * A protected route component that handles authentication and authorization.
 * It checks for a valid token, verifies the user's session with the backend,
 * and ensures the user has the required role to access a route.
 * @param {{ allowedRoles: string[] }} props - An array of roles allowed to access this route.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, token, checkAuth } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyUserSession = async () => {
      try {
        await checkAuth(); // Verifies token with the backend
      } catch (error) {
        // Auth check failed (e.g., token expired/invalid)
        // The store will handle logging out.
      } finally {
        setIsVerifying(false);
      }
    };

    if (!user && token) {
      verifyUserSession();
    } else {
      setIsVerifying(false);
    }
  }, [checkAuth, token, user]);

  if (isVerifying) {
    return <LoadingSpinner fullPage />;
  }

  // 1. If no token, redirect to login page
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  // 2. If user is authenticated, check for role authorization
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. If authenticated and authorized, render the child components
  return <Outlet />;
}