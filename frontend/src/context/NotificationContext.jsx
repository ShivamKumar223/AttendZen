import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';

export const NotificationContext = createContext();

// ── Web Audio tone (no file needed) ──────────────────────────────────────────
function playTone(type = 'info') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Different tones for different notification types
    if (type === 'success') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);       // C5
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
    } else if (type === 'error') {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
    } else {
      // info / default
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    }

    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Audio blocked or not supported — silently ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const idRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++idRef.current;

    // Add toast (auto-removes after 4.5 s)
    setToasts(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);

    // Play tone
    playTone(type);

    // Also fetch the newly created notification from DB
    fetchNotifications();
  }, [fetchNotifications]);

  // Keep for backwards compatibility if needed, but mainly use addToast
  const addNotification = addToast;

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await axios.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await axios.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      // Re-calculate unread count from state
      setUnreadCount(prevUnread => {
        const deletedNotif = notifications.find(n => n._id === id);
        return deletedNotif && !deletedNotif.isRead ? Math.max(0, prevUnread - 1) : prevUnread;
      });
    } catch (error) {
      console.error(error);
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    // We could add a clearAll API, but for now just clear local state 
    // or iterate and delete. Let's just do local for now.
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onJoinRequest = (data) => addNotification(data.message, 'info');
    const onResponse = (data) => addNotification(data.message, data.status === 'accepted' ? 'success' : 'error');
    const onAttendance = (data) => addNotification(data.message, 'info');

    socket.on('new-join-request', onJoinRequest);
    socket.on('request-response', onResponse);
    socket.on('attendance-notification', onAttendance);

    return () => {
      socket.off('new-join-request', onJoinRequest);
      socket.off('request-response', onResponse);
      socket.off('attendance-notification', onAttendance);
    };
  }, [socket, addNotification]);

  return (
    <NotificationContext.Provider
      value={{ notifications, toasts, unreadCount, addNotification, removeToast, markAllRead, clearAll, deleteNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
