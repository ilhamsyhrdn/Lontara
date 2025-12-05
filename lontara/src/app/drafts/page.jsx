"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiPaperclip,
  FiTrash2,
  FiEdit3,
  FiSend,
  FiRefreshCw,
  FiAlertCircle,
  FiX,
  FiFile,
  FiImage,
  FiPlus,
} from "react-icons/fi";
import emailService from "../../services/mailManagement";
import ProtectedRoute from "../components/Routes/ProtectedRoutes";
import AppLayout from "../components/ui/AppLayout";

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDraft, setSelectedDraft] = useState(null);

  // ✅ NEW: Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    to: "",
    subject: "",
    body: "",
    link: "",
  });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // ✅ NEW: Attachment state
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📥 Fetching drafts...");

      const response = await emailService.getDraftEmails(100);

      console.log("📧 Full response:", response);

      let draftList = [];

      if (response?.success && response?.data?.drafts) {
        draftList = response.data.drafts;
      } else if (response?.data?.messages) {
        draftList = response.data.messages;
      } else if (response?.drafts) {
        draftList = response.drafts;
      } else if (Array.isArray(response?.data)) {
        draftList = response.data;
      } else if (Array.isArray(response)) {
        draftList = response;
      }

      console.log("✅ Parsed drafts:", draftList.length);

      setDrafts(draftList);
    } catch (err) {
      console.error("❌ Error fetching drafts:", err);
      setError(err.message);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // ✅ NEW: Handle card click to open edit modal
  const handleCardClick = (draft) => {
    console.log("✏️ Opening edit modal for draft:", draft);

    // Extract body from HTML if needed
    let bodyContent = draft.body || draft.snippet || "";

    // Simple HTML to text conversion
    if (bodyContent.includes("<")) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = bodyContent;
      bodyContent = tempDiv.textContent || tempDiv.innerText || "";
    }

    setEditFormData({
      to: draft.to || "",
      subject: draft.subject === "(No Subject)" ? "" : draft.subject || "",
      body: bodyContent.trim(),
      link: draft.link || "",
    });
    setSelectedDraft(draft);
    setAttachments([]); // Reset attachments when opening modal
    setEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 25 * 1024 * 1024; 

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 25MB.`);
        return false;
      }
      return true;
    });

    const newAttachments = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ✅ NEW: Remove attachment
  const handleRemoveAttachment = (attachmentId) => {
    setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
  };

  // ✅ NEW: Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // ✅ NEW: Get file icon based on type
  const getFileIcon = (type) => {
    if (type.startsWith("image/")) {
      return <FiImage className="text-green-500" size={20} />;
    }
    return <FiFile className="text-blue-500" size={20} />;
  };

  // ✅ NEW: Handle save draft
  const handleSaveDraft = async () => {
    try {
      setSaving(true);

      console.log("💾 Saving draft:", editFormData);
      console.log("📎 Attachments:", attachments.length);

      // Delete old draft first
      if (selectedDraft?.id) {
        await emailService.deleteDraft(selectedDraft.id);
      }

      // Save new draft with attachments
      const response = await emailService.saveDraft(
        {
          to: editFormData.to,
          subject: editFormData.subject,
          body: editFormData.body,
          link: editFormData.link,
        },
        attachments
      );

      if (!response?.success) {
        throw new Error(response?.error || "Failed to save draft");
      }

      console.log("✅ Draft saved successfully");

      // Close modal and refresh
      setEditModalOpen(false);
      setSelectedDraft(null);
      setAttachments([]);
      fetchDrafts();

      alert("Draft saved successfully!");
    } catch (err) {
      console.error("❌ Error saving draft:", err);
      alert("Failed to save draft: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ NEW: Handle send from modal
  const handleSendFromModal = async () => {
    if (!editFormData.to) {
      alert("Please enter a recipient email address");
      return;
    }

    if (!confirm("Send this email now?")) {
      return;
    }

    try {
      setSending(true);

      console.log("📤 Sending email:", editFormData);
      console.log("📎 Attachments:", attachments.length);

      const response = await emailService.sendEmail(
        {
          to: editFormData.to,
          subject: editFormData.subject || "(No Subject)",
          body: editFormData.body,
          link: editFormData.link,
        },
        attachments
      );

      if (!response?.success) {
        throw new Error(response?.error || "Failed to send email");
      }

      console.log("✅ Email sent successfully");

      // Delete the draft after sending
      if (selectedDraft?.id) {
        await emailService.deleteDraft(selectedDraft.id);
      }

      // Close modal and refresh
      setEditModalOpen(false);
      setSelectedDraft(null);
      setAttachments([]);
      fetchDrafts();

      alert("Email sent successfully!");
    } catch (err) {
      console.error("❌ Error sending email:", err);
      alert("Failed to send email: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // ✅ NEW: Close modal
  const handleCloseModal = () => {
    if (saving || sending) return;

    setEditModalOpen(false);
    setSelectedDraft(null);
    setAttachments([]);
    setEditFormData({
      to: "",
      subject: "",
      body: "",
      link: "",
    });
  };

  const handleDeleteDraft = async (draftId, e) => {
    e?.stopPropagation();

    if (!confirm("Are you sure you want to delete this draft?")) {
      return;
    }

    try {
      console.log("🗑️ Deleting draft:", draftId);

      await emailService.deleteDraft(draftId);

      console.log("✅ Draft deleted successfully");

      // Close modal if open
      if (editModalOpen && selectedDraft?.id === draftId) {
        handleCloseModal();
      }

      setDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
    } catch (err) {
      console.error("❌ Error deleting draft:", err);
      alert("Failed to delete draft: " + err.message);
    }
  };

  const handleSendDraft = async (draft, e) => {
    e?.stopPropagation();

    if (!draft.to) {
      // Open modal to edit if no recipient
      handleCardClick(draft);
      alert("Please add a recipient before sending");
      return;
    }

    if (!confirm("Send this draft now?")) {
      return;
    }

    try {
      console.log("📤 Sending draft:", draft);

      const response = await emailService.sendEmail({
        to: draft.to,
        subject: draft.subject || "(No Subject)",
        body: draft.body || draft.snippet || "",
      });

      if (!response?.success) {
        throw new Error(response?.error || "Failed to send email");
      }

      console.log("✅ Draft sent successfully");

      await emailService.deleteDraft(draft.id);

      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));

      alert("Draft sent successfully!");
    } catch (err) {
      console.error("❌ Error sending draft:", err);
      alert("Failed to send draft: " + err.message);
    }
  };

  const filteredDrafts = drafts.filter((draft) => {
    const query = searchQuery.toLowerCase();
    return (
      (draft.subject || "").toLowerCase().includes(query) ||
      (draft.to || "").toLowerCase().includes(query) ||
      (draft.snippet || "").toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown date";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const formatDraft = (draft) => {
    return {
      id: draft.id,
      messageId: draft.messageId,
      to: draft.to || "No recipient",
      subject: draft.subject || "(No Subject)",
      snippet: draft.snippet || draft.body || "",
      body: draft.body || "",
      date: formatDate(draft.date),
      hasAttachment: draft.hasAttachments || false,
    };
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="flex h-full bg-gray-50">
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <h1 className="text-2xl font-semibold text-gray-800">Drafts</h1>

                <div className="flex-1 max-w-md relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drafts..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={fetchDrafts}
                  disabled={loading}
                  title="Refresh drafts"
                >
                  <FiRefreshCw
                    className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
                    size={20}
                  />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <FiAlertCircle className="text-red-500" size={20} />
                  <div className="flex-1">
                    <p className="text-red-600">❌ {error}</p>
                    <button
                      onClick={fetchDrafts}
                      className="mt-2 text-sm text-red-700 underline hover:no-underline"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <FiRefreshCw
                    className="animate-spin text-blue-500"
                    size={40}
                  />
                  <span className="ml-3 text-gray-600">Loading drafts...</span>
                </div>
              ) : filteredDrafts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                    <FiEdit3 className="text-gray-400" size={40} />
                  </div>
                  <p className="text-xl text-gray-600 mb-2">No drafts found</p>
                  <p className="text-sm text-gray-500">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Start composing an email to create a draft"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Draft Count */}
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {filteredDrafts.length}{" "}
                      {filteredDrafts.length === 1 ? "draft" : "drafts"}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Click on a draft to edit
                    </p>
                  </div>

                  {/* Draft List */}
                  <div className="space-y-3">
                    {filteredDrafts.map((draft) => {
                      const formatted = formatDraft(draft);

                      return (
                        <div
                          key={formatted.id}
                          className="bg-white rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all border border-gray-200 cursor-pointer group"
                          onClick={() => handleCardClick(draft)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Subject */}
                              <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                                {formatted.subject}
                              </h3>

                              {/* To */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-gray-600">
                                  To:
                                </span>
                                <span className="text-sm text-blue-600">
                                  {formatted.to}
                                </span>
                              </div>

                              {/* Snippet */}
                              {formatted.snippet && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {formatted.snippet}
                                </p>
                              )}

                              {/* Attachment indicator */}
                              {formatted.hasAttachment && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <FiPaperclip size={16} />
                                  <span>Has attachment</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-start gap-2 ml-4">
                              <span className="text-sm text-gray-500">
                                {formatted.date}
                              </span>

                              {/* Edit button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(draft);
                                }}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit draft"
                              >
                                <FiEdit3 className="text-blue-600" size={16} />
                              </button>

                              {/* Send button */}
                              <button
                                onClick={(e) => handleSendDraft(draft, e)}
                                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                title="Send draft"
                              >
                                <FiSend className="text-green-600" size={16} />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={(e) =>
                                  handleDeleteDraft(formatted.id, e)
                                }
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete draft"
                              >
                                <FiTrash2 className="text-red-600" size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ✅ NEW: Edit Draft Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800">
                  Edit Draft
                </h2>
                <button
                  onClick={handleCloseModal}
                  disabled={saving || sending}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FiX size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="to"
                    value={editFormData.to}
                    onChange={handleInputChange}
                    placeholder="recipient@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={editFormData.subject}
                    onChange={handleInputChange}
                    placeholder="Email subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link (optional)
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={editFormData.link}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    name="body"
                    value={editFormData.body}
                    onChange={handleInputChange}
                    placeholder="Write your message here..."
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* ✅ NEW: Attachments Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    accept="*/*"
                  />

                  {/* Add attachment button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving || sending}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                  >
                    <FiPlus size={18} />
                    <span>Add Attachment</span>
                  </button>

                  {/* Attachment list */}
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            {getFileIcon(attachment.type)}
                            <div>
                              <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(attachment.id)}
                            disabled={saving || sending}
                            className="p-1.5 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                            title="Remove attachment"
                          >
                            <FiX className="text-red-500" size={16} />
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 mt-2">
                        {attachments.length} file{attachments.length > 1 ? "s" : ""} attached
                        {" • "}
                        Total: {formatFileSize(attachments.reduce((acc, att) => acc + att.size, 0))}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteDraft(selectedDraft?.id)}
                    disabled={saving || sending}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FiTrash2 size={18} />
                    <span>Delete</span>
                  </button>

                  {/* Attachment button in footer */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving || sending}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Add attachment"
                  >
                    <FiPaperclip size={18} />
                    {attachments.length > 0 && (
                      <span className="text-sm">({attachments.length})</span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseModal}
                    disabled={saving || sending}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveDraft}
                    disabled={saving || sending}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <FiRefreshCw className="animate-spin" size={18} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FiEdit3 size={18} />
                        <span>Save Draft</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSendFromModal}
                    disabled={saving || sending || !editFormData.to}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <FiRefreshCw className="animate-spin" size={18} />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <FiSend size={18} />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
