import { create } from "zustand";
// 🔥 DEDICATED MESSAGE STATUS STORE for real-time updates
// This store is separate from chat store to avoid conflicts
export const useMessageStatusStore = create((set, get) => ({
  // Map of messageId -> status info
  messageStatuses: {},
  // Update a specific message status
  updateStatus: (messageId, statusData) => {
    set((state) => ({
      messageStatuses: {
        ...state.messageStatuses,
        [messageId]: {
          ...state.messageStatuses[messageId],
          ...statusData,
          lastUpdated: Date.now(),
        },
      },
    }));
  },
  // Get status for a specific message
  getStatus: (messageId) => {
    const statuses = get().messageStatuses;
    return statuses[messageId] || null;
  },
  // Bulk update multiple messages
  updateMultiple: (updates) => {
    set((state) => {
      const newStatuses = { ...state.messageStatuses };
      updates.forEach(({ messageId, ...statusData }) => {
        newStatuses[messageId] = {
          ...newStatuses[messageId],
          ...statusData,
          lastUpdated: Date.now(),
        };
      });
      return { messageStatuses: newStatuses };
    });
  },
  // Clear old statuses (cleanup)
  cleanup: () => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    set((state) => {
      const newStatuses = {};
      Object.entries(state.messageStatuses).forEach(([messageId, status]) => {
        if (now - status.lastUpdated < maxAge) {
          newStatuses[messageId] = status;
        }
      });
      return { messageStatuses: newStatuses };
    });
  },
}));
// 🔥 GLOBAL: Make available for debugging
if (typeof window !== "undefined") {
  window.useMessageStatusStore = useMessageStatusStore;
}
