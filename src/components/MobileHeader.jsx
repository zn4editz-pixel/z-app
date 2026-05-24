import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useAuthStore } from "../store/useAuthStore";

const MobileHeader = () => {
  const { authUser } = useAuthStore();
  const { notifications } = useNotificationStore();

  // Don't show on auth pages or stranger chat
  if (!authUser || !authUser.hasCompletedProfile) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-base-100 border-b border-base-300 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo Only - No Text */}
        <Link to="/" className="flex items-center">
          <img
            src="/zn4.png"
            alt="Z-App"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Notifications */}
        <Link
          to="/discover"
          className="btn btn-ghost btn-circle relative"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default MobileHeader;
