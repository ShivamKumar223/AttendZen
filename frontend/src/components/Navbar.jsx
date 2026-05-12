import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { FiLogOut, FiBell, FiTrash2 } from 'react-icons/fi';

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, unreadCount, markAllRead, clearAll } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleBellClick = () => {
    setShowDropdown(v => !v);
    if (!showDropdown) markAllRead();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const timeLabel = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <nav className="glass-nav">
      <div className="container flex items-center justify-between" style={{ height: '70px' }}>

        {/* Logo */}
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <h2 className="heading-gradient" style={{ fontSize: '1.4rem', margin: 0 }}>
            ✦ AttendZen
          </h2>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Bell */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost"
              style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, position: 'relative' }}
              onClick={handleBellClick}
              aria-label="Notifications"
            >
              <FiBell size={20} className={unreadCount > 0 ? 'bell-pulse' : ''} style={{ color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px',
                  background: 'var(--danger)', color: '#fff',
                  fontSize: '0.65rem', fontWeight: 700,
                  width: '16px', height: '16px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--bg-darker)',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
                      onClick={clearAll}
                    >
                      <FiTrash2 size={12} /> Clear all
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="notif-empty">🔔 No notifications yet</div>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <div key={n.id} className="notif-item">
                      <div>{n.message}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.5)', marginTop: '0.25rem' }}>{timeLabel(n.time)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
              {getInitials(user?.name)}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <button
              className="btn btn-ghost"
              onClick={handleLogout}
              style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0, color: 'var(--danger)' }}
              title="Logout"
            >
              <FiLogOut size={17} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
