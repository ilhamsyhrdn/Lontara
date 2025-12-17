"use client";

import { useState, useEffect, useMemo } from "react";
import { Send, Trash2, CheckCircle, RefreshCw, Mail, Calendar, ChevronRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Button from "../ui/button";
import emailService from "@/services/mailManagement";

dayjs.extend(relativeTime);

const STATUS_OPTIONS = ["Unread", "Done"];
const STATUS_COLORS = {
  Unread: "bg-slate-100 text-slate-600 border border-slate-200",
  Done: "bg-emerald-50 text-emerald-600 border border-emerald-200",
};

export default function RecentMails({ onRefresh, selectedDate, onDateChange, allEmails = [] }) {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [selectedMails, setSelectedMails] = useState(new Set());
  const router = useRouter();

  // Default to today if no date selected
  const displayDate = selectedDate || dayjs();
  const isToday = dayjs(displayDate).isSame(dayjs(), "day");

  useEffect(() => {
    if (allEmails.length > 0) {
      // Use allEmails from parent if available
      filterAndSetMails(allEmails);
    } else {
      fetchRecentMails();
    }
  }, [allEmails, displayDate]);

  const filterAndSetMails = (emails) => {
    const targetDate = dayjs(displayDate).format("YYYY-MM-DD");
    
    const filteredEmails = emails.filter((email) => {
      if (!email.date) return false;
      try {
        return dayjs(email.date).format("YYYY-MM-DD") === targetDate;
      } catch {
        return false;
      }
    });

    // Format and limit to 5
    const formattedMails = filteredEmails.slice(0, 5).map((email) => ({
      id: email.id,
      subject: email.subject || "(No Subject)",
      senderName: extractSenderName(email.from),
      senderEmail: email.from,
      senderAvatar: getAvatarUrl(email.from),
      status: email.isRead ? "Done" : "Unread",
      date: email.date,
      snippet: email.snippet,
      time: formatTime(email.date),
    }));

    setMails(formattedMails);
    setLoading(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      return dayjs(dateStr).format("HH:mm");
    } catch {
      return "";
    }
  };

  const fetchRecentMails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Fetching recent mails...");

      const response = await emailService.getInboxEmails(50);
      console.log("📥 Recent mails response:", response);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch emails");
      }

      const emails = response.data?.messages || [];
      console.log("✅ Got emails:", emails.length);

      filterAndSetMails(emails);
    } catch (error) {
      console.error("❌ Error fetching recent mails:", error);
      setError(error.message);
      setMails([]);
      setLoading(false);
    }
  };

  const extractSenderName = (from) => {
    if (!from) return "Unknown";
    const match = from.match(/^([^<]+)</);
    return match ? match[1].trim() : from.split("@")[0];
  };

  const getAvatarUrl = (email) => {
    const name = extractSenderName(email);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&size=32`;
  };

  const handleSelectMail = (id) => {
    setSelectedMails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    try {
      console.log("🗑️ Deleting emails:", Array.from(selectedMails));

      // Delete selected emails
      await Promise.all(
        Array.from(selectedMails).map((id) => emailService.deleteEmail(id))
      );

      // Remove from local state
      setMails((prev) => prev.filter((mail) => !selectedMails.has(mail.id)));
      setSelectedMails(new Set());

      console.log("✅ Emails deleted");

      // Refresh parent stats
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("❌ Error deleting emails:", error);
      alert("Failed to delete emails: " + error.message);
    }
  };

  const handleMarkSelectedComplete = async () => {
    try {
      console.log("✅ Marking as complete:", Array.from(selectedMails));

      // Mark selected emails as read
      await Promise.all(
        Array.from(selectedMails).map((id) => emailService.markAsRead(id))
      );

      // Update local state
      setMails((prev) =>
        prev.map((mail) =>
          selectedMails.has(mail.id) ? { ...mail, status: "Done" } : mail
        )
      );
      setSelectedMails(new Set());

      console.log("✅ Marked as complete");

      // Refresh parent stats
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("❌ Error marking emails as complete:", error);
      alert("Failed to mark emails: " + error.message);
    }
  };

  const handleChangeStatus = async (id, nextStatus) => {
    try {
      console.log(`🔄 Changing status for ${id} to ${nextStatus}`);

      // Update status based on selection
      if (nextStatus === "Done") {
        await emailService.markAsRead(id);
      } else if (nextStatus === "Unread") {
        await emailService.markAsUnread(id);
      }

      // Update local state
      setMails((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: nextStatus } : m))
      );
      setOpenId(null);

      console.log("✅ Status changed");

      // Refresh parent stats
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("❌ Error changing status:", error);
      alert("Failed to change status: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin text-orange-500" size={24} />
          <span className="ml-3 text-gray-500 text-sm">Loading emails...</span>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Mail className="text-red-400" size={24} />
          </div>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <button
            onClick={fetchRecentMails}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get formatted date for header
  const getDateLabel = () => {
    if (isToday) return "Today";
    if (dayjs(displayDate).isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
    return dayjs(displayDate).format("dddd, D MMMM");
  };

  if (mails.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Mail className="text-orange-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Recent Emails</h2>
                <p className="text-sm text-gray-400">{getDateLabel()}</p>
              </div>
            </div>
            <Link
              href="/incomingMail"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              View All
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
        
        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <Calendar className="text-gray-300" size={28} />
          </div>
          <p className="text-gray-500 mb-1">No emails on this date</p>
          <p className="text-gray-400 text-sm">Select another date from calendar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Mail className="text-orange-500" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Recent Emails</h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">{getDateLabel()}</p>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  {mails.length} email{mails.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/incomingMail"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            View All
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Email List */}
      <div className="divide-y divide-gray-50">
        {mails.map((mail, index) => (
          <div
            key={mail.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push("/incomingMail")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push("/incomingMail");
              }
            }}
            className={`flex items-center gap-4 px-6 py-4 transition-all cursor-pointer group ${
              selectedMails.has(mail.id)
                ? "bg-orange-50/50"
                : "hover:bg-gray-50/50"
            }`}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={selectedMails.has(mail.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectMail(mail.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 flex-shrink-0"
            />

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
              <img
                src={mail.senderAvatar}
                alt={mail.senderName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-medium text-gray-800 truncate text-sm">
                  {mail.senderName}
                </h3>
                {mail.status === "Unread" && (
                  <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate mb-0.5">
                {mail.subject}
              </p>
              {mail.snippet && (
                <p className="text-xs text-gray-400 truncate">
                  {mail.snippet}
                </p>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Time */}
              <div className="flex items-center gap-1 text-gray-400">
                <Clock size={12} />
                <span className="text-xs">{mail.time}</span>
              </div>

              {/* Status dropdown - locked when Done */}
              <div className="relative">
                {mail.status === "Done" ? (
                  // Locked state - cannot change back to Unread
                  <div
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-default ${
                      STATUS_COLORS[mail.status]
                    }`}
                    title="Status locked"
                  >
                    <CheckCircle size={12} />
                    {mail.status}
                  </div>
                ) : (
                  // Clickable dropdown for Unread status
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenId((cur) => (cur === mail.id ? null : mail.id));
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                        STATUS_COLORS[mail.status]
                      }`}
                    >
                      {mail.status}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${
                          openId === mail.id ? "rotate-180" : ""
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {openId === mail.id && (
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="absolute right-0 mt-1 w-32 rounded-lg border border-gray-100 bg-white shadow-lg z-20 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => handleChangeStatus(mail.id, "Done")}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-gray-500"
                        >
                          Mark as Done
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Forward button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Forward"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action bar when items selected */}
      {selectedMails.size > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {selectedMails.size} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleMarkSelectedComplete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs hover:bg-emerald-600 rounded-lg transition-colors"
              >
                <CheckCircle size={14} />
                Mark Done
              </Button>
              <Button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs hover:bg-red-600 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
