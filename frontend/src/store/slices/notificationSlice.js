import { createSlice } from '@reduxjs/toolkit';

// Notification Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action) => {
      if (action.payload === 'all') {
        state.notifications.forEach(n => n.isRead = true);
        state.unreadCount = 0;
      } else {
        const n = state.notifications.find(n => n._id === action.payload);
        if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      }
    },
  },
});

export const { setNotifications, addNotification, markRead } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;
export default notificationSlice.reducer;
