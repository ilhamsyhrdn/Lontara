"use client";

import { useMemo } from "react";

/**
 * Clean HTML text and extract plain text
 */
export function cleanEmailText(value) {
  if (!value) return "";
  const raw = String(value);
  if (typeof window !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = raw;
    return (div.textContent || div.innerText || "").trim();
  }
  return raw.replace(/<[^>]*>/g, " ").trim();
}

/**
 * Get recipient name from email address
 */
export function getRecipientName(to) {
  if (!to) return "Unknown";
  const match = to.match(/^([^<]+)</);
  return match ? match[1].trim() : to.split("@")[0];
}

/**
 * Get sender name from email address
 */
export function getSenderName(from) {
  if (!from) return "Unknown";
  const match = from.match(/^([^<]+)</);
  return match ? match[1].trim() : from.split("@")[0];
}

/**
 * Format date for display (relative)
 */
export function formatDateRelative(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  } catch {
    return "";
  }
}

/**
 * Format date for display (short)
 */
export function formatDateShort(dateString) {
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
}

/**
 * Format date for display (full)
 */
export function formatDateFull(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Format email for display (sent mail)
 */
export function formatSentEmailForDisplay(email) {
  return {
    id: email.id,
    subject: cleanEmailText(email.subject || "(No Subject)"),
    recipient: getRecipientName(email.to),
    recipientEmail: email.to || "",
    description:
      cleanEmailText(email.snippet) ||
      cleanEmailText(email.body)?.substring(0, 150) ||
      "",
    date: formatDateRelative(email.date),
    fullDate: email.date,
    hasAttachment: email.hasAttachments || false,
    isRead: email.isRead || true,
  };
}

/**
 * Format email for display (inbox)
 */
export function formatInboxEmailForDisplay(email) {
  return {
    id: email.id,
    subject: cleanEmailText(email.subject || "(No Subject)"),
    sender: getSenderName(email.from),
    senderEmail: email.from || "",
    description:
      cleanEmailText(email.snippet) ||
      cleanEmailText(email.body)?.substring(0, 150) ||
      "",
    date: formatDateRelative(email.date),
    fullDate: email.date,
    hasAttachment: email.hasAttachments || false,
    isRead: email.isRead || false,
  };
}

/**
 * Hook to calculate sent email statistics
 */
export function useSentEmailStats(emails) {
  return useMemo(() => {
    const totalSent = emails.length;

    const todayCount = emails.filter((e) => {
      if (!e.date) return false;
      const emailDate = new Date(e.date);
      const today = new Date();
      return emailDate.toDateString() === today.toDateString();
    }).length;

    const thisWeekCount = emails.filter((e) => {
      if (!e.date) return false;
      const emailDate = new Date(e.date);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return emailDate >= weekAgo;
    }).length;

    return {
      totalSent,
      todayCount,
      thisWeekCount,
    };
  }, [emails]);
}

/**
 * Hook to calculate inbox email statistics
 */
export function useInboxEmailStats(emails) {
  return useMemo(() => {
    const total = emails.length;
    const unreadCount = emails.filter((e) => !e.isRead).length;
    const readCount = emails.filter((e) => e.isRead).length;

    const todayCount = emails.filter((e) => {
      if (!e.date) return false;
      const emailDate = new Date(e.date);
      const today = new Date();
      return emailDate.toDateString() === today.toDateString();
    }).length;

    return {
      total,
      unreadCount,
      readCount,
      todayCount,
    };
  }, [emails]);
}
