import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("user"); // "user" or "admin"

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = loginType === "admin"
        ? `${BASE_URL}/api/admin/login`
        : `${BASE_URL}/api/user/login`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "❌ Invalid username or password!");
        setLoading(false);
        return;
      }

      // Clear any previous session data
      localStorage.clear();
      
      // Store user info in localStorage
      localStorage.setItem("isAuthenticated", "true");

      if (loginType === "admin") {
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminUser", JSON.stringify(data.admin));
        navigate("/admin-feedback");
      } else {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        navigate("/feedback");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      setError("❌ Failed to connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-full max-w-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Login</h2>

        {/* Login Type Tabs */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setLoginType("user")}
            className={`flex-1 py-2 rounded-lg transition ${loginType === "user"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-800"
              }`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setLoginType("admin")}
            className={`flex-1 py-2 rounded-lg transition ${loginType === "admin"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-800"
              }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="text-left">
            <label className="block text-gray-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Enter username"
            />
          </div>

          <div className="text-left">
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Enter password"
            />
          </div>

          {loginType === "admin" && (
            <div className="text-sm text-gray-500 mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-gray-700">Default Admin:</p>
              <p>Username: <span className="font-mono">admin</span></p>
              <p>Password: <span className="font-mono">admin123</span></p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <button
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}
