import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Properly declare BASE_URL to avoid runtime ReferenceError which breaks the app.
const BASE_URL = import.meta.env.VITE_API_URL;

export default function AdminFeedback() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState([]);
  const [newForm, setNewForm] = useState({ title: "", description: "" });
  const [editingForm, setEditingForm] = useState(null);

  // ✅ Fetch feedbacks from backend
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/feedback`);
        if (!res.ok) throw new Error("Failed too fetch feedbacks");
        const data = await res.json();

        const formatted = data.map((item) => ({
          id: item.id,
          formType: item.answers?.formType || "General Feedback",
          name: item.answers?.name || "Anonymous",
          email: item.answers?.email || "N/A",
          rating: Number(item.answers?.rating) || 0,
          comments: item.answers?.comments || "No comments provided",
          createdAt: new Date(item.createdAt).toLocaleString(),
        }));

        setFeedbacks(formatted);
      } catch (err) {
        console.error("❌ Error fetching feedbacks:", err);
        setError("Failed to load feedbacks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();

    // ✅ Load form templates from localStorage
    const savedForms = JSON.parse(localStorage.getItem("feedbackForms")) || [];
    setForms(savedForms);
  }, []);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/login");
  };

  // ✅ Add New Form
  const handleAddForm = () => {
    if (!newForm.title.trim()) return alert("Please enter a form title.");
    const updated = [
      ...forms,
      { id: Date.now(), title: newForm.title, description: newForm.description },
    ];
    setForms(updated);
    localStorage.setItem("feedbackForms", JSON.stringify(updated));
    setNewForm({ title: "", description: "" });
  };

  // ✅ Delete Form
  const handleDeleteForm = (id) => {
    const updated = forms.filter((form) => form.id !== id);
    setForms(updated);
    localStorage.setItem("feedbackForms", JSON.stringify(updated));
  };

  // ✅ Edit Form
  const handleEditForm = (form) => setEditingForm({ ...form });

  // ✅ Save Edited Form
  const handleSaveEdit = () => {
    if (!editingForm.title.trim()) return alert("Please enter a title.");
    const updated = forms.map((form) =>
      form.id === editingForm.id ? editingForm : form
    );
    setForms(updated);
    localStorage.setItem("feedbackForms", JSON.stringify(updated));
    setEditingForm(null);
  };

  // ✅ Cancel Edit
  const handleCancelEdit = () => setEditingForm(null);

  // ✅ Clear all analytics data
  const handleClearAnalytics = async () => {
    if (!window.confirm("Are you sure you want to clear all feedback analytics?")) return;

    try {
      const feedbackRes = await fetch(`${BASE_URL}/api/feedback`);
      const allFeedbacks = await feedbackRes.json();

      // Delete all feedback entries one by one (for safety)
      await Promise.all(
        allFeedbacks.map((f) =>
          fetch(`${BASE_URL}/api/feedback ${f.id}`, { method: "DELETE" })
        )
      );

      setFeedbacks([]); // clear frontend
      alert("✅ All analytics cleared successfully!");
    } catch (err) {
      console.error("❌ Error clearing analytics:", err);
      alert("Failed to clear analytics. Please try again.");
    }
  };

  // ✅ Group feedbacks by form type
  const groupedFeedbacks = feedbacks.reduce((acc, fb) => {
    const key = fb.formType || "General Feedback";
    if (!acc[key]) acc[key] = [];
    acc[key].push(fb);
    return acc;
  }, {});

  // ✅ Compute analytics
  const formAnalytics = Object.entries(groupedFeedbacks).map(
    ([formType, fbs]) => {
      const total = fbs.length;
      const avg =
        total > 0
          ? (fbs.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1)
          : 0;
      const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
        rating: r,
        count: fbs.filter((f) => f.rating === r).length,
      }));
      return { formType, total, avg, ratingCounts, feedbacks: fbs };
    }
  );

  // ✅ Loading & Error states
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-gray-600">
        Loading feedbacks...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-red-600 text-xl mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );

  // ✅ Dashboard
  return (
    <div className="min-h-screen bg-[#f7f7f7] py-10 px-6">
      <div className="max-w-7xl mx-auto bg-white p-10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-blue-700">
            Admin Feedback Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* ✅ Manage Feedback Forms */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Manage Feedback Forms
          </h2>

          {/* Add New Form */}
          <div className="bg-gray-50 border rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Add New Feedback Form
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Form Title"
                value={newForm.title}
                onChange={(e) =>
                  setNewForm({ ...newForm, title: e.target.value })
                }
                className="border p-2 rounded-lg flex-1"
              />
              <input
                type="text"
                placeholder="Form Description (optional)"
                value={newForm.description}
                onChange={(e) =>
                  setNewForm({ ...newForm, description: e.target.value })
                }
                className="border p-2 rounded-lg flex-1"
              />
              <button
                onClick={handleAddForm}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Add Form
              </button>
            </div>
          </div>

          {/* Display Forms */}
          {forms.length === 0 ? (
            <p className="text-gray-600 text-center">
              No feedback forms created yet.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg transition bg-gradient-to-br from-white to-gray-50"
                >
                  {editingForm && editingForm.id === form.id ? (
                    // ✅ Edit Mode
                    <div>
                      <input
                        type="text"
                        value={editingForm.title}
                        onChange={(e) =>
                          setEditingForm({
                            ...editingForm,
                            title: e.target.value,
                          })
                        }
                        className="border p-2 rounded-lg w-full mb-2"
                      />
                      <textarea
                        value={editingForm.description}
                        onChange={(e) =>
                          setEditingForm({
                            ...editingForm,
                            description: e.target.value,
                          })
                        }
                        className="border p-2 rounded-lg w-full mb-3"
                        rows="3"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ✅ Normal Mode
                    <>
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        {form.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {form.description || "No description provided"}
                      </p>
                      <div className="flex justify-between">
                        <button
                          onClick={() => handleEditForm(form)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ✅ Feedback Analytics Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Feedback Analytics
          </h2>
          {feedbacks.length > 0 && (
            <button
              onClick={handleClearAnalytics}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Clear Analytics
            </button>
          )}
        </div>

        {formAnalytics.length === 0 ? (
          <p className="text-gray-600 text-center text-lg">
            No feedback data available 😕
          </p>
        ) : (
          formAnalytics.map(
            ({ formType, total, avg, ratingCounts, feedbacks }) => (
              <div
                key={formType}
                className="mb-12 border-t border-gray-200 pt-10 first:pt-0"
              >
                <h2 className="text-2xl font-bold text-blue-700 mb-4">
                  {formType} – Analytics
                </h2>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {/* Average Rating */}
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 rounded-xl shadow text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">
                      Average Rating
                    </h3>
                    <p className="text-4xl font-bold text-yellow-600">{avg} ⭐</p>
                  </div>

                  {/* Total Feedbacks */}
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-xl shadow text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">
                      Total Feedbacks
                    </h3>
                    <p className="text-4xl font-bold text-blue-600">{total}</p>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-xl shadow">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">
                      Rating Breakdown
                    </h3>
                    {ratingCounts.map((r) => (
                      <div key={r.rating} className="flex justify-between mb-2">
                        <span className="text-gray-700">{r.rating} ⭐</span>
                        <div className="flex-1 mx-2 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-green-500 h-3 rounded-full transition-all"
                            style={{ width: `${(r.count / total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-700 font-medium">
                          {r.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg transition bg-gradient-to-br from-white to-blue-50"
                    >
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        {fb.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">{fb.email}</p>
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500 text-lg">⭐</span>
                        <span className="ml-1 text-gray-700">
                          {fb.rating}/5
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{fb.comments}</p>
                      <p className="text-xs text-gray-400 italic">
                        Submitted on {fb.createdAt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
