import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import Navbar from '../components/Navbar';
import { FiEdit3, FiSave, FiX, FiArrowLeft, FiUser, FiMail, FiPhone, FiLock, FiShield } from 'react-icons/fi';

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        password: '',
        confirmPassword: '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (form.password && form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password && form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = { name: form.name, email: form.email, mobile: form.mobile };
    if (form.password) payload.password = form.password;
    const result = await updateProfile(payload);
    setSaving(false);
    if (result.success) {
      addNotification('Profile updated successfully!', 'success');
      setIsEditing(false);
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } else {
      addNotification(result.message || 'Failed to update profile', 'error');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setForm(f => ({
      ...f,
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      password: '',
      confirmPassword: '',
    }));
  };

  const pwStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Weak', color: 'var(--danger)', width: '25%' };
    if (score === 2) return { label: 'Fair', color: 'var(--warning)', width: '50%' };
    if (score === 3) return { label: 'Good', color: '#38bdf8', width: '75%' };
    return { label: 'Strong', color: 'var(--success)', width: '100%' };
  };

  const strength = pwStrength(form.password);

  const isTeacher = user?.role === 'teacher';

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '680px' }}>
        {/* Back nav */}
        <div className="flex items-center gap-3 mb-4 fade-in-up">
          <Link
            to="/dashboard"
            className="btn btn-ghost"
            style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
          >
            <FiArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="heading-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>My Profile</h2>
            <p style={{ fontSize: '0.82rem', marginTop: '0.1rem' }}>View and manage your account details</p>
          </div>
        </div>

        {/* Profile hero card */}
        <div
          className="glass-panel fade-in-up"
          style={{
            padding: '2rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(236,72,153,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Big avatar */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 0 24px rgba(99,102,241,0.45)',
              flexShrink: 0,
            }}
          >
            {getInitials(user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{user?.name}</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{user?.email}</p>
            <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                className="badge"
                style={{
                  background: isTeacher ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.15)',
                  color: isTeacher ? '#a5b4fc' : 'var(--success)',
                  border: `1px solid ${isTeacher ? 'rgba(99,102,241,0.35)' : 'rgba(16,185,129,0.3)'}`,
                }}
              >
                {isTeacher ? '🎓 Teacher' : '🎒 Student'}
              </span>
              {user?.isVerified && (
                <span className="badge badge-success">✓ Verified</span>
              )}
            </div>
          </div>
          {!isEditing && (
            <button
              className="btn btn-secondary"
              onClick={() => setIsEditing(true)}
              style={{ gap: '0.4rem' }}
            >
              <FiEdit3 size={15} /> Edit Profile
            </button>
          )}
        </div>

        {/* Details / Edit form */}
        <div className="glass-panel card fade-in-up">
          <form onSubmit={handleSave}>
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <FiUser size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.05rem' }}>
                {isEditing ? 'Edit Your Information' : 'Account Information'}
              </h3>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiUser size={13} /> Full Name
                </span>
              </label>
              {isEditing ? (
                <>
                  <input
                    id="profile-name"
                    name="name"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    style={errors.name ? { borderColor: 'var(--danger)' } : {}}
                  />
                  {errors.name && <span style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>{errors.name}</span>}
                </>
              ) : (
                <div style={{ padding: '0.5rem 1rem', color: 'var(--text-main)', fontWeight: 500, background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {user?.name || '—'}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiMail size={13} /> Email Address
                </span>
              </label>
              {isEditing ? (
                <>
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    style={errors.email ? { borderColor: 'var(--danger)' } : {}}
                  />
                  {errors.email && <span style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>{errors.email}</span>}
                </>
              ) : (
                <div style={{ padding: '0.5rem 1rem', color: 'var(--text-main)', fontWeight: 500, background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {user?.email || '—'}
                </div>
              )}
            </div>

            {/* Mobile */}
            <div className="form-group">
              <label className="form-label" htmlFor="profile-mobile">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiPhone size={13} /> Mobile Number
                </span>
              </label>
              {isEditing ? (
                <input
                  id="profile-mobile"
                  name="mobile"
                  type="tel"
                  className="form-control"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="+91 00000 00000"
                />
              ) : (
                <div style={{ padding: '0.5rem 1rem', color: 'var(--text-main)', fontWeight: 500, background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {user?.mobile || '—'}
                </div>
              )}
            </div>

            {/* Password section (edit only) */}
            {isEditing && (
              <>
                <div className="divider" style={{ margin: '1.5rem 0 1.2rem' }} />
                <div className="section-header" style={{ marginBottom: '1.2rem' }}>
                  <FiLock size={16} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1rem' }}>Change Password <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--text-muted)' }}>(leave blank to keep current)</span></h3>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-password">New Password</label>
                  <input
                    id="profile-password"
                    name="password"
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    style={errors.password ? { borderColor: 'var(--danger)' } : {}}
                  />
                  {errors.password && <span style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>{errors.password}</span>}
                  {/* Password strength bar */}
                  {form.password && strength && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ width: strength.width, height: '100%', borderRadius: '999px', background: strength.color, transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 600, marginTop: '0.2rem', display: 'block' }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-confirm-password">Confirm New Password</label>
                  <input
                    id="profile-confirm-password"
                    name="confirmPassword"
                    type="password"
                    className="form-control"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter new password"
                    style={errors.confirmPassword ? { borderColor: 'var(--danger)' } : {}}
                  />
                  {errors.confirmPassword && <span style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>{errors.confirmPassword}</span>}
                </div>
              </>
            )}

            {/* Actions */}
            {isEditing && (
              <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ gap: '0.4rem' }}
                >
                  <FiX size={15} /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ gap: '0.4rem', minWidth: '120px' }}
                >
                  {saving ? 'Saving…' : <><FiSave size={15} /> Save Changes</>}
                </button>
              </div>
            )}
          </form>

          {/* Read-only account meta */}
          {!isEditing && (
            <>
              <div className="divider" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <FiShield size={15} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Your password is securely hashed. Click <strong style={{ color: 'var(--text-main)' }}>Edit Profile</strong> to change it.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
