import React, { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { FiBell, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';

const icons = {
  info: <FiBell size={18} />,
  success: <FiCheckCircle size={18} />,
  error: <FiXCircle size={18} />,
};

const colours = {
  info: 'var(--primary)',
  success: 'var(--success)',
  error: 'var(--danger)',
};

const bgColours = {
  info: 'rgba(99,102,241,0.15)',
  success: 'rgba(16,185,129,0.15)',
  error: 'rgba(239,68,68,0.15)',
};

const NotificationToast = () => {
  const { toasts, removeToast } = useContext(NotificationContext);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast-item toast-enter"
          style={{ borderLeftColor: colours[toast.type], background: bgColours[toast.type] }}
        >
          <span className="toast-icon" style={{ color: colours[toast.type] }}>
            {icons[toast.type]}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <FiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
