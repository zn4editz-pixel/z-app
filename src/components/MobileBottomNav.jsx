import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import {
  Home,
  Users,
  User,
  Settings,
} from "lucide-react";

const MobileBottomNav = () => {
  const location = useLocation();
  const { authUser } = useAuthStore();
  const { pendingReceived } = useFriendStore();

  // Don't show on auth pages or stranger chat page
  if (!authUser || !authUser.hasCompletedProfile || location.pathname === "/stranger") return null;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-base-100 border-t border-base-300 safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home - Shows Users */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative ${
            isActive("/") ? "text-primary" : "text-base-content/60"
          }`}
        >
          <Home size={24} strokeWidth={isActive("/") ? 2.5 : 2} />
          <span className="text-xs font-medium">Home</span>
          {isActive("/") && (
            <div className="absolute top-1 w-1.5 h-1.5 bg-primary rounded-full"></div>
          )}
        </Link>

        {/* Social Hub / Discover */}
        <Link
          to="/discover"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative ${
            isActive("/discover") ? "text-primary" : "text-base-content/60"
          }`}
        >
          <Users size={24} strokeWidth={isActive("/discover") ? 2.5 : 2} />
          <span className="text-xs font-medium">Social</span>
          {pendingReceived.length > 0 && (
            <span className="absolute top-1 right-1/4 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {pendingReceived.length}
            </span>
          )}
          {isActive("/discover") && (
            <div className="absolute top-1 w-1.5 h-1.5 bg-primary rounded-full"></div>
          )}
        </Link>

        {/* Profile */}
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative ${
            isActive("/profile") ? "text-primary" : "text-base-content/60"
          }`}
        >
          <User size={24} strokeWidth={isActive("/profile") ? 2.5 : 2} />
          <span className="text-xs font-medium">Profile</span>
          {isActive("/profile") && (
            <div className="absolute top-1 w-1.5 h-1.5 bg-primary rounded-full"></div>
          )}
        </Link>

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative ${
            isActive("/settings") ? "text-primary" : "text-base-content/60"
          }`}
        >
          <Settings size={24} strokeWidth={isActive("/settings") ? 2.5 : 2} />
          <span className="text-xs font-medium">Settings</span>
          {isActive("/settings") && (
            <div className="absolute top-1 w-1.5 h-1.5 bg-primary rounded-full"></div>
          )}
        </Link>
      </div>
    </div>
  );
};

export default MobileBottomNav;
