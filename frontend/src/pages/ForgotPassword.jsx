import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { FiLock, FiMail, FiCheckCircle, FiRefreshCw, FiArrowLeft, FiShield } from 'react-icons/fi';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Verify & Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Timer state for resending OTP
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { forgotPassword, resetPassword } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  // Countdown timer logic when in Step 2
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (step === 2 && timer === 0) {
      setTimeout(() => setCanResend(true), 0);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const res = await forgotPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccess('Reset OTP sent to your email.');
      addNotification('Password reset OTP sent to your email.', 'success');
      setStep(2);
      setTimer(60);
      setCanResend(false);
    } else {
      setError(res.message);
      addNotification(res.message, 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6 || isNaN(otp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const res = await resetPassword(email, otp, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccess('Password reset successfully! Redirecting to login...');
      addNotification('Password reset successfully!', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(res.message);
      addNotification(res.message, 'error');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setError('');
    setSuccess('');
    setResending(true);

    const res = await forgotPassword(email);
    setResending(false);

    if (res.success) {
      setSuccess('A new password reset OTP has been sent!');
      addNotification('New password reset OTP sent to your email.', 'success');
      setTimer(60);
      setCanResend(false);
    } else {
      setError(res.message);
      addNotification(res.message, 'error');
    }
  };

  return (
    <div className="container flex items-center justify-center fade-in-up" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem 2rem' }}>
        
        {step === 1 ? (
          /* STEP 1: Enter Email */
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(99, 102, 241, 0.15))',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                marginBottom: '1rem',
                color: 'var(--secondary)'
              }}>
                <FiLock size={28} />
              </div>
              <h2 className="heading-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Reset Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Enter your registered email below, and we'll send you a 6-digit recovery OTP.
              </p>
            </div>

            {error && <div className="badge badge-danger mb-4" style={{ display: 'block', textAlign: 'center', padding: '0.6rem', fontSize: '0.8rem', textTransform: 'none' }}>{error}</div>}

            <form onSubmit={handleSendOtp}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="name@example.com"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.85rem', marginBottom: '1.5rem', fontSize: '0.95rem' }} 
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          /* STEP 2: Enter OTP & Reset Password */
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.15))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                marginBottom: '1rem',
                color: 'var(--primary)'
              }}>
                <FiShield size={28} />
              </div>
              <h2 className="heading-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Create New Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                A 6-digit recovery OTP has been sent to: <br />
                <strong style={{ color: 'var(--text-main)' }}>{email}</strong>
              </p>
            </div>

            {error && <div className="badge badge-danger mb-4" style={{ display: 'block', textAlign: 'center', padding: '0.6rem', fontSize: '0.8rem', textTransform: 'none' }}>{error}</div>}
            {success && <div className="badge badge-success mb-4" style={{ display: 'block', textAlign: 'center', padding: '0.6rem', fontSize: '0.8rem', textTransform: 'none' }}>{success}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', width: '100%', marginBottom: '0.6rem' }}>
                  Enter Recovery OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-control"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={loading}
                  placeholder="e.g. 123456"
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '1.6rem', 
                    letterSpacing: '0.4rem', 
                    fontWeight: 'bold', 
                    padding: '0.6rem',
                    borderRadius: 'var(--border-radius-sm)',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Repeat new password"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.95rem' }} 
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
              <button 
                className="att-pill"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  fontSize: '0.8rem', 
                  background: 'transparent',
                  border: 'none',
                  cursor: canResend ? 'pointer' : 'not-allowed',
                  color: canResend ? 'var(--primary)' : 'var(--text-muted)',
                  opacity: canResend ? 1 : 0.6,
                  fontWeight: 600,
                  padding: '0.5rem 1rem'
                }}
                onClick={handleResendOtp}
                disabled={!canResend || resending}
              >
                <FiRefreshCw className={resending ? 'bell-pulse' : ''} />
                {resending ? 'Resending...' : canResend ? 'Resend OTP' : `Resend in ${timer}s`}
              </button>
            </div>
          </>
        )}

        <div className="divider" style={{ margin: '1.5rem 0' }}></div>

        <div style={{ textAlign: 'center' }}>
          <Link 
            to="/login" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontSize: '0.85rem', 
              color: 'var(--text-muted)', 
              textDecoration: 'none',
              transition: 'var(--transition)'
            }}
            className="hover-underline"
          >
            <FiArrowLeft /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
