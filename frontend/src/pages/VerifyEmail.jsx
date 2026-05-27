import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { FiMail, FiCheckCircle, FiShield, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Timer state for resending OTP
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { verifyOtp, resendOtp } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  // Redirect if no email is provided
  useEffect(() => {
    if (!email) {
      addNotification('Invalid email parameter.', 'error');
      navigate('/login');
    }
  }, [email, navigate, addNotification]);

  // Countdown timer logic
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else {
      setTimeout(() => setCanResend(true), 0);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6 || isNaN(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const res = await verifyOtp(email, otp);
    setLoading(false);

    if (res.success) {
      setSuccess('Email verified successfully! Logging you in...');
      addNotification('Email verified! Welcome to AttendZen.', 'success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      setError(res.message);
      addNotification(res.message, 'error');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setError('');
    setSuccess('');
    setResending(true);

    const res = await resendOtp(email);
    setResending(false);

    if (res.success) {
      setSuccess('Verification OTP resent successfully!');
      addNotification('A new OTP has been sent to your email.', 'success');
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
          <h2 className="heading-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Verify Email</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', wordBreak: 'break-all' }}>
            We've sent a 6-digit verification OTP to: <br />
            <strong style={{ color: 'var(--text-main)' }}>{email}</strong>
          </p>
        </div>

        {error && <div className="badge badge-danger mb-4" style={{ display: 'block', textAlign: 'center', padding: '0.6rem', fontSize: '0.8rem', textTransform: 'none' }}>{error}</div>}
        {success && <div className="badge badge-success mb-4" style={{ display: 'block', textAlign: 'center', padding: '0.6rem', fontSize: '0.8rem', textTransform: 'none' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ textAlign: 'center', display: 'block', width: '100%', marginBottom: '0.8rem' }}>
              Enter 6-Digit OTP Code
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
                fontSize: '1.8rem', 
                letterSpacing: '0.5rem', 
                fontWeight: 'bold', 
                padding: '0.8rem',
                borderRadius: 'var(--border-radius-sm)',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.95rem' }} 
            disabled={loading}
          >
            {loading ? 'Verifying OTP...' : 'Verify & Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
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
            onClick={handleResend}
            disabled={!canResend || resending}
          >
            <FiRefreshCw className={resending ? 'bell-pulse' : ''} />
            {resending ? 'Resending...' : canResend ? 'Resend OTP' : `Resend in ${timer}s`}
          </button>
        </div>

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

export default VerifyEmail;
