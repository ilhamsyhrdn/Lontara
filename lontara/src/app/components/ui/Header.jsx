"use client";

import { Bell, User, Settings, Menu } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import Image from "next/image";

export default function Header({ onMenuClick }) {
  const { user } = useAuth();

  const getRoleDisplay = (role) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "STAFF":
        return "Staff";
      default:
        return "User";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <Image src="/logo_lontara.svg" width={125} height={200} alt="Lontara logo" />
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            aria-label="Toggle menu"
            data-testid="menu-toggle"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notification Bell */}
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>

          

          {/* User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <div className="text-sm flex flex-col">
              <p className="font-medium text-gray-900">{user?.username || "Guest"}</p>
              <p className="text-[10px] font-medium text-gray-600">
                {getRoleDisplay(user?.role)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
