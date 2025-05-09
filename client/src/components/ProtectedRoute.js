import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // If user is not in context but exists in localStorage, set it
  if (!user) {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      return children;
    }
    return <Navigate to="/login" replace />;
  }

  // Handle role comparison - user.role might be a string or array
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const hasRequiredRole = allowedRoles.some(allowedRole => 
    userRoles.some(userRole => userRole.toLowerCase() === allowedRole.toLowerCase())
  );

  // Check if user has required role
  if (allowedRoles && !hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
