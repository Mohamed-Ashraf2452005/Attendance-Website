import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute user:", user);
  console.log("ProtectedRoute loading:", loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // 👇 مهم جدًا: لو مفيش user
  if (!user) {
    console.log("No user found → redirect to login");
    return <Navigate to="/login" replace />;
  }

  // 👇 check admin
  if (adminOnly && user.role !== 'admin') {
    console.log("Not admin → redirect dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
