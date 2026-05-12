import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

  const addNotification = useCallback((message, type = 'info') => {
    const id = ++idRef.current;

    // Add to persistent notification list
    setNotifications(prev => [{ id, message, type, time: new Date() }, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Add toast (auto-removes after 4.5 s)
    setToasts(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);

    // Play tone
    playTone(type);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onJoinRequest = (data) => addNotification(data.message, 'info');
    const onResponse    = (data) => addNotification(data.message, data.status === 'accepted' ? 'success' : 'error');
    const onAttendance  = (data) => addNotification(data.message, 'info');

    socket.on('new-join-request',       onJoinRequest);
    socket.on('request-response',       onResponse);
    socket.on('attendance-notification', onAttendance);

    return () => {
      socket.off('new-join-request',       onJoinRequest);
      socket.off('request-response',       onResponse);
      socket.off('attendance-notification', onAttendance);
    };
  }, [socket, addNotification]);

  return (
    <NotificationContext.Provider
      value={{ notifications, toasts, unreadCount, addNotification, removeToast, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
