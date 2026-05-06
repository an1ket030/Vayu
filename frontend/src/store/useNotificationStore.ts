import { create } from 'zustand';

export type NotificationType = 'warning' | 'info' | 'success' | 'emergency';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  station?: string;
  aqi?: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isPanelOpen: boolean;
  // Actions
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  togglePanel: () => void;
  closePanel: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isPanelOpen: false,

  addNotification: (n) => {
    const newNotification: Notification = {
      ...n,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50), // max 50
      unreadCount: state.unreadCount + 1,
    }));

    // Trigger browser notification for high-severity events if permission granted
    if (
      (n.type === 'warning' || n.type === 'emergency') &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(`CleanAir Alert: ${n.title}`, {
        body: n.message,
        icon: '/favicon.ico',
      });
    }
  },

  markRead: (id) => {
    set((state) => {
      const notif = state.notifications.find((n) => n.id === id);
      if (!notif || notif.read) return state;
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  dismiss: (id) => {
    set((state) => {
      const notif = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notif && !notif.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
  },

  togglePanel: () => {
    set((state) => {
      if (!state.isPanelOpen) {
        // Mark all as read when opening
        return {
          isPanelOpen: true,
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        };
      }
      return { isPanelOpen: false };
    });
  },

  closePanel: () => set({ isPanelOpen: false }),
}));
