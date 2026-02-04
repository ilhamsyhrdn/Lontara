"use client";

import { useState, useEffect } from "react";
import {
  FiSearch,
  FiMoreVertical,
  FiPaperclip,
  FiMessageSquare,
  FiCalendar,
 
  FiChevronDown,
  FiMail,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiZap,
  FiTrash2,
} from "react-icons/fi";
import emailService from "@/services/mailManagement";
import ViewMail from "../components/VIew-mail/ViewMail";
import ProtectedRoute from "../components/Routes/ProtectedRoutes";
import AppLayout from "../components/ui/AppLayout";

export default function IncomingMailPage() {
  const [activeTab, setActiveTab] = useState("unread");
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [classificationStats, setClassificationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [useMLClassification, setUseMLClassification] = useState(true); 

  const [visibleCounts, setVisibleCounts] = useState({
    unread: 3,
    read: 3,
  });
  const [hiddenSections, setHiddenSections] = useState({});
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    if (useMLClassification) {
      fetchClassifiedEmails(); // ✅ Use ML
    } else {
      fetchEmails(); // ✅ Use manual
    }
  }, [useMLClassification]);

  const filterEmailsLocal = (list, query) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((email) => {
      const subject = (email.subject || "").toLowerCase();
      const from = (email.from || "").toLowerCase();
      const snippet = (email.snippet || "").toLowerCase();
      return (
        subject.includes(q) ||
        from.includes(q) ||
        snippet.includes(q) ||
        (email.category || "").toLowerCase().includes(q)
      );
    });
  };

  useEffect(() => {
    setFilteredEmails(filterEmailsLocal(emails, searchQuery));
  }, [searchQuery, emails]);

  useEffect(() => {
    setVisibleCounts({
      unread: 3,
      read: 3,
    });
  }, [searchQuery, emails.length]);

  const cleanEmailText = (value) => {
    if (!value) return "";
    const raw = String(value);
    if (typeof window !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = raw;
      return (div.textContent || div.innerText || "").trim();
    }
    return raw.replace(/<[^>]*>/g, " ").trim();
  };

  // ✅ NEW: Fetch ML-classified emails
  const fetchClassifiedEmails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🤖 Fetching ML-classified emails...");

      const response = await emailService.getClassifiedInbox(100);
      console.log("📥 ML Classification response:", response);

      if (!response.success) {
        throw new Error(response.error || "Failed to classify emails");
      }

      const emailList = response.data?.emails || [];
      const stats = response.data?.summary || {};

      console.log("✅ Classified emails:", emailList.length);
      console.log("📊 Stats:", stats);

      setEmails(emailList);
      setFilteredEmails(emailList);
      setClassificationStats(stats);
    } catch (err) {
      console.error("❌ Error fetching classified emails:", err);
      setError(err.message);
      setEmails([]);
      setFilteredEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Fetching inbox emails...");

      const response = await emailService.getInboxEmails(100);
      console.log("📥 Inbox response:", response);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch emails");
      }

      const emailList = response.data?.messages || [];
      console.log("✅ Fetched emails:", emailList.length);

      setEmails(emailList);
      setFilteredEmails(emailList);
    } catch (err) {
      console.error("❌ Error fetching emails:", err);
      setError(err.message);
      setEmails([]);
      setFilteredEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setFilteredEmails(emails);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      console.log('dY"? Searching:', query);

      const response = await emailService.searchEmails(query);
      console.log('dY Search results:', response);

      if (!response.success) {
        throw new Error(response.error || 'Search failed');
      }

      const results = response.data?.messages || [];
      setUseMLClassification(false);
      setEmails(results);
      setFilteredEmails(results);
    } catch (err) {
      console.error('??O Error searching emails:', err);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleReadStatus = async (mailId, currentlyRead) => {
    try {
      setActingId(mailId);
      if (currentlyRead) {
        await emailService.markAsUnread(mailId);
      } else {
        await emailService.markAsRead(mailId);
      }
      if (useMLClassification) {
        fetchClassifiedEmails();
      } else {
        fetchEmails();
      }
    } catch (err) {
      console.error('Failed to toggle read status', err);
      alert('Failed to update email status');
    } finally {
      setActingId(null);
      setOpenMenuId(null);
    }
  };

  const deleteMail = async (mailId) => {
    try {
      setActingId(mailId);
      await emailService.deleteEmail(mailId);
      if (useMLClassification) {
        fetchClassifiedEmails();
      } else {
        fetchEmails();
      }
    } catch (err) {
      console.error('Failed to delete email', err);
      alert('Failed to delete email');
    } finally {
      setActingId(null);
      setOpenMenuId(null);
    }
  };

  const handleViewMore = (category) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [category]: prev[category] + 5,
    }));
  };

  const handleEmailClick = async (emailId) => {
    if (!emailId || typeof emailId !== "string" || emailId.length < 10) {
      console.error("❌ Invalid email ID:", emailId);
      alert("Invalid email ID. Please try again.");
      return;
    }

    try {
      console.log("🔍 Fetching email with ID:", emailId);

      // ✅ If using ML, get full email details
      if (useMLClassification) {
        const emailDetail =
          filteredEmails.find((e) => e.id === emailId) ||
          emails.find((e) => e.id === emailId);
        if (emailDetail) {
          setSelectedEmail(emailDetail);

          // Mark as read
          if (!emailDetail.isRead) {
            await emailService.markAsRead(emailId);
            fetchClassifiedEmails(); // Refresh
          }
          return;
        }
      }

      // ✅ Fallback: Fetch from API
      const response = await emailService.getEmailById(emailId);
      console.log("✅ Email detail response:", response);

      if (!response || !response.id) {
        throw new Error("Invalid email data received");
      }

      setSelectedEmail(response);

      if (!response.isRead) {
        await emailService.markAsRead(emailId);

        if (useMLClassification) {
          fetchClassifiedEmails();
        } else {
          fetchEmails();
        }
      }
    } catch (err) {
      console.error("❌ Error fetching email detail:", err);
      alert("Failed to load email. Please try again.");
    }
  };

  const handleBackToList = () => {
    setSelectedEmail(null);
  };

  const toggleSectionVisibility = (key) => {
    setHiddenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ✅ NEW: Categorize using ML results
  const categorizeEmails = (emailList) => {
    if (useMLClassification) {
      // ✅ Use ML category field
      const categories = {
        peminjaman: emailList.filter((e) => e.category === "peminjaman"),
        izin: emailList.filter((e) => e.category === "izin"),
        pengaduan: emailList.filter((e) => e.category === "pengaduan"),
      };
      return categories;
    } else {
      // ✅ Fallback to keyword matching
      const categories = {
        peminjaman: [],
        izin: [],
        pengaduan: [],
        spam: [],
      };

      emailList.forEach((email) => {
        const subject = (email.subject || "").toLowerCase();

        if (
          subject.includes("pinjam") ||
          subject.includes("sewa") ||
          subject.includes("booking")
        ) {
          categories.peminjaman.push(email);
        } else if (
          subject.includes("izin") ||
          subject.includes("cuti") ||
          subject.includes("leave")
        ) {
          categories.izin.push(email);
        } else if (
          subject.includes("pengaduan") ||
          subject.includes("complaint") ||
          subject.includes("lapor")
        ) {
          categories.pengaduan.push(email);
        } else if (email.labelIds?.includes("SPAM")) {
          categories.spam.push(email);
        }
      });

      return categories;
    }
  };

  const categorizedEmails = categorizeEmails(filteredEmails);

  const classifications = [
    {
      id: 1,
      title: "Email Peminjaman Tempat dan Barang",
      category: "peminjaman",
      count: categorizedEmails.peminjaman.length,
      icon: FiMail,
      color: "bg-blue-500",
      textColor: "text-blue-500",
      bgLight: "bg-blue-50",
      mlConfidence: classificationStats
        ? (
            (categorizedEmails.peminjaman.reduce(
              (sum, e) => sum + (e.confidence || 0),
              0
            ) / categorizedEmails.peminjaman.length || 0) * 100
          ).toFixed(0)
        : null,
    },
    {
      id: 2,
      title: "Email Izin",
      category: "izin",
      count: categorizedEmails.izin.length,
      icon: FiCheckCircle,
      color: "bg-green-500",
      textColor: "text-green-500",
      bgLight: "bg-green-50",
      mlConfidence: classificationStats
        ? (
            (categorizedEmails.izin.reduce(
              (sum, e) => sum + (e.confidence || 0),
              0
            ) / categorizedEmails.izin.length || 0) * 100
          ).toFixed(0)
        : null,
    },
    {
      id: 3,
      title: "Email Pengaduan",
      category: "pengaduan",
      count: categorizedEmails.pengaduan.length,
      icon: FiAlertCircle,
      color: "bg-orange-500",
      textColor: "text-orange-500",
      bgLight: "bg-orange-50",
      mlConfidence: classificationStats
        ? (
            (categorizedEmails.pengaduan.reduce(
              (sum, e) => sum + (e.confidence || 0),
              0
            ) / categorizedEmails.pengaduan.length || 0) * 100
          ).toFixed(0)
        : null,
    },
  ];

  const displayEmails = categoryFilter
    ? filteredEmails.filter((e) => e.category === categoryFilter)
    : filteredEmails;

  const unreadEmails = displayEmails.filter((e) => !e.isRead);
  const readEmails = displayEmails.filter((e) => e.isRead);

  const formatEmailForDisplay = (email) => {
    const getSenderName = (from) => {
      if (!from) return "Unknown";
      const match = from.match(/^([^<]+)</);
      return match ? match[1].trim() : from.split("@")[0];
    };

    const formatDate = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } catch {
        return "";
      }
    };

    const subject = cleanEmailText(email.subject || "").toLowerCase();
    let priority = "Low Priority";
    let priorityColor = "text-blue-500 bg-blue-50";

    if (
      subject.includes("urgent") ||
      subject.includes("asap") ||
      subject.includes("penting")
    ) {
      priority = "High Priority";
      priorityColor = "text-red-500 bg-red-50";
    } else if (subject.includes("important") || subject.includes("reminder")) {
      priority = "Medium Priority";
      priorityColor = "text-orange-500 bg-orange-50";
    }

    return {
      id: email.id,
      subject: cleanEmailText(email.subject || "(No Subject)"),
      department: getSenderName(email.from),
      description:
        cleanEmailText(email.snippet) ||
        cleanEmailText(email.body)?.substring(0, 150) ||
        "",
      priority: priority,
      priorityColor: priorityColor,
      comments: 0,
      date: formatDate(email.date),
      avatar: email.from,
      hasAttachment: email.hasAttachments || false,
      // ✅ NEW: ML classification data
      mlCategory: email.category || null,
      mlConfidence: email.confidence
        ? `${(email.confidence * 100).toFixed(0)}%`
        : null,
      ruleApplied: email.ruleApplied || false,
    };
  };

  const mailCategories = {
    unread: {
      title: "Unread",
      count: unreadEmails.length,
      color: "text-red-500",
      mails: unreadEmails
        .slice(0, visibleCounts.unread)
        .map(formatEmailForDisplay),
      totalMails: unreadEmails.length,
      visibleCount: visibleCounts.unread,
    },
    read: {
      title: "Read",
      count: readEmails.length,
      color: "text-green-500",
      mails: readEmails.slice(0, visibleCounts.read).map(formatEmailForDisplay),
      totalMails: readEmails.length,
      visibleCount: visibleCounts.read,
    },
  };

  const totalEmails = displayEmails.length || 1;

  const getCategoryBadge = (mail) => {
    const map = {
      peminjaman: {
        label: "Email Peminjaman Tempat dan Barang",
        className: "bg-blue-100 text-blue-700",
      },
      izin: {
        label: "Email Izin",
        className: "bg-green-100 text-green-700",
      },
      pengaduan: {
        label: "Email Pengaduan",
        className: "bg-orange-100 text-orange-700",
      },
    };
    return map[mail.mlCategory] || { label: "Unclassified", className: "bg-gray-100 text-gray-700" };
  };

  if (selectedEmail) {
    return <ViewMail email={selectedEmail} onBack={handleBackToList} />;
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="flex h-full bg-gray-50">
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <h1 className="text-2xl font-semibold text-gray-800">
                  Incoming Mail
                </h1>


                <div className="flex-1 max-w-md relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search mail by subject, number, sender"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                    className="w-full pl-10 pr-12 py-2 bg-gray-100 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-200 disabled:opacity-60"
                  >
                    {isSearching ? (
                      <FiRefreshCw className="animate-spin text-gray-500" size={16} />
                    ) : (
                      <FiSearch className="text-gray-600" size={16} />
                    )}
                  </button>
                </div>
                {categoryFilter && (
                  <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    <span>Filtered: {categoryFilter}</span>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => setCategoryFilter(null)}
                    >
                      Clear
                    </button>
                  </div>
                )}
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  onClick={
                    useMLClassification ? fetchClassifiedEmails : fetchEmails
                  }
                  disabled={loading || isSearching}
                >
                  <FiRefreshCw
                    className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
                    size={20}
                  />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">❌ {error}</p>
                  <button
                    onClick={
                      useMLClassification ? fetchClassifiedEmails : fetchEmails
                    }
                    className="mt-2 text-sm text-red-700 underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <FiRefreshCw
                    className="animate-spin text-blue-500"
                    size={40}
                  />
                  <span className="ml-3 text-gray-600">
                    {useMLClassification
                      ? "Classifying emails"
                      : "Loading emails..."}
                  </span>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-xl mb-2">No emails found</p>
                  <p className="text-sm">
                    Try refreshing or adjusting your search
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
                    {classifications.map((classification) => {
                      const Icon = classification.icon;
                      const totalForBars = Math.max(1, filteredEmails.length);
                      const percentage = Math.min(
                        100,
                        (classification.count / totalForBars) * 100
                      );
                      const isActive = categoryFilter === classification.category;

                      return (
                        <div
                          key={classification.id}
                          onClick={() =>
                            setCategoryFilter((prev) =>
                              prev === classification.category ? null : classification.category
                            )
                          }
                          className={`${classification.bgLight} rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer select-none
                            ${isActive 
                              ? `border-2 ${classification.textColor.replace('text-', 'border-')} ring-4 ${classification.bgLight.replace('bg-', 'ring-').replace('-50', '-200')} shadow-md` 
                              : `border border-transparent hover:border-gray-300`
                            }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-gray-600 text-xs font-medium line-clamp-2 min-h-[32px]">
                                  {classification.title}
                                </p>
                                {isActive && (
                                  <span className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-600 font-medium shadow-sm">
                                    Active
                                  </span>
                                )}
                              </div>
                              <h3 className="text-2xl font-bold text-gray-800">
                                {classification.count}
                              </h3>
                            </div>
                            <div
                              className={`${classification.color} p-2.5 rounded-lg flex-shrink-0 ml-2 ${isActive ? 'scale-110' : ''} transition-transform`}
                            >
                              <Icon className="text-white" size={20} />
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`${classification.color} h-1.5 rounded-full transition-all`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          {/* Click hint */}
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            {isActive ? "Click to show all" : "Click to filter"}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {Object.entries(mailCategories).map(([key, category]) => (
                    <div key={key} className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h2 className={`font-semibold ${category.color}`}>
                            {category.title}
                          </h2>
                          <span className="text-gray-500">
                            ({category.count})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSectionVisibility(key)}
                            className="p-1 px-2 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1"
                          >
                            <FiChevronDown
                              className={`transition ${hiddenSections[key] ? "-rotate-90" : ""}`}
                              size={16}
                            />
                            {hiddenSections[key] ? "Show" : "Hide"}
                          </button>
                         
                      
                        </div>
                      </div>

                      {!hiddenSections[key] && (
                        <>
                      <div className="space-y-3">
                        {category.mails.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No emails in this category
                          </div>
                        ) : (
                          category.mails.map((mail) => (
                            <div
                              key={mail.id}
                              onClick={() => {
                                console.log("📧 Clicked email ID:", mail.id);
                                handleEmailClick(mail.id);
                              }}
                              className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-800">
                                      {mail.subject}
                                    </h3>

                                    {/* ✅ NEW: Show ML badge */}
                                    {useMLClassification && mail.mlCategory && (
                                      <span className="text-xs text-gray-600">
                                        •{" "}
                                        {mail.mlCategory === "peminjaman"
                                          ? "Peminjaman"
                                          : mail.mlCategory === "izin"
                                          ? "Izin"
                                          : "Pengaduan"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    <span className="text-sm text-blue-600">
                                      {mail.department}
                                    </span>
                                  </div>
                                  {mail.description && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                      {mail.description}
                                    </p>
                                  )}
                                  {mail.hasAttachment && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                      <FiPaperclip size={16} />
                                      <span>Attachment</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-start gap-4 ml-4">
                                  {(() => {
                                    const badge = getCategoryBadge(mail);
                                    return (
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}
                                      >
                                        {badge.label}
                                      </span>
                                    );
                                  })()}
                                  <div className="flex items-center gap-3 text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <FiMessageSquare size={16} />
                                      <span className="text-sm">
                                        {mail.comments}
                                      </span>
                                    </div>
                                    {mail.date && (
                                      <div className="flex items-center gap-1">
                                        <FiCalendar size={16} />
                                        <span className="text-sm">
                                          {mail.date}
                                        </span>
                                      </div>
                                    )}
                                    <img
                                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        mail.department
                                      )}&background=random`}
                                      alt={`${mail.department} avatar`}
                                      className="w-6 h-6 rounded-full"
                                    />
                                      <div className="relative">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(
                                              openMenuId === mail.id ? null : mail.id
                                            );
                                          }}
                                          className="hover:bg-gray-100 rounded p-1 transition-colors"
                                        >
                                          <FiMoreVertical size={16} className="text-gray-500" />
                                        </button>
                                      {openMenuId === mail.id && (
                                        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleReadStatus(mail.id, mail.isRead);
                                            }}
                                            disabled={actingId === mail.id}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 rounded-t-xl"
                                          >
                                            {mail.isRead ? "Mark as Unread" : "Mark as Read"}
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteMail(mail.id);
                                            }}
                                            disabled={actingId === mail.id}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 rounded-b-xl"
                                          >
                                            <FiTrash2 size={14} />
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                          {category.mails.length > 0 &&
                            category.visibleCount < category.totalMails && (
                              <button
                                onClick={() => handleViewMore(key)}
                                className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-1 transition-colors"
                              >
                                <FiChevronDown size={16} />
                                View More (
                                {Math.min(
                                  5,
                                  category.totalMails - category.visibleCount
                                )}{" "}
                                more)
                              </button>
                            )}
                        </>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
