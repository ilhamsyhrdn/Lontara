"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ ADD THIS
import {
  FiChevronLeft,
  FiStar,
  FiMoreVertical,
  FiCornerUpRight,
  FiBell,
} from "react-icons/fi";
import ProtectedRoute from "../Routes/ProtectedRoutes";
import AppLayout from "../ui/AppLayout";
import mailService from "@/services/mailManagement";

export default function ViewMail({ email, onBack }) {
  const [isStarred, setIsStarred] = useState(false);
  const router = useRouter();
  const [resolvedAttachments, setResolvedAttachments] = useState([]);
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  const cutoffTokens = [
    "@media",
    "RECOMMENDED FOR YOU",
    "This message was sent to",
    "Meta Platforms",
  ];

  const sanitizeEmailBody = (raw) => {
    if (!raw) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/gi;

    const toText = (html) => {
      if (typeof window === "undefined") {
        return String(html).replace(/<[^>]*>/g, " ");
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(String(html), "text/html");
      doc.querySelectorAll("script, style").forEach((el) => el.remove());
      return doc.body.textContent || "";
    };

    let text = toText(raw);

    cutoffTokens.forEach((token) => {
      const idx = text.indexOf(token);
      if (idx !== -1) {
        text = text.slice(0, idx);
      }
    });

    text = text.replace(urlRegex, (match) => {
      try {
        const url = new URL(match);
        const path = url.pathname === "/" ? "" : url.pathname;
        return `${url.hostname}${path}`;
      } catch {
        return match;
      }
    });

    const lines = text
      .split(/\r?\n/)
      .map((l) =>
        l
          .replace(/[{}]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(
        (l) =>
          l &&
          l !== "========================================" &&
          !l.toLowerCase().includes("unsubscribe") &&
          !l.toLowerCase().includes("meta platforms")
      );

    const seen = new Set();
    const unique = lines.filter((l) => {
      const key = l.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.join("<br />");
  };

  const buildAttachmentUrl = (attachment) => {
    if (!attachment?.attachmentId) return null;
    const params = new URLSearchParams();
    if (attachment.filename) params.append("filename", attachment.filename);
    if (attachment.mimeType) params.append("mimeType", attachment.mimeType);
    return `${API_BASE}/user/emails/${email.id}/attachments/${attachment.attachmentId}?${params.toString()}`;
  };

  useEffect(() => {
    if (!email?.attachments || email.attachments.length === 0) {
      setResolvedAttachments([]);
      return;
    }
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;
    const urlsToRevoke = [];

    (async () => {
      const items = await Promise.all(
        email.attachments.map(async (att) => {
          const href = buildAttachmentUrl(att);
          if (!href) return null;
          try {
            const res = await fetch(href, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (!res.ok) return null;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            urlsToRevoke.push(url);
            return {
              name: att.filename || att.name || "Attachment",
              mimeType: att.mimeType,
              size: att.size,
              href: url,
            };
          } catch (err) {
            console.error("Failed to fetch attachment", err);
            return null;
          }
        })
      );
      if (!cancelled) {
        setResolvedAttachments(items.filter(Boolean));
      }
    })();

    return () => {
      cancelled = true;
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [email]);

  // Extract sender email
  const getSenderEmail = (from) => {
    if (!from) return "";
    const match = from.match(/<(.+)>/);
    return match ? match[1] : from;
  };

  // Extract sender name
  const getSenderName = (from) => {
    if (!from) return "Unknown";
    const match = from.match(/^([^<]+)</);
    return match ? match[1].trim() : from.split("@")[0];
  };

  // Format date
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

      return `${diffHours} hours ago`;
    } catch {
      return dateString;
    }
  };

  // Format full date
  const formatFullDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Extract quick reply suggestions from email body
  const extractQuickReplies = (body) => {
    const defaultReplies = [
      "Looking forward to it!",
      "We will be there!",
      "Thanks for the update!",
    ];
    return defaultReplies;
  };

  // ✅ HANDLE REPLY BUTTON
  const handleReply = () => {
    const replyData = {
      recipient: getSenderEmail(email.from),
      subject: email.subject?.startsWith("Re:")
        ? email.subject
        : `Re: ${email.subject || "(No Subject)"}`,
      originalBody: email.body,
      replyTo: email.id,
    };

    // Save to localStorage for outgoing-mail page to read
    localStorage.setItem("replyData", JSON.stringify(replyData));

    // Navigate to outgoing-mail page
    router.push("/compose-mail");
  };

  // ✅ HANDLE QUICK REPLY
  const handleQuickReply = (replyText) => {
    const replyData = {
      recipient: getSenderEmail(email.from),
      subject: email.subject?.startsWith("Re:")
        ? email.subject
        : `Re: ${email.subject || "(No Subject)"}`,
      messageBody: replyText,
      originalBody: email.body,
      replyTo: email.id,
    };

    localStorage.setItem("replyData", JSON.stringify(replyData));
    router.push("/compose-mail");
  };

  const quickReplies = extractQuickReplies(email.body);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRead, setIsRead] = useState(!!email?.isRead);
  const [isActing, setIsActing] = useState(false);

  const toggleRead = async () => {
    if (!email?.id) return;
    try {
      setIsActing(true);
      if (isRead) {
        await mailService.markAsUnread(email.id);
        setIsRead(false);
      } else {
        await mailService.markAsRead(email.id);
        setIsRead(true);
      }
    } catch (err) {
      console.error("Failed to toggle read", err);
      alert("Failed to update status");
    } finally {
      setIsActing(false);
      setIsMenuOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!email?.id) return;
    try {
      setIsActing(true);
      await mailService.deleteEmail(email.id);
      alert("Email deleted");
      onBack?.();
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete email");
    } finally {
      setIsActing(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="flex h-full bg-gray-50">
          <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiChevronLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-semibold text-gray-800">
                  {email.subject || "(No Subject)"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsStarred(!isStarred)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiStar
                    size={20}
                    className={
                      isStarred
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-600"
                    }
                  />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen((p) => !p)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiMoreVertical size={20} className="text-gray-600" />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={toggleRead}
                        disabled={isActing}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isRead ? "Mark as Unread" : "Mark as Read"}
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isActing}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Sender Info */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      getSenderName(email.from)
                    )}&background=random`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {getSenderName(email.from)}{" "}
                      <span className="text-gray-500 font-normal">
                        &lt;{getSenderEmail(email.from)}&gt;
                      </span>
                    </h2>
                    <p className="text-sm text-gray-500">to me</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {formatDateTime(email.date)}
                  </p>
                </div>
              </div>

              {/* Email Body */}
              <div className="mb-6">
                <div
                  className="text-gray-700 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailBody(email.body) }}
                />
              </div>

              {/* Attachments */}
              {resolvedAttachments.length > 0 && (
                <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Attachments ({resolvedAttachments.length})
                  </h3>
                  <div className="space-y-2">
                    {resolvedAttachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-3 py-2 rounded-md border border-gray-200 bg-white"
                      >
                        <span className="w-8 h-8 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 text-xs">
                          {file.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 truncate">
                            {file.name}
                          </p>
                          {file.size && (
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                        {file.href ? (
                          <a
                            href={file.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">No link</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Reply Suggestions */}
              {/* <div className="border-t border-gray-200 pt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Quick Replies:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div> */}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleReply}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-lg transition-colors"
                >
                  <FiCornerUpRight size={16} className="transform rotate-180" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
