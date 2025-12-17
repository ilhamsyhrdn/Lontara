"use client";

import { useState, useEffect } from "react"; // ✅ ADD useEffect
import {
  FiUpload,
  FiX,
  FiPaperclip,
  FiSend,
  FiSave,
  FiAlertCircle,
  FiMoreVertical,
} from "react-icons/fi";
import emailService from "@/services/mailManagement";
import ProtectedRoute from "../components/Routes/ProtectedRoutes";
import AppLayout from "../components/ui/AppLayout";

export default function ComposeMailPage() {
  const [formData, setFormData] = useState({
    mailNumber: "",
    recipient: "",
    subject: "",
    link: "",
    messageBody: "",
  });

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isReply, setIsReply] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const replyDataStr = localStorage.getItem("replyData");

    if (replyDataStr) {
      try {
        const replyData = JSON.parse(replyDataStr);

        console.log("📧 Loading reply data:", replyData);

        setFormData({
          mailNumber: "",
          recipient: replyData.recipient || "",
          subject: replyData.subject || "",
          link: "",
          messageBody: replyData.messageBody || "",
        });

        setIsReply(true);

        // Clear from localStorage after loading
        localStorage.removeItem("replyData");
      } catch (err) {
        console.error("❌ Failed to parse reply data:", err);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      type: file.type,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const newAttachments = files.map((file) => ({
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      type: file.type,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.recipient) {
      setError("Recipient email is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipient)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!formData.subject) {
      setError("Subject is required");
      return false;
    }
    if (!formData.messageBody) {
      setError("Message body is required");
      return false;
    }
    return true;
  };

  const handleSendMail = async () => {
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const emailData = {
        to: formData.recipient,
        subject: formData.subject,
        body: formData.messageBody,
        link: formData.link,
      };

      console.log("📧 Sending email:", emailData);

      const response = await emailService.sendEmail(emailData, attachments);

      if (!response.success) {
        throw new Error(response.error || "Failed to send email");
      }

      setSuccess(true);
      console.log("✅ Email sent successfully");

      // Reset form
      setTimeout(() => {
        setFormData({
          mailNumber: "",
          recipient: "",
          subject: "",
          link: "",
          messageBody: "",
        });
        setAttachments([]);
        setSuccess(false);
        setIsReply(false);
      }, 2000);
    } catch (err) {
      console.error("❌ Error sending email:", err);

      if (
        err.message.includes("session has expired") ||
        err.message.includes("login")
      ) {
        setError("⚠️ " + err.message);
      } else if (err.message.includes("Gmail connection")) {
        setError("⚠️ " + err.message + " Go to Settings to reconnect.");
      } else {
        setError(err.message || "Failed to send email");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setError(null);
    setSuccess(false);

    try {
      setLoading(true);

      const draftData = {
        to: formData.recipient,
        subject: formData.subject,
        body: formData.messageBody,
        link: formData.link,
      };

      console.log("💾 Saving draft:", draftData);

      const response = await emailService.saveDraft(draftData, attachments);

      if (!response.success) {
        throw new Error(response.error || "Failed to save draft");
      }

      setSuccess(true);
      console.log("✅ Draft saved successfully");
    } catch (err) {
      console.error("❌ Error saving draft:", err);
      setError(err.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="flex h-full bg-gray-50">
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <h1 className="text-2xl font-semibold text-gray-800">
                {isReply ? "Reply to Email" : "Compose New Mail"}
              </h1>
              {isReply && (
                <p className="text-sm text-gray-600 mt-1">
                  Replying to: {formData.recipient}
                </p>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto">
                {/* Success Message */}
                {success && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <FiAlertCircle className="text-green-600" size={20} />
                    <p className="text-green-600">
                      ✅{" "}
                      {loading
                        ? "Draft saved successfully!"
                        : "Email sent successfully!"}
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <FiAlertCircle className="text-red-600" size={20} />
                    <p className="text-red-600">❌ {error}</p>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Mail Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mail number:
                      </label>
                      <input
                        type="text"
                        name="mailNumber"
                        value={formData.mailNumber}
                        onChange={handleInputChange}
                        placeholder="Auto-generated"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        disabled
                      />
                    </div>

                    {/* Recipient Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient Email: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="recipient"
                        value={formData.recipient}
                        onChange={handleInputChange}
                        placeholder="example@email.com"
                        className="w-full px-4 py-2 border text-black/80 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 mb-6">
                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Enter Subject"
                        className="w-full px-4 py-2 border text-black/80 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Attachments Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    >
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <FiUpload className="text-gray-400" size={32} />
                        <p className="text-sm text-gray-600">
                          Click to upload files or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, JPG, PNG (max 10 files)
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Attachments List */}
                  {attachments.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Uploaded Files:
                      </label>
                      <div className="space-y-2">
                        {attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <FiPaperclip className="text-blue-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {attachment.size}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <FiX className="text-gray-600" size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link */}
                  {/* <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link (Optional)
                    </label>
                    <input
                      type="url"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border border-gray-300 text-black/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div> */}

                  {/* Message Body */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Body <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="messageBody"
                      value={formData.messageBody}
                      onChange={handleInputChange}
                      placeholder="Enter your message here..."
                      rows={10}
                      className="w-full px-4 py-2 border text-black/80 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen((p) => !p)}
                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                      >
                        <FiMoreVertical size={18} />
                        Actions
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              handleSendMail();
                            }}
                            disabled={loading}
                            className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Send Now
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              handleSaveAsDraft();
                            }}
                            disabled={loading}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save Draft
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setFormData({
                                mailNumber: "",
                                recipient: "",
                                subject: "",
                                link: "",
                                messageBody: "",
                              });
                              setAttachments([]);
                            }}
                            disabled={loading}
                            className="w-full text-left px-4 py-2 text-sm text-red-600  hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Clear Form
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSaveAsDraft}
                      disabled={loading}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSave size={18} />
                      Save as Draft
                    </button>
                    <button
                      onClick={handleSendMail}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSend size={18} />
                      {loading
                        ? "Sending..."
                        : isReply
                        ? "Send Reply"
                        : "Send Mail"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
