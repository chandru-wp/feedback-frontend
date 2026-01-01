 import React from "react";
import { Routes, Route } from "react-router-dom";
import FeedbackForm from "./components/FeedbackForm";
import LoginPage from "./pages/LoginPage";
import AdminFeedback from "./pages/AdminFeedback";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FeedbackForm />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-feedback" element={<AdminFeedback/>} />
    </Routes>
  );
}
