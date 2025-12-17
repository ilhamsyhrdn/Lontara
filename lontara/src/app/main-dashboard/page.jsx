"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { PieChart } from "@mui/x-charts/PieChart";
import { FiRefreshCw, FiCalendar, FiMail, FiX } from "react-icons/fi";
import RecentMails from "../components/Main-Dashboard/recent-mails";
import emailService from "@/services/mailManagement";
import AppLayout from "../components/ui/AppLayout";
import ProtectedRoute from "../components/Routes/ProtectedRoutes";

// Custom Day component to highlight days with emails
function CustomDay(props) {
  const { day, emailDates, selectedDate, ...other } = props;
  const dateStr = day.format("YYYY-MM-DD");
  const hasEmails = emailDates?.includes(dateStr);
  const isSelected = selectedDate && day.isSame(selectedDate, "day");
  const isToday = day.isSame(dayjs(), "day");

  return (
    <PickersDay
      {...other}
      day={day}
      sx={{
        position: "relative",
        ...(hasEmails && !isSelected && {
          backgroundColor: "#fef3c7",
          "&:hover": {
            backgroundColor: "#fde68a",
          },
        }),
        ...(isSelected && {
          backgroundColor: "#f97316 !important",
          color: "white !important",
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "#ea580c !important",
          },
        }),
        ...(isToday && !isSelected && {
          border: "2px solid #f97316",
        }),
        "&::after": hasEmails
          ? {
              content: '""',
              position: "absolute",
              bottom: "4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: isSelected ? "white" : "#f97316",
            }
          : {},
      }}
    />
  );
}

function PieCard({ title, total, data, loading, selectedDate, onClearDate }) {
  const formattedDate = selectedDate
    ? dayjs(selectedDate).format("DD MMM YYYY")
    : null;

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center min-w-[300px] relative overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>

      {/* Header */}
      <div className="flex items-center justify-between w-full mb-2">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <FiMail className="text-orange-500" />
          {title}
        </h2>
        {selectedDate && (
          <button
            onClick={onClearDate}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 flex items-center gap-1 transition-colors"
          >
            <FiX size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Date badge */}
      {selectedDate && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full mb-2">
          <FiCalendar className="text-orange-500" size={14} />
          <span className="text-sm font-medium text-orange-700">
            {formattedDate}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <FiRefreshCw className="animate-spin text-orange-500" size={32} />
        </div>
      ) : (
        <>
          <p className="text-5xl font-bold text-gray-800 my-3">{total}</p>
          <p className="text-sm text-gray-500 -mt-1 mb-2">
            {selectedDate ? "emails on this date" : "total emails"}
          </p>

          <div className="w-full flex-grow flex items-center justify-center -my-2">
            <PieChart
              series={[
                {
                  data,
                  innerRadius: 45,
                  outerRadius: 85,
                  paddingAngle: 3,
                  cornerRadius: 5,
                  cx: 100,
                },
              ]}
              height={200}
              legend={{ hidden: true }}
            />
          </div>

          <div className="mt-4 w-full space-y-3 text-sm">
            {data.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-lg">
                    {item.value}
                  </span>
                  {total > 0 && (
                    <span className="text-xs text-gray-400">
                      ({Math.round((item.value / total) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allInboxEmails, setAllInboxEmails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [mailStats, setMailStats] = useState({
    incoming: {
      total: 0,
      unread: 0,
      completed: 0,
    },
    outgoing: {
      total: 0,
      unread: 0,
      drafts: 0,
      completed: 0,
    },
  });

  // Get unique dates that have emails (for calendar highlighting)
  const emailDates = useMemo(() => {
    return [
      ...new Set(
        allInboxEmails.map((email) => {
          if (!email.date) return null;
          try {
            return dayjs(email.date).format("YYYY-MM-DD");
          } catch {
            return null;
          }
        }).filter(Boolean)
      ),
    ];
  }, [allInboxEmails]);

  // Filter emails by selected date
  const filteredStats = useMemo(() => {
    if (!selectedDate) {
      return mailStats.incoming;
    }

    const selectedDateStr = dayjs(selectedDate).format("YYYY-MM-DD");
    const filteredEmails = allInboxEmails.filter((email) => {
      if (!email.date) return false;
      try {
        return dayjs(email.date).format("YYYY-MM-DD") === selectedDateStr;
      } catch {
        return false;
      }
    });

    const unread = filteredEmails.filter((e) => !e.isRead).length;
    const completed = filteredEmails.filter((e) => e.isRead).length;

    return {
      total: filteredEmails.length,
      unread,
      completed,
    };
  }, [selectedDate, allInboxEmails, mailStats.incoming]);

  // Handle date selection
  const handleDateChange = (newDate) => {
    if (selectedDate && newDate.isSame(selectedDate, "day")) {
      // Toggle off if same date clicked
      setSelectedDate(null);
    } else {
      setSelectedDate(newDate);
    }
  };

  // Clear date filter
  const handleClearDate = () => {
    setSelectedDate(null);
  };

  // ✅ Handle Gmail reconnect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailConnected = params.get("gmail_connected");

    if (gmailConnected === "true") {
      console.log("✅ Gmail reconnected! Fetching fresh data...");
      window.history.replaceState({}, "", "/main-dashboard");
    }

    fetchMailStats();
  }, []);

  const fetchMailStats = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Fetching mail stats...");

      // ✅ Fetch inbox emails - CORRECT data access
      const inboxResponse = await emailService.getInboxEmails(100);
      console.log("📥 Inbox response:", inboxResponse);

      if (!inboxResponse.success) {
        throw new Error(inboxResponse.error || "Failed to fetch inbox");
      }

      const inboxEmails = inboxResponse.data?.messages || [];

      // ✅ Store all inbox emails for date filtering
      setAllInboxEmails(inboxEmails);

      // ✅ Fetch sent emails
      const sentResponse = await emailService.getSentEmails(100);
      console.log("📤 Sent response:", sentResponse);

      if (!sentResponse.success) {
        throw new Error(sentResponse.error || "Failed to fetch sent");
      }

      const sentEmails = sentResponse.data?.messages || [];

      // ✅ Fetch drafts
      const draftsResponse = await emailService.getDraftEmails(100);
      console.log("📝 Drafts response:", draftsResponse);

      if (!draftsResponse.success) {
        throw new Error(draftsResponse.error || "Failed to fetch drafts");
      }

      const draftEmails = draftsResponse.data?.messages || [];

      console.log(
        `✅ Fetched: ${inboxEmails.length} inbox, ${sentEmails.length} sent, ${draftEmails.length} drafts`
      );

      // Calculate incoming mail stats
      const unreadIncoming = inboxEmails.filter((e) => !e.isRead).length;
      const completedIncoming = inboxEmails.filter((e) => e.isRead).length;

      // Calculate outgoing mail stats
      const unreadOutgoing = sentEmails.filter((e) => !e.isRead).length;
      const completedOutgoing = sentEmails.filter((e) => e.isRead).length;

      setMailStats({
        incoming: {
          total: inboxEmails.length,
          unread: unreadIncoming,
          completed: completedIncoming,
        },
        outgoing: {
          total: sentEmails.length + draftEmails.length,
          unread: unreadOutgoing,
          drafts: draftEmails.length,
          completed: completedOutgoing,
        },
      });

      console.log("✅ Mail stats updated:", {
        incoming: inboxEmails.length,
        sent: sentEmails.length,
        drafts: draftEmails.length,
      });
    } catch (error) {
      console.error("❌ Error fetching mail stats:", error);
      setError(error.message);

      // Set empty state on error
      setMailStats({
        incoming: { total: 0, unread: 0, completed: 0 },
        outgoing: { total: 0, unread: 0, drafts: 0, completed: 0 },
      });
      setAllInboxEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const incomingMailData = [
    {
      id: 0,
      value: filteredStats.unread,
      label: "Belum Dibaca",
      color: "#94a3b8",
    },
    {
      id: 1,
      value: filteredStats.completed,
      label: "Sudah Dibaca",
      color: "#f97316",
    },
  ];

  // const outgoingMailData = [
  //   {
  //     id: 0,
  //     value: mailStats.outgoing.unread,
  //     label: "Unread",
  //     color: "#f97316",
  //   },
  //   {
  //     id: 1,
  //     value: mailStats.outgoing.drafts,
  //     label: "Drafts",
  //     color: "#34d399",
  //   },
  //   {
  //     id: 2,
  //     value: mailStats.outgoing.completed,
  //     label: "Completed",
  //     color: "#10b981",
  //   },
  // ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 min-h-screen bg-gray-50/">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">❌ {error}</p>
              <button
                onClick={fetchMailStats}
                className="mt-2 text-sm text-red-700 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Welcome Section */}
          <div className="flex mb-8 justify-between items-center">
            <h1 className="text-3xl font-medium text-gray-800">
              Mail Overview
            </h1>
            <div className="flex items-center gap-3">
              <Link
                href="/compose-mail"
                className="text-white text-sm bg-[#f97316] hover:bg-[#f97316]/50 px-5 py-2 rounded-lg shadow-md font-semibold transition-colors"
              >
                + Create New Mail
              </Link>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar Card */}
            <div className="flex-1 bg-white border border-gray-200 text-black/70 rounded-2xl shadow-sm p-4 flex flex-col min-w-[300px] relative overflow-hidden">
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
              
              {/* Calendar header */}
              <div className="flex items-center justify-between px-2 pt-2 pb-1">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <FiCalendar className="text-orange-500" />
                  Calendar
                </h2>
                {selectedDate && (
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                    {dayjs(selectedDate).format("DD MMM")}
                  </span>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 px-3 py-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>Has emails</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded border-2 border-orange-500"></span>
                  <span>Today</span>
                </div>
              </div>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar
                  value={selectedDate}
                  onChange={handleDateChange}
                  slots={{
                    day: CustomDay,
                  }}
                  slotProps={{
                    day: {
                      emailDates,
                      selectedDate,
                    },
                  }}
                  sx={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "380px",
                    "& .MuiPickersCalendarHeader-root": {
                      paddingLeft: "12px",
                      paddingRight: "12px",
                    },
                    "& .MuiPickersCalendarHeader-label": {
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      color: "#374151",
                    },
                    "& .MuiDayCalendar-weekDayLabel": {
                      fontWeight: "600",
                      color: "#6b7280",
                    },
                    "& .MuiPickersArrowSwitcher-button": {
                      color: "#f97316",
                      "&:hover": {
                        backgroundColor: "#fff7ed",
                      },
                    },
                    "& .MuiPickersDay-root": {
                      fontSize: "0.875rem",
                      "&:hover": {
                        backgroundColor: "#fff7ed",
                      },
                    },
                  }}
                />
              </LocalizationProvider>

              {/* Quick action */}
              {selectedDate && (
                <div className="px-3 pb-3">
                  <button
                    onClick={handleClearDate}
                    className="w-full py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                  >
                    Show all dates
                  </button>
                </div>
              )}
            </div>

            {/* Pie Chart Card */}
            <PieCard
              title="Incoming Mail"
              total={filteredStats.total}
              data={incomingMailData}
              loading={loading}
              selectedDate={selectedDate}
              onClearDate={handleClearDate}
            />
            {/* <PieCard
              title="Outgoing Mail"
              total={mailStats.outgoing.total}
              data={outgoingMailData}
              loading={loading}
            /> */}
          </div>

          {/* Recent Mails Section */}
          <div className="mt-10">
            <RecentMails 
              onRefresh={fetchMailStats} 
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              allEmails={allInboxEmails}
            />
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
