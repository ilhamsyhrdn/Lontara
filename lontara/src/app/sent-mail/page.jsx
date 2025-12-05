"use client";

import {
  FiSearch,
  FiMoreVertical,
  FiPaperclip,
  FiCalendar,
  FiChevronDown,
  FiSend,
  FiRefreshCw,
  FiTrash2,
  FiEye,
  FiClock,
} from "react-icons/fi";
import ViewMail from "../components/View-Mail/ViewMail";
import ProtectedRoute from "../components/Routes/ProtectedRoutes";
import AppLayout from "../components/ui/AppLayout";
import {
  useSentMail,
  formatSentEmailForDisplay,
  useSentEmailStats,
  FILTER_TYPES,
} from "@/hooks/email";

export default function SentMailPage() {
  const {
    emails,
    filteredEmails,
    displayEmails,
    loading,
    isSearching,
    error,
    searchQuery,
    selectedEmail,
    openMenuId,
    actingId,
    hasMore,
    remainingCount,
    activeFilter,
    setSearchQuery,
    fetchSentEmails,
    handleSearchSubmit,
    deleteMail,
    handleViewMore,
    handleEmailClick,
    handleBackToList,
    toggleMenu,
    handleFilterChange,
  } = useSentMail();

  const { totalSent, todayCount, thisWeekCount } = useSentEmailStats(emails);

  // Show email detail view
  if (selectedEmail) {
    return <ViewMail email={selectedEmail} onBack={handleBackToList} />;
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="flex h-full bg-gray-50">
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <Header
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearchSubmit={handleSearchSubmit}
              fetchSentEmails={fetchSentEmails}
              loading={loading}
              isSearching={isSearching}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Error Message */}
              {error && (
                <ErrorMessage error={error} onRetry={fetchSentEmails} />
              )}

              {loading ? (
                <LoadingState />
              ) : emails.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {/* Stats Cards */}
                  <StatsCards
                    totalSent={totalSent}
                    todayCount={todayCount}
                    thisWeekCount={thisWeekCount}
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                  />

                  {/* Email Count */}
                  <EmailListHeader
                    count={filteredEmails.length}
                    searchQuery={searchQuery}
                    activeFilter={activeFilter}
                    onClearSearch={() => setSearchQuery("")}
                    onClearFilter={() => handleFilterChange(FILTER_TYPES.ALL)}
                  />

                  {/* Email List */}
                  <EmailList
                    emails={displayEmails}
                    openMenuId={openMenuId}
                    actingId={actingId}
                    onEmailClick={handleEmailClick}
                    onToggleMenu={toggleMenu}
                    onDelete={deleteMail}
                  />

                  {/* View More Button */}
                  {hasMore && (
                    <ViewMoreButton
                      remainingCount={remainingCount}
                      onClick={handleViewMore}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

// ==================== SUB COMPONENTS ====================

function Header({
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  fetchSentEmails,
  loading,
  isSearching,
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-2xl font-semibold text-gray-800">Sent Mail</h1>

        <div className="flex-1 max-w-md relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search sent mail by subject, recipient..."
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

        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={fetchSentEmails}
          disabled={loading || isSearching}
          title="Refresh"
        >
          <FiRefreshCw
            className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
            size={20}
          />
        </button>
      </div>
    </div>
  );
}

function ErrorMessage({ error, onRetry }) {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-600">❌ {error}</p>
      <button
        onClick={onRetry}
        className="mt-2 text-sm text-red-700 underline"
      >
        Try Again
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <FiRefreshCw className="animate-spin text-blue-500" size={40} />
      <span className="ml-3 text-gray-600">Loading sent emails...</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-500">
      <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
        <FiSend className="text-gray-400" size={40} />
      </div>
      <p className="text-xl mb-2">No sent emails found</p>
      <p className="text-sm">Emails you send will appear here</p>
    </div>
  );
}

function StatsCards({ totalSent, todayCount, thisWeekCount, activeFilter, onFilterChange }) {
  const stats = [
    {
      title: "Total Sent",
      value: totalSent,
      icon: FiSend,
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-500",
      progressBg: "bg-blue-500",
      activeBorder: "border-blue-500",
      activeRing: "ring-blue-200",
      hoverBorder: "hover:border-blue-300",
      percentage: 100,
      filterType: FILTER_TYPES.ALL,
    },
    {
      title: "Sent Today",
      value: todayCount,
      icon: FiClock,
      bgColor: "bg-green-50",
      iconBg: "bg-green-500",
      progressBg: "bg-green-500",
      activeBorder: "border-green-500",
      activeRing: "ring-green-200",
      hoverBorder: "hover:border-green-300",
      percentage: Math.min(100, (todayCount / Math.max(1, totalSent)) * 100),
      filterType: FILTER_TYPES.TODAY,
    },
    {
      title: "This Week",
      value: thisWeekCount,
      icon: FiCalendar,
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-500",
      progressBg: "bg-orange-500",
      activeBorder: "border-orange-500",
      activeRing: "ring-orange-200",
      hoverBorder: "hover:border-orange-300",
      percentage: Math.min(100, (thisWeekCount / Math.max(1, totalSent)) * 100),
      filterType: FILTER_TYPES.THIS_WEEK,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = activeFilter === stat.filterType;
        
        return (
          <div
            key={stat.title}
            onClick={() => onFilterChange(stat.filterType)}
            className={`${stat.bgColor} rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer select-none
              ${isActive 
                ? `border-2 ${stat.activeBorder} ring-4 ${stat.activeRing} shadow-md` 
                : `border border-transparent ${stat.hoverBorder}`
              }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-gray-600 text-xs font-medium">
                    {stat.title}
                  </p>
                  {isActive && (
                    <span className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-600 font-medium shadow-sm">
                      Active
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stat.value}
                </h3>
              </div>
              <div
                className={`${stat.iconBg} p-2.5 rounded-lg flex-shrink-0 ml-2 ${isActive ? 'scale-110' : ''} transition-transform`}
              >
                <Icon className="text-white" size={20} />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`${stat.progressBg} h-1.5 rounded-full transition-all`}
                  style={{ width: `${stat.percentage}%` }}
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
  );
}

function EmailListHeader({ count, searchQuery, activeFilter, onClearSearch, onClearFilter }) {
  const getFilterLabel = () => {
    switch (activeFilter) {
      case FILTER_TYPES.TODAY:
        return "Today's Emails";
      case FILTER_TYPES.THIS_WEEK:
        return "This Week's Emails";
      default:
        return "All Sent Emails";
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-gray-700">{getFilterLabel()}</h2>
        <span className="text-gray-500">({count})</span>
      </div>
      <div className="flex items-center gap-2">
        {activeFilter !== FILTER_TYPES.ALL && (
          <button
            className="flex items-center gap-1 text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
            onClick={onClearFilter}
          >
            <span>Filter: {activeFilter === FILTER_TYPES.TODAY ? "Today" : "This Week"}</span>
            <span className="text-blue-600 hover:text-blue-800">×</span>
          </button>
        )}
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
            <span>Search: "{searchQuery}"</span>
            <button
              className="text-purple-600 hover:text-purple-800"
              onClick={onClearSearch}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmailList({
  emails,
  openMenuId,
  actingId,
  onEmailClick,
  onToggleMenu,
  onDelete,
}) {
  if (emails.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No emails match your search
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => {
        const mail = formatSentEmailForDisplay(email);

        return (
          <EmailCard
            key={mail.id}
            mail={mail}
            isMenuOpen={openMenuId === mail.id}
            isActing={actingId === mail.id}
            onEmailClick={onEmailClick}
            onToggleMenu={onToggleMenu}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}

function EmailCard({
  mail,
  isMenuOpen,
  isActing,
  onEmailClick,
  onToggleMenu,
  onDelete,
}) {
  return (
    <div
      onClick={() => onEmailClick(mail.id)}
      className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Subject */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
              {mail.subject}
            </h3>
          </div>

          {/* Recipient */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500">To:</span>
            <span className="text-sm text-blue-600">{mail.recipient}</span>
            {mail.recipientEmail && (
              <span className="text-xs text-gray-400">
                ({mail.recipientEmail})
              </span>
            )}
          </div>

          {/* Description */}
          {mail.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {mail.description}
            </p>
          )}

          {/* Attachment indicator */}
          {mail.hasAttachment && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiPaperclip size={16} />
              <span>Attachment</span>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-start gap-4 ml-4">
          {/* Sent badge */}
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Sent
          </span>

          <div className="flex items-center gap-3 text-gray-500">
            {/* Date */}
            {mail.date && (
              <div className="flex items-center gap-1">
                <FiCalendar size={16} />
                <span className="text-sm">{mail.date}</span>
              </div>
            )}

            {/* Avatar */}
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                mail.recipient
              )}&background=random`}
              alt={`${mail.recipient} avatar`}
              className="w-6 h-6 rounded-full"
            />

            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMenu(mail.id);
                }}
                className="hover:bg-gray-100 rounded p-1 transition-colors"
              >
                <FiMoreVertical size={16} className="text-gray-500" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmailClick(mail.id);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 rounded-t-xl"
                  >
                    <FiEye size={14} />
                    View Email
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(mail.id);
                    }}
                    disabled={isActing}
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
  );
}

function ViewMoreButton({ remainingCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-4 py-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1 transition-colors border border-gray-200"
    >
      <FiChevronDown size={16} />
      View More ({remainingCount} more)
    </button>
  );
}
