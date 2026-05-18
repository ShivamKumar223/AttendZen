import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationToast from './components/NotificationToast';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ClassDetail from './pages/ClassDetail';

const PrivateRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="heading-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>✦ AttendZen</div>
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { user } = React.useContext(AuthContext);

  return (
    <>
      <div className={user ? 'main-content' : ''}>
        <Routes>
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/class/:id" element={<PrivateRoute><ClassDetail /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      {/* Global toast container — sits above everything */}
      <NotificationToast />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;