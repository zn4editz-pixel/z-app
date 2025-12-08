import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
	notifications: [],
	unreadCount: 0,

	addNotification: (notification) => {
		set((state) => {
			const newNotification = {
				...notification,
				id: notification.id || Date.now().toString(),
				createdAt: notification.createdAt || new Date().toISOString(),
				read: false,
			};

			return {
				notifications: [newNotification, ...state.notifications],
				unreadCount: state.unreadCount + 1,
			};
		});
	},

	markAsRead: (notificationId) => {
		set((state) => {
			const notification = state.notifications.find((n) => n.id === notificationId);
			if (!notification || notification.read) return state;

			return {
				notifications: state.notifications.map((n) =>
					n.id === notificationId ? { ...n, read: true } : n
				),
				unreadCount: Math.max(0, state.unreadCount - 1),
			};
		});
	},

	markAllAsRead: () => {
		set((state) => ({
			notifications: state.notifications.map((n) => ({ ...n, read: true })),
			unreadCount: 0,
		}));
	},

	removeNotification: (notificationId) => {
		set((state) => {
			const notification = state.notifications.find((n) => n.id === notificationId);
			const wasUnread = notification && !notification.read;

			return {
				notifications: state.notifications.filter((n) => n.id !== notificationId),
				unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
			};
		});
	},

	clearAllNotifications: () => {
		set({
			notifications: [],
			unreadCount: 0,
		});
	},

	getUnreadNotifications: () => {
		return get().notifications.filter((n) => !n.read);
	},

	clearNotification: (notificationId) => {
		set((state) => {
			const notification = state.notifications.find((n) => n.id === notificationId);
			const wasUnread = notification && !notification.read;

			return {
				notifications: state.notifications.filter((n) => n.id !== notificationId),
				unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
			};
		});
	},

	viewNotifications: () => {
		// Mark all as read when viewing notifications
		set((state) => ({
			notifications: state.notifications.map((n) => ({ ...n, read: true })),
			unreadCount: 0,
		}));
	},
}));
