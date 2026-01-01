import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function AdminManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", password: "" });

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem("isAdmin");
    const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
    
    if (!isAdmin) {
      navigate("/login");
      return;
    }

    setCurrentAdmin(adminUser);
    fetchAdmins();
  }, [navigate]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin`);
      if (!res.ok) throw new Error("Failed to fetch admins");
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error("❌ Error fetching admins:", err);
      setError("Failed to load admin users.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete admin "${username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/admin/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete admin");
      
      setAdmins(admins.filter((admin) => admin.id !== id));
      alert(`✅ Admin "${username}" deleted successfully!`);
    } catch (error) {
      console.error("❌ Error deleting admin:", error);
      alert("Failed to delete admin. Please try again.");
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (newAdmin.password.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create admin");
        return;
      }

      setAdmins([...admins, data]);
      setNewAdmin({ username: "", password: "" });
      setShowAddForm(false);
      alert(`✅ Admin "${data.username}" created successfully!`);
    } catch (error) {
      console.error("❌ Error creating admin:", error);
      alert("Failed to create admin. Please try again.");
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin.id);
    setEditForm({ username: admin.username, password: "" });
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();

    if (editForm.password && editForm.password.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    try {
      const updateData = { username: editForm.username };
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const res = await fetch(`${BASE_URL}/api/admin/${editingAdmin}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update admin");
        return;
      }

      setAdmins(
        admins.map((admin) =>
          admin.id === editingAdmin
            ? { ...admin, username: data.username }
            : admin
        )
      );
      
      // Update current admin if they edited themselves
      if (currentAdmin?.id === editingAdmin) {
        const updatedCurrentAdmin = { ...currentAdmin, username: data.username };
        setCurrentAdmin(updatedCurrentAdmin);
        localStorage.setItem("adminUser", JSON.stringify(updatedCurrentAdmin));
      }

      setEditingAdmin(null);
      setEditForm({ username: "", password: "" });
      alert(`✅ Admin updated successfully!`);
    } catch (error) {
      console.error("❌ Error updating admin:", error);
      alert("Failed to update admin. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingAdmin(null);
    setEditForm({ username: "", password: "" });
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading admin users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-600 text-xl mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white p-10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-blue-700">
            Admin User Management
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin-feedback")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Feedback Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Current User Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-gray-700">
            <span className="font-semibold">Logged in as:</span>{" "}
            {currentAdmin?.username || "Unknown"}
          </p>
        </div>

        {/* Add New Admin Button */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            All Admin Users ({admins.length})
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showAddForm ? "Cancel" : "+ Add New Admin"}
          </button>
        </div>

        {/* Add Admin Form */}
        {showAddForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Create New Admin
            </h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, username: e.target.value })
                  }
                  required
                  minLength={3}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Enter password (min 6 characters)"
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Create Admin
              </button>
            </form>
          </div>
        )}

        {/* Admin List */}
        {admins.length === 0 ? (
          <p className="text-gray-600 text-center py-10">
            No admin users found.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg transition bg-gradient-to-br from-white to-gray-50"
              >
                {editingAdmin === admin.id ? (
                  // Edit Mode
                  <form onSubmit={handleUpdateAdmin} className="space-y-3">
                    <div>
                      <label className="block text-gray-700 text-sm mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) =>
                          setEditForm({ ...editForm, username: e.target.value })
                        }
                        required
                        minLength={3}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm mb-1">
                        New Password (leave blank to keep current)
                      </label>
                      <input
                        type="password"
                        value={editForm.password}
                        onChange={(e) =>
                          setEditForm({ ...editForm, password: e.target.value })
                        }
                        minLength={6}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm transition"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-400 text-sm transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {admin.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">
                            {admin.username}
                          </h3>
                          {admin.id === currentAdmin?.id && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-3">
                      Created: {new Date(admin.createdAt).toLocaleDateString()}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded-md hover:bg-yellow-600 text-sm transition"
                      >
                        Edit
                      </button>
                      {admin.id !== currentAdmin?.id && (
                        <button
                          onClick={() =>
                            handleDeleteAdmin(admin.id, admin.username)
                          }
                          className="flex-1 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
