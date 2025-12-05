"use client";

import {
  Home,
  FileText,
  Settings,
  X,
  Mail,
  User,
  LogOut,
  Send,
  LayoutDashboard,
  CheckCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import LogoutModal from "../modals/LogoutModal";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/main-dashboard",
  },
];

const mailManagement = [
  {
    name: "Incoming Mail",
    icon: Mail,
    href: "/incomingMail",
  },
  {
    name: "Compose Mail",
    icon: Send,
    href: "/compose-mail",
  },
  {
    name: "Sent Mail",
    icon: CheckCircle,
    href: "/sent-mail",
  },
  {
    name: "Drafts",
    icon: FileText,
    href: "/drafts",
  },
];

const settings = [
  {
    name: "Accounts",
    icon: User,
    href: "/users",
    requiredRole: "ADMIN",
  },
  // {
  //   name: "Settings",
  //   icon: Settings,
  //   href: "/settings",
  //   requiredRole: null,
  // },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { logout, user, isAdmin } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  const filteredSettings = settings.filter((item) => {
    if (!item.requiredRole) return true;

    if (item.requiredRole === "ADMIN") return isAdmin;

    if (item.requiredRole === "STAFF") return true;

    return false;
  });

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();

    setShowLogoutModal(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        bg-white min-h-screen shadow-lg border-r border-gray-200
         lg:w-64 lg:translate-x-0 lg:sticky
        fixed top-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 pb-24">
          <h2 className="hidden lg:block text-xs text-gray-800 mb-6">
            Dashboard
          </h2>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#f97316] text-white/90"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-light">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <h2 className="hidden lg:block  text-xs text-gray-800 mb-4 mt-8">
            Mail Management
          </h2>

          <nav className="space-y-2">
            {mailManagement.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#f97316] text-white/90"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <h2 className="hidden lg:block text-gray-800 text-xs mb-4 mt-8">
            Settings
          </h2>

          <nav className="space-y-2">
            {filteredSettings.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-500 text-white/90"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>

        {/* Footer section in sidebar */}
        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-gray-200 bg-white">
          <div className="text-xs text-gray-500 text-center">
            <p>© 2025 Lontara</p>
            <p>Mail Cerdas v1.0</p>
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
