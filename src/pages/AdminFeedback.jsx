import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Properly declare BASE_URL to avoid runtime ReferenceError which breaks the app.
const BASE_URL = import.meta.env.VITE_API_URL;

export default function AdminFeedback() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState([]);
  const [newForm, setNewForm] = useState({ title: "", description: "", fields: [] });
  const [editingForm, setEditingForm] = useState(null);
  const [showFieldManager, setShowFieldManager] = useState(null);

  // ✅ Fetch feedbacks from backend
  useEffect(() => {
    // ✅ Check if user is admin
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      navigate("/login");
      return;
    }

    const fetchFeedbacks = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/feedback`);
        if (!res.ok) throw new Error("Failed to fetch feedbacks");
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

    // ✅ Load form templates from backend
    const fetchForms = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/forms`);
        if (!res.ok) throw new Error("Failed to fetch forms");
        const data = await res.json();
        setForms(data);
      } catch (error) {
        console.error("❌ Error fetching forms:", error);
        alert("Unable to load forms. Please check your connection.");
        setForms([]);
      }
    };

    fetchForms();
  }, [navigate]);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  // ✅ Add New Form
  const handleAddForm = async () => {
    if (!newForm.title.trim()) return alert("Please enter a form title.");
    
    try {
      const res = await fetch(`${BASE_URL}/api/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newForm.title,
          description: newForm.description,
          fields: newForm.fields || [],
        }),
      });
      
      if (!res.ok) throw new Error("Failed to create form");
      const newFormData = await res.json();
      setForms([...forms, newFormData]);
      setNewForm({ title: "", description: "", fields: [] });
    } catch (error) {
      console.error("❌ Error creating form:", error);
      alert("Failed to create form. Please try again.");
    }
  };

  // ✅ Delete Form
  const handleDeleteForm = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/forms/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete form");
      const updated = forms.filter((form) => form.id !== id);
      setForms(updated);
    } catch (error) {
      console.error("❌ Error deleting form:", error);
      alert("Failed to delete form. Please try again.");
    }
  };

  // ✅ Edit Form
  const handleEditForm = (form) => setEditingForm({ ...form });

  // ✅ Save Edited Form
  const handleSaveEdit = async () => {
    if (!editingForm.title.trim()) return alert("Please enter a title.");
    
    try {
      const res = await fetch(`${BASE_URL}/api/forms/${editingForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingForm.title,
          description: editingForm.description,
          fields: editingForm.fields || [],
        }),
      });
      
      if (!res.ok) throw new Error("Failed to update form");
      const updated = forms.map((form) =>
        form.id === editingForm.id ? editingForm : form
      );
      setForms(updated);
      setEditingForm(null);
      alert("✅ Form updated successfully!");
    } catch (error) {
      console.error("❌ Error updating form:", error);
      alert("Failed to update form. Please try again.");
    }
  };

  // ✅ Add Custom Field
  const handleAddField = (formId) => {
    const fieldName = prompt("Enter field name (e.g., Phone, Company):");
    if (!fieldName) return;

    const fieldType = prompt(
      "Enter field type:\n- text (default)\n- textarea\n- email\n- number\n- select"
    ) || "text";

    let options = [];
    if (fieldType === "select") {
      const optionsInput = prompt(
        "Enter options separated by commas (e.g., Option1, Option2, Option3):"
      );
      options = optionsInput ? optionsInput.split(",").map((o) => o.trim()) : [];
    }

    const newField = {
      id: Date.now().toString(),
      name: fieldName,
      type: fieldType,
      options: options,
      required: confirm("Is this field required?"),
    };

    // Update form in state
    const updatedForm = forms.find((f) => f.id === formId);
    if (updatedForm) {
      updatedForm.fields = [...(updatedForm.fields || []), newField];
      setForms([...forms]);
    }

    if (editingForm && editingForm.id === formId) {
      setEditingForm({
        ...editingForm,
        fields: [...(editingForm.fields || []), newField],
      });
    }
  };

  // ✅ Remove Custom Field
  const handleRemoveField = (formId, fieldId) => {
    const updatedForm = forms.find((f) => f.id === formId);
    if (updatedForm) {
      updatedForm.fields = (updatedForm.fields || []).filter(
        (f) => f.id !== fieldId
      );
      setForms([...forms]);
    }

    if (editingForm && editingForm.id === formId) {
      setEditingForm({
        ...editingForm,
        fields: (editingForm.fields || []).filter((f) => f.id !== fieldId),
      });
    }
  };


  // ✅ Cancel Edit
  const handleCancelEdit = () => {
    setEditingForm(null);
    setShowFieldManager(null);
  };

  // ✅ Update Field
  const handleUpdateField = (fieldId, updates, formId) => {
    if (showFieldManager === formId) {
      setEditingForm({
        ...editingForm,
        fields: editingForm.fields.map((f) =>
          f.id === fieldId ? { ...f, ...updates } : f
        ),
      });
    } else {
      setNewForm({
        ...newForm,
        fields: newForm.fields.map((f) =>
          f.id === fieldId ? { ...f, ...updates } : f
        ),
      });
    }
  };

  // ✅ Download single feedback as PDF
  const handleDownloadSinglePDF = (fb) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text("Feedback Report", 105, 20, { align: "center" });
    
    // Add form type
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Form Type: ${fb.formType}`, 20, 40);
    
    // Add a line separator
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);
    
    // Add feedback details
    doc.setFontSize(12);
    let yPosition = 60;
    
    doc.setFont(undefined, 'bold');
    doc.text("Name:", 20, yPosition);
    doc.setFont(undefined, 'normal');
    const nameText = doc.splitTextToSize(fb.name, 140);
    doc.text(nameText, 50, yPosition);
    yPosition += 15 * nameText.length;
    
    doc.setFont(undefined, 'bold');
    doc.text("Email:", 20, yPosition);
    doc.setFont(undefined, 'normal');
    const emailText = doc.splitTextToSize(fb.email, 140);
    doc.text(emailText, 50, yPosition);
    yPosition += 15 * emailText.length;
    
    doc.setFont(undefined, 'bold');
    doc.text("Rating:", 20, yPosition);
    doc.setFont(undefined, 'normal');
    const ratingText = fb.rating > 0 
      ? `${fb.rating}/5 - ${["Very Poor", "Poor", "Average", "Good", "Excellent"][fb.rating - 1]}`
      : "Not rated";
    doc.text(ratingText, 50, yPosition);
    yPosition += 15;
    
    doc.setFont(undefined, 'bold');
    doc.text("Submitted:", 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(fb.createdAt, 50, yPosition);
    yPosition += 20;
    
    doc.setFont(undefined, 'bold');
    doc.text("Comments:", 20, yPosition);
    yPosition += 10;
    doc.setFont(undefined, 'normal');
    
    // Wrap comments text
    const splitComments = doc.splitTextToSize(fb.comments, 170);
    doc.text(splitComments, 20, yPosition);
    
    // Add footer
    const footerY = 270;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, footerY, { align: "center" });
    
    // Save the PDF
    const fileName = `feedback_${fb.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ✅ Download all feedbacks as PDF
  const handleDownloadAllPDF = (formType, feedbacksList) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text(`${formType} - All Feedbacks`, 105, 20, { align: "center" });
      
      // Add generation date
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 30, { align: "center" });
      
      // Create table data
      const tableData = feedbacksList.map(fb => [
        fb.name || "N/A",
        fb.email || "N/A",
        `${fb.rating}/5`,
        (fb.comments || "").substring(0, 50) + (fb.comments && fb.comments.length > 50 ? '...' : ''),
        fb.createdAt || "N/A"
      ]);
      
      // Add table using autoTable
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 40,
          head: [['Name', 'Email', 'Rating', 'Comments', 'Date']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235] },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 40 },
            2: { cellWidth: 20 },
            3: { cellWidth: 60 },
            4: { cellWidth: 35 }
          }
        });
      } else {
        // Fallback if autoTable is not available
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        let yPos = 50;
        
        feedbacksList.forEach((fb, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFont(undefined, 'bold');
          doc.text(`${index + 1}. ${fb.name}`, 20, yPos);
          doc.setFont(undefined, 'normal');
          yPos += 7;
          doc.text(`   Email: ${fb.email}`, 20, yPos);
          yPos += 7;
          doc.text(`   Rating: ${fb.rating}/5`, 20, yPos);
          yPos += 7;
          const comment = fb.comments.substring(0, 80) + (fb.comments.length > 80 ? '...' : '');
          const splitComment = doc.splitTextToSize(`   ${comment}`, 170);
          doc.text(splitComment, 20, yPos);
          yPos += 7 * splitComment.length + 5;
        });
      }
      
      // Save the PDF
      const fileName = `${formType.replace(/\s+/g, '_')}_all_feedbacks_${Date.now()}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ✅ Clear all analytics data
  const handleClearAnalytics = async () => {
    if (!window.confirm("Are you sure you want to clear all feedback analytics?")) return;

    try {
      const feedbackRes = await fetch(`${BASE_URL}/api/feedback`);
      const allFeedbacks = await feedbackRes.json();

      // Delete all feedback entries one by one (for safety)
      await Promise.all(
        allFeedbacks.map((f) =>
          fetch(`${BASE_URL}/api/feedback/${f.id}`, { method: "DELETE" })
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
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin-management")}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Manage Admins
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
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
                  {/* ✅ Normal Mode */}
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
                </div>
              ))}
            </div>
          )}

          {/* ✅ Edit Form Modal */}
          {editingForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Edit Form</h3>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="p-6">
                  <input
                    type="text"
                    value={editingForm.title}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        title: e.target.value,
                      })
                    }
                    className="border p-2 rounded-lg w-full mb-3"
                    placeholder="Form Title"
                  />
                  <textarea
                    value={editingForm.description}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        description: e.target.value,
                      })
                    }
                    className="border p-2 rounded-lg w-full mb-4"
                    rows="3"
                    placeholder="Form Description"
                  />
                  
                  {/* Custom Fields Section */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-base">Custom Fields</h4>
                      <button
                        type="button"
                        onClick={() => handleAddField(editingForm.id)}
                        className="text-blue-600 text-sm hover:underline font-semibold"
                      >
                        + Add Field
                      </button>
                    </div>
                    {editingForm.fields?.map((field) => (
                      <div key={field.id} className="border p-3 mb-3 rounded bg-gray-50">
                        {/* Field Name */}
                        <div className="mb-2">
                          <label className="text-xs font-semibold text-gray-600">
                            Field Name
                          </label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) =>
                              handleUpdateField(field.id, { name: e.target.value }, editingForm.id)
                            }
                            className="border p-1 rounded w-full text-sm mb-1 bg-white"
                            placeholder="e.g., Phone, Company"
                          />
                        </div>

                        {/* Field Type */}
                        <div className="mb-2">
                          <label className="text-xs font-semibold text-gray-600">
                            Field Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) =>
                              handleUpdateField(field.id, { type: e.target.value }, editingForm.id)
                            }
                            className="border p-1 rounded w-full text-sm bg-white"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="email">Email</option>
                            <option value="number">Number</option>
                            <option value="select">Select (Dropdown)</option>
                          </select>
                        </div>

                        {/* Options for Select Fields */}
                        {field.type === "select" && (
                          <div className="mb-2">
                            <label className="text-xs font-semibold text-gray-600">
                              Options (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={field.options?.join(", ") || ""}
                              onChange={(e) =>
                                handleUpdateField(
                                  field.id,
                                  { options: e.target.value.split(",").map((o) => o.trim()) },
                                  editingForm.id
                                )
                              }
                              className="border p-1 rounded w-full text-sm bg-white"
                              placeholder="Option1, Option2, Option3"
                            />
                          </div>
                        )}

                        {/* Required Toggle and Delete */}
                        <div className="flex justify-between items-center">
                          <label className="flex items-center text-xs gap-2">
                            <input
                              type="checkbox"
                              checked={field.required || false}
                              onChange={(e) =>
                                handleUpdateField(
                                  field.id,
                                  { required: e.target.checked },
                                  editingForm.id
                                )
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-gray-600">Required Field</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(editingForm.id, field.id)}
                            className="text-red-600 text-xs hover:underline font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-blue-700">
                    {formType} – Analytics
                  </h2>
                  <button
                    onClick={() => handleDownloadAllPDF(formType, feedbacks)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    Download All as PDF
                  </button>
                </div>

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
                      <p className="text-xs text-gray-400 italic mb-3">
                        Submitted on {fb.createdAt}
                      </p>
                      <button
                        onClick={() => handleDownloadSinglePDF(fb)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-1 w-full justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                          />
                        </svg>
                        Download PDF
                      </button>
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
