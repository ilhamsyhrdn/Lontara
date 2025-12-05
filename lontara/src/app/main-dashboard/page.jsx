"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PieChart } from "@mui/x-charts/PieChart";
import { FiRefreshCw } from "react-icons/fi";
import RecentMails from "../components/Main-Dashboard/recent-mails";
import emailService from "@/services/mailManagement";
import AppLayout from "../components/ui/AppLayout";
import ProtectedRoute from "../components/Routes/ProtectedRoutes";

function PieCard({ title, total, data, loading }) {
  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center min-w-[300px]">
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <FiRefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <>
          <p className="text-4xl font-bold text-black my-2">{total}</p>
          <div className="w-full flex-grow flex items-center justify-center -my-4">
            <PieChart
              series={[{ data, innerRadius: 40, outerRadius: 80 }]}
              height={200}
              legend={{ hidden: true }}
            />
          </div>
          <div className="mt-4 w-full space-y-2 text-sm">
            {data.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-gray-600"
              >
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span>{item.label}</span>
                </div>
                <span className="font-semibold text-gray-800">
                  {item.value}
                </span>
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
    } finally {
      setLoading(false);
    }
  };

  const incomingMailData = [
    {
      id: 0,
      value: mailStats.incoming.unread,
      label: "Belum Dibaca",
      color: "#999999",
    },
    {
      id: 1,
      value: mailStats.incoming.completed,
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
            <div className="flex-1 bg-white border border-gray-200 text-black/70 rounded-2xl shadow-sm p-4 flex flex-col min-w-[300px]">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar
                  sx={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "400px",
                    "& .MuiPickersCalendarHeader-label": {
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    },
                    "& .MuiDayCalendar-weekDayLabel": {
                      fontWeight: "medium",
                    },
                  }}
                />
              </LocalizationProvider>
            </div>

            {/* Pie Chart Cards */}
            <PieCard
              title="Incoming Mail"
              total={mailStats.incoming.total}
              data={incomingMailData}
              loading={loading}
            />
            {/* <PieCard
              title="Outgoing Mail"
              total={mailStats.outgoing.total}
              data={outgoingMailData}
              loading={loading}
            /> */}
          </div>

          {/* Recent Mails Section */}
          <div className="flex mb-8 mt-8 justify-between items-center">
            <h1 className="text-3xl font-medium text-gray-800">Recent Mails</h1>
          </div>
          <div className="flex mt-8 justify-between items-center">
            <h1 className="text-xl text-gray-800 ml-3 mb-5">Today</h1>
            <Link
              href="/incomingMail"
              className="text-md text-black/50 hover:text-black/70"
            >
              See All
            </Link>
          </div>
          <RecentMails onRefresh={fetchMailStats} />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
