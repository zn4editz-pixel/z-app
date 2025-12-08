import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, X, Video, Check } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";
import { useNotificationStore } from "../store/useNotificationStore";

const Sidebar = () => {
  const {
    selectedUser,
    setSelectedUser,
    unreadCounts = {},
  } = useChatStore();

  const { onlineUsers = [], authUser } = useAuthStore();
  const { friends, isLoading: isFriendsLoading, pendingReceived } = useFriendStore();
  const { notifications } = useNotificationStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // Calculate if there are any Social Hub updates
  const adminNotifications = notifications.filter(n => n.type === 'admin' || n.type === 'admin_broadcast');
  const hasVerificationUpdate = authUser?.verificationRequest?.status && authUser.verificationRequest.status !== "none";
  const hasSocialHubUpdates = pendingReceived.length > 0 || adminNotifications.length > 0 || hasVerificationUpdate;

  const filteredUsers = friends
    .filter((u) => u && (u._id || u.id))
    .filter((u) => {
      if (!query) return true;
      return `${u.nickname || u.username}`
        .toLowerCase()
        .includes(query.toLowerCase());
    })
    .filter((u) => (showOnlineOnly ? onlineUsers.includes(u._id || u.id) : true))
    .sort((a, b) => {
      // Priority 1: Online users come first
      const aOnline = onlineUsers.includes(a._id || a.id);
      const bOnline = onlineUsers.includes(b._id || b.id);
      
      if (aOnline && !bOnline) return -1; // a is online, b is not
      if (!aOnline && bOnline) return 1;  // b is online, a is not
      
      // Priority 2: If both online or both offline, sort by unread messages
      const aUnread = unreadCounts[a._id || a.id] || 0;
      const bUnread = unreadCounts[b._id || b.id] || 0;
      
      if (aUnread !== bUnread) return bUnread - aUnread; // Higher unread first
      
      // Priority 3: Alphabetical by display name
      const aName = (a.nickname || a.username || '').toLowerCase();
      const bName = (b.nickname || b.username || '').toLowerCase();
      return aName.localeCompare(bName);
    });

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`
          ${selectedUser ? "hidden" : "flex"} 
          md:flex 
          w-full md:w-80 lg:w-96
          bg-base-100 
          border-r border-base-300
          flex-col
          h-full
          overflow-hidden
        `}
      >
        {/* Header Section - Fixed */}
        <div className="flex-shrink-0 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-base-300">
          {/* Title and Search */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl sm:text-2xl font-bold">Chats</h3> 
            <button
              onClick={() => setSearchOpen(true)}
              className="btn btn-ghost btn-circle btn-sm"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Stories/Quick Access - Horizontal Scroll */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto py-2 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide">
            
            {/* Discover Users Button */}
            <Link
              to="/discover"
              className="flex-none flex flex-col items-center gap-1 min-w-[56px] sm:min-w-[64px] active:scale-95 transition-transform"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-primary flex items-center justify-center bg-primary/10">
                <Search className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <span className="text-xs sm:text-sm truncate w-14 sm:w-16 text-center font-semibold">
                Discover
              </span>
            </Link>

            {/* Stranger Chat Button */}
            <Link
              to="/stranger"
              className="flex-none flex flex-col items-center gap-1 min-w-[56px] sm:min-w-[64px] active:scale-95 transition-transform"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-dashed border-base-content/50 flex items-center justify-center bg-base-200">
                <Video className="w-6 h-6 sm:w-7 sm:h-7 text-base-content/70" />
              </div>
              <span className="text-xs sm:text-sm truncate w-14 sm:w-16 text-center text-base-content/70 font-semibold">
                Stranger
              </span>
            </Link>
            
            {/* Friend Stories (Max 8 shown) */}
            {friends.slice(0, 8).map((u) => (
              <button
                key={u._id || u.id}
                onClick={() => setSelectedUser(u)}
                className="flex-none flex flex-col items-center gap-1 min-w-[56px] sm:min-w-[64px] active:scale-95 transition-transform focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] ring-2 ring-primary overflow-hidden"> 
                  <img
                    src={u.profilePic || "/avatar.png"}
                    alt={u.nickname || u.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="text-xs sm:text-sm truncate w-14 sm:w-16 text-center">
                  {(u.nickname || u.username || "User").split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Chat List - THIS IS THE KEY FIX */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Online Filter */}
          <div className="flex-shrink-0 px-2 sm:px-4 py-0.5 sm:py-1 border-b border-base-200">
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-primary w-3 h-3 sm:w-4 sm:h-4 rounded-full"
              />
              <span className="text-[11px] sm:text-xs font-medium text-base-content/80">Show Active only</span>
            </label>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2">
            {/* Conversations List */}
            <div className="space-y-1">
              {isFriendsLoading ? (
                <SidebarSkeleton />
              ) : filteredUsers.length === 0 ? (
                <div className="text-center text-base-content/60 py-8 px-4 text-sm sm:text-base">
                  {query ? "No results found" : "No friends yet. Add some friends to start chatting!"}
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const userId = user._id || user.id;
                  const unread = unreadCounts[userId] || 0;
                  const isOnline = onlineUsers.includes(userId);
                  return (
                    <button
                      key={userId}
                      onClick={() => {
                        setSelectedUser(user);
                        if (searchOpen) setSearchOpen(false); 
                      }}
                      className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left transition-all hover:bg-base-200 card-touch ${
                        (selectedUser?._id || selectedUser?.id) === userId ? "bg-base-200 ring-2 ring-primary/20" : ""
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-2 ring-base-300">
                          <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.nickname || user.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isOnline && (
                          <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full ring-2 ring-base-100 bg-success animate-pulse" /> 
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-sm sm:text-base flex items-center gap-1">
                          <span className="truncate">{user.nickname || user.username}</span>
                          {user.isVerified && <VerifiedBadge size="xs" />}
                        </div>
                        <div className="text-xs sm:text-sm text-base-content/60 truncate">
                          {user.lastMessage?.text || "Start a chat!"}
                        </div>
                      </div>

                      {/* Unread Badge - Enhanced */}
                      {unread > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 sm:min-w-[24px] sm:h-6 px-1.5 sm:px-2 bg-error text-error-content rounded-full text-[10px] sm:text-xs font-bold shadow-lg animate-pulse"> 
                            {unread > 99 ? "99+" : unread}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Enhanced Search Overlay */}
      {searchOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => {
            setSearchOpen(false);
            setQuery("");
          }}
        >
          <div 
            className="bg-gradient-to-br from-base-100 to-base-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-primary/20 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-base-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Search className="w-6 h-6 text-primary" />
                  Search Friends
                </h2>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery("");
                  }}
                  className="btn btn-ghost btn-circle btn-sm hover:bg-error/10 hover:text-error"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 bg-base-200 rounded-xl outline-none border-2 border-transparent focus:border-primary transition-all text-base sm:text-lg"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/40 hover:text-base-content"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Results Count */}
              {query && (
                <p className="mt-3 text-sm text-base-content/60">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'friend' : 'friends'} found
                </p>
              )}
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {!query ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Search Your Friends</h3>
                  <p className="text-sm sm:text-base text-base-content/60 max-w-sm">
                    Type a name or username to find your friends quickly
                  </p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  {filteredUsers.map((user) => {
                    const isOnline = onlineUsers.includes(user._id);
                    const unread = unreadCounts[user._id] || 0;
                    return (
                      <button
                        key={user._id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchOpen(false);
                          setQuery("");
                        }}
                        className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-base-200 active:bg-base-300 transition-all group"
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden ring-2 ring-base-300 group-hover:ring-primary transition-all">
                            <img
                              src={user.profilePic || "/avatar.png"}
                              alt={user.nickname || user.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {isOnline && (
                            <span className="absolute right-0 bottom-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full ring-2 ring-base-100 bg-success animate-pulse-glow" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-base sm:text-lg truncate">
                              {user.nickname || user.username}
                            </span>
                            {user.isVerified && <VerifiedBadge size="sm" />}
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-base-content/60">
                            <span className="truncate">@{user.username}</span>
                            {isOnline && (
                              <span className="flex items-center gap-1 text-success">
                                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                Online
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Unread Badge - Enhanced */}
                        {unread > 0 && (
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 sm:min-w-[28px] sm:h-7 px-2 bg-error text-error-content rounded-full text-xs sm:text-sm font-bold shadow-lg">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          </div>
                        )}

                        {/* Arrow Icon */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-base-300 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No Results Found</h3>
                  <p className="text-sm sm:text-base text-base-content/60 max-w-sm">
                    No friends found matching "<span className="font-semibold">{query}</span>"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulseGlow {
          0%, 100% { 
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          50% { 
            opacity: 0.8;
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
