"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import emailService from "@/services/mailManagement";

// Filter types
export const FILTER_TYPES = {
  ALL: "all",
  TODAY: "today",
  THIS_WEEK: "thisWeek",
};

export function useSentMail() {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FILTER_TYPES.ALL);

  // Filter emails by date
  const filterByDate = useCallback((list, filterType) => {
    if (filterType === FILTER_TYPES.ALL) {
      return list;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return list.filter((email) => {
      if (!email.date) return false;
      const emailDate = new Date(email.date);

      if (filterType === FILTER_TYPES.TODAY) {
        return emailDate >= today;
      } else if (filterType === FILTER_TYPES.THIS_WEEK) {
        return emailDate >= weekAgo;
      }
      return true;
    });
  }, []);

  // Filter emails locally by search query
  const filterBySearch = useCallback((list, query) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((email) => {
      const subject = (email.subject || "").toLowerCase();
      const to = (email.to || "").toLowerCase();
      const snippet = (email.snippet || "").toLowerCase();
      return subject.includes(q) || to.includes(q) || snippet.includes(q);
    });
  }, []);

  // Apply all filters
  const applyFilters = useCallback(() => {
    let result = emails;

    // Apply date filter
    result = filterByDate(result, activeFilter);

    // Apply search filter
    result = filterBySearch(result, searchQuery);

    setFilteredEmails(result);
  }, [emails, activeFilter, searchQuery, filterByDate, filterBySearch]);

  // Handle filter change (when clicking stats card)
  const handleFilterChange = useCallback((filterType) => {
    // Toggle: if clicking the same filter, reset to ALL
    setActiveFilter((prev) => (prev === filterType ? FILTER_TYPES.ALL : filterType));
    setVisibleCount(10); // Reset pagination
  }, []);

  // Fetch sent emails
  const fetchSentEmails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📤 Fetching sent emails...");

      const response = await emailService.getSentEmails(100);
      console.log("📤 Sent response:", response);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch sent emails");
      }

      const emailList = response.data?.messages || [];
      console.log("✅ Fetched sent emails:", emailList.length);

      setEmails(emailList);
      setFilteredEmails(emailList);
    } catch (err) {
      console.error("❌ Error fetching sent emails:", err);
      setError(err.message);
      setEmails([]);
      setFilteredEmails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search submit
  const handleSearchSubmit = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      applyFilters();
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      console.log("🔍 Searching sent emails:", query);
      applyFilters();
    } catch (err) {
      console.error("❌ Error searching emails:", err);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, applyFilters]);

  // Delete email
  const deleteMail = useCallback(async (mailId) => {
    if (!confirm("Are you sure you want to delete this email?")) {
      return;
    }

    try {
      setActingId(mailId);
      await emailService.deleteEmail(mailId);
      console.log("✅ Email deleted successfully");
      fetchSentEmails();
    } catch (err) {
      console.error("❌ Failed to delete email:", err);
      alert("Failed to delete email");
    } finally {
      setActingId(null);
      setOpenMenuId(null);
    }
  }, [fetchSentEmails]);

  // Handle view more
  const handleViewMore = useCallback(() => {
    setVisibleCount((prev) => prev + 10);
  }, []);

  // Handle email click
  const handleEmailClick = useCallback(async (emailId) => {
    if (!emailId || typeof emailId !== "string" || emailId.length < 10) {
      console.error("❌ Invalid email ID:", emailId);
      alert("Invalid email ID. Please try again.");
      return;
    }

    try {
      console.log("🔍 Fetching email with ID:", emailId);

      // Check if email exists in current list
      const emailDetail = filteredEmails.find((e) => e.id === emailId);
      if (emailDetail) {
        setSelectedEmail(emailDetail);
        return;
      }

      // Fallback: Fetch from API
      const response = await emailService.getEmailById(emailId);
      console.log("✅ Email detail response:", response);

      if (!response || !response.id) {
        throw new Error("Invalid email data received");
      }

      setSelectedEmail(response);
    } catch (err) {
      console.error("❌ Error fetching email detail:", err);
      alert("Failed to load email. Please try again.");
    }
  }, [filteredEmails]);

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setSelectedEmail(null);
  }, []);

  // Toggle menu
  const toggleMenu = useCallback((mailId) => {
    setOpenMenuId((prev) => (prev === mailId ? null : mailId));
  }, []);

  // Close menu
  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
  }, []);

  // Effects
  useEffect(() => {
    fetchSentEmails();
  }, [fetchSentEmails]);

  // Reapply filters when emails, search query, or active filter changes
  useEffect(() => {
    applyFilters();
  }, [emails, searchQuery, activeFilter, applyFilters]);

  // Computed values
  const displayEmails = filteredEmails.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEmails.length;
  const remainingCount = filteredEmails.length - visibleCount;

  return {
    // State
    emails,
    filteredEmails,
    displayEmails,
    loading,
    isSearching,
    error,
    searchQuery,
    selectedEmail,
    visibleCount,
    openMenuId,
    actingId,
    hasMore,
    remainingCount,
    activeFilter,

    // Actions
    setSearchQuery,
    fetchSentEmails,
    handleSearchSubmit,
    deleteMail,
    handleViewMore,
    handleEmailClick,
    handleBackToList,
    toggleMenu,
    closeMenu,
    handleFilterChange,
  };
}
