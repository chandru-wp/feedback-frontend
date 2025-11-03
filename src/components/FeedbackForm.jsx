 import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FeedbackForm() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    rating: 0,
    comments: "",
  });
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // ✅ Load forms (ensure one default exists) 
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("feedbackForms")) || [];

    // If no forms exist, create a default one
    if (stored.length === 0) {
      const defaultForm = {
        id: Date.now(),
        title: "General Feedback",
        description: "Share your thoughts about our service or platform.",
      };
      localStorage.setItem("feedbackForms", JSON.stringify([defaultForm]));
      setForms([defaultForm]);
    } else {
      setForms(stored);
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRating = (value) => {
    setForm({ ...form, rating: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        formType: selectedForm?.title || "General Feedback",
      };

      const res = await fetch("https://feedback-backend-eqzx.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit feedback");
      setSubmitted(true);
    } catch (error) {
      console.error("❌ Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again later.");
    }
  };

  const handleCancel = () => {
    setForm({ name: "", email: "", rating: 0, comments: "" });
    setSubmitted(false);
    setSelectedForm(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* ✅ Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-md fixed top-0 left-0 w-full z-50 border-b border-blue-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-3">
          <h1
            onClick={() => navigate("/")}
            className="text-2xl font-bold text-blue-700 cursor-pointer hover:text-blue-800 transition"
          >
            Feedback Portal
          </h1>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Admin Login
          </button>
        </div>
      </nav>

      {/* ✅ Main Section */}
      <div className="pt-28 px-6 flex flex-col items-center">
        {!selectedForm ? (
          <>
            <h2 className="text-4xl font-extrabold text-gray-800 mb-8 text-center tracking-tight">
              Choose a <span className="text-blue-600">Feedback Form</span>
            </h2>
            <p className="text-gray-500 mb-10 text-center max-w-2xl">
              Select a form below to share your thoughts and help us improve our
              services. Each form is tailored for a specific purpose.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
              {forms.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedForm(f)}
                  className="bg-white rounded-2xl shadow-lg px-8 py-8 cursor-pointer border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-transform duration-300 hover:-translate-y-2 group"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-blue-700 mb-3 group-hover:text-blue-800 transition">
                        {f.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {f.description || "No description provided."}
                      </p>
                    </div>
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all">
                      Fill Form
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // ✅ Selected Form
          <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md mt-10 border border-blue-100">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
              {selectedForm.title}
            </h2>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-gray-700 mb-2">Rating</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => handleRating(star)}
                        className="transition transform hover:scale-110"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill={
                            star <= (hovered || form.rating)
                              ? "#facc15"
                              : "none"
                          }
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-8 h-8 text-yellow-400 drop-shadow-md"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.16 5.029a.562.562 0 00.475.346l5.52.403a.562.562 0 01.317.986l-4.205 3.639a.562.562 0 00-.182.557l1.257 5.354a.562.562 0 01-.84.61l-4.674-2.802a.562.562 0 00-.586 0l-4.674 2.802a.562.562 0 01-.84-.61l1.257-5.354a.562.562 0 00-.182-.557L2.509 10.263a.562.562 0 01.317-.986l5.52-.403a.562.562 0 00.475-.346l2.16-5.029z"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                  {form.rating > 0 && (
                    <p className="text-center mt-1 text-yellow-600 font-medium">
                      {
                        ["Very Poor", "Poor", "Average", "Good", "Excellent"][
                          form.rating - 1
                        ]
                      }
                    </p>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-gray-700 mb-1">Comments</label>
                  <textarea
                    name="comments"
                    value={form.comments}
                    onChange={handleChange}
                    rows="4"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                    placeholder="Share your feedback..."
                  ></textarea>
                </div>

                {/* Buttons */}
                <div className="flex justify-between items-center mt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-green-600 mb-4">
                  Thank You! 🎉
                </h3>
                <p className="text-gray-600">
                  Your feedback for{" "}
                  <span className="font-semibold text-blue-600">
                    {selectedForm?.title}
                  </span>{" "}
                  has been recorded.
                </p>
                <button
                  onClick={handleCancel}
                  className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Submit Another
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
