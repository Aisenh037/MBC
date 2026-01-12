import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import LoadingSpinner from "./LoadingSpinner";
import type { UserRole } from "../../types/api";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * A protected route that verifies the user's session on initial load to prevent UI flashing.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, checkAuth, isAuthenticated } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyUserSession = async (): Promise<void> => {
      try {
        // This function will verify the token with the backend.
        await checkAuth();
      } catch (error) {
        // If token is invalid, authStore will handle logging out.
      } finally {
        setIsVerifying(false);
      }
    };

    // Only verify if there's a token but the user isn't authenticated yet (on page load).
    if (token && !isAuthenticated) {
      verifyUserSession();
    } else {
      setIsVerifying(false);
    }
  }, [token, isAuthenticated, checkAuth]);

  // 1. While verifying the token, show a full-page loading spinner.
  if (isVerifying) {
    return <LoadingSpinner fullPage />;
  }

  // 2. After verification, if the user is not authenticated, redirect to login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. If there is a user, check their role for authorization.
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. If everything is fine, render the requested page.
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;