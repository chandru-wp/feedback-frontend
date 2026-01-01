 import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import FeedbackForm from "./components/FeedbackForm";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminFeedback from "./pages/AdminFeedback";
import AdminManagement from "./pages/AdminManagement";

// Protected Route component for authenticated users
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Protected Route for admin only
function AdminRoute({ children }) {
  const isAdmin = localStorage.getItem("isAdmin");
  return isAdmin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route 
        path="/feedback" 
        element={
          <ProtectedRoute>
            <FeedbackForm />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin-feedback" 
        element={
          <AdminRoute>
            <AdminFeedback />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin-management" 
        element={
          <AdminRoute>
            <AdminManagement />
          </AdminRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
