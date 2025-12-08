import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
	notifications: [],
	unreadCount: 0,
	hasViewedNotifications: false, // Track if user has viewed notifications tab

	addNotification: (notification) => {
		const newNotification = {
			id: Date.now() + Math.random(),
			timestamp: new Date(),
			read: false,
			...notification,
		};

		set((state) => ({
			notifications: [newNotification, ...state.notifications],
			unreadCount: state.unreadCount + 1,
		}));
	},

	markAsRead: (notificationId) => {
		set((state) => ({
			notifications: state.notifications.map((n) =>
				n.id === notificationId ? { ...n, read: true } : n
			),
			unreadCount: Math.max(0, state.unreadCount - 1),
		}));
	},

	markAllAsRead: () => {
		set((state) => ({
			notifications: state.notifications.map((n) => ({ ...n, read: true })),
			unreadCount: 0,
			hasViewedNotifications: true, // Mark as viewed
		}));
	},

	clearNotification: (notificationId) => {
		set((state) => {
			const notification = state.notifications.find((n) => n.id === notificationId);
			return {
				notifications: state.notifications.filter((n) => n.id !== notificationId),
				unreadCount: notification && !notification.read 
					? Math.max(0, state.unreadCount - 1) 
					: state.unreadCount,
			};
		});
	},

	clearAllNotifications: () => {
		set({ notifications: [], unreadCount: 0 });
	},

	// Auto-mark all notifications as read when viewing notifications tab
	viewNotifications: () => {
		set((state) => ({
			notifications: state.notifications.map((n) => ({ ...n, read: true })),
			unreadCount: 0,
			hasViewedNotifications: true,
		}));
	},
}));
