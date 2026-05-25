import { memo } from "react";
const MessageStatus = ({ message, isMyMessage }) => {
  if (!isMyMessage) return null;
  const status = message.status || "sent";
  const isRead = message.isRead || message.readAt || status === "read";
  const isDelivered = message.deliveredAt || status === "delivered" || isRead;
  const isSending = status === "sending";
  const isFailed = status === "failed";
  if (isFailed) {
    return (
      <div className="flex items-center ml-1" title="Failed to send">
        <svg
          className="w-3.5 h-3.5 text-error"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    );
  }
  if (isSending) {
    return (
      <div className="flex items-center ml-1" title="Sending...">
        <svg
          className="w-3 h-3 text-base-content/50 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    );
  }
  if (isRead) {
    return (
      <div className="flex items-center ml-1 status-tick-container" title="Seen">
        {/* Double Tick (Read) - Theme-based primary color */}
        <svg
          className="w-4 h-4 status-tick-read"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0z" />
          <path d="m5.354 7.146.896.897-.707.707-.897-.896a.5.5 0 1 1 .708-.708z" />
        </svg>
      </div>
    );
  } else if (isDelivered) {
    return (
      <div className="flex items-center ml-1 status-tick-container" title="Delivered">
        {/* Double Tick (Delivered) - Exact match from Sidebar */}
        <svg
          className="w-4 h-4 status-tick-delivered"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0z" />
          <path d="m5.354 7.146.896.897-.707.707-.897-.896a.5.5 0 1 1 .708-.708z" />
        </svg>
      </div>
    );
  } else {
    // Sent (Server Received)
    return (
      <div className="flex items-center ml-1 status-tick-container" title="Sent">
        {/* Single Tick (Sent) - Exact match from Sidebar */}
        <svg
          className="w-4 h-4 status-tick-sent"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
        </svg>
      </div>
    );
  }
};
export default memo(MessageStatus);
