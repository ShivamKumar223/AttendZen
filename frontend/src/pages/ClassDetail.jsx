import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import Navbar from '../components/Navbar';
import {
  FiArrowLeft, FiCheck, FiX, FiUsers, FiCalendar,
  FiClock, FiTrash2, FiAlertTriangle, FiMail, FiUser, FiMessageSquare
} from 'react-icons/fi';

import ClassChat from '../components/ClassChat/ClassChat';

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const TABS = ['Attendance', 'Chat' ,'Enrolled', 'Requests', 'History', ];

/* ── Utility: attendance colour ──────────────────────────────────────────── */
const rateColor = (rate) =>
  rate >= 75 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)';

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);

  /* ── core data ── */
  const [classData, setClassData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState('Attendance');

  /* ── student detail modal ── */
  const [selectedStudent, setSelectedStudent] = useState(null);

  /* ── remove student confirmation modal ── */
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState(null);
  const [pendingRemoveName, setPendingRemoveName] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  /* ── delete class modal ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── fetch on mount ── */
  useEffect(() => { fetchClassDetails(); }, [id]);

  useEffect(() => {
    if (!classData) return;
    if (classData.teacher._id === user._id) {
      fetchRequests();
      fetchAttendanceHistory();
      const initial = {};
      classData.students.forEach(s => { initial[s.student._id] = null; });
      setAttendanceState(initial);
    } else {
      fetchStudentAttendance();
    }
  }, [classData]);

  /* ── fetchers ── */
  const fetchClassDetails = async () => {
    try {
      const res = await axios.get('/classes');
      const all = [...res.data.teaching, ...res.data.enrolled];
      const cls = all.find(c => c._id === id);
      setClassData(cls);
    } catch (err) { console.error(err); }
  };

  const fetchRequests = async () => {
    try { const res = await axios.get(`/requests/${id}`); setRequests(res.data); } catch { }
  };

  const fetchAttendanceHistory = async () => {
    try { const res = await axios.get(`/attendance/class/${id}`); setAttendanceRecords(res.data); } catch { }
  };

  const fetchStudentAttendance = async () => {
    try { const res = await axios.get(`/attendance/student/${id}`); setStudentAttendance(res.data); } catch { }
  };

  /* ── request actions ── */
  const handleRequestResponse = async (reqId, status) => {
    try {
      await axios.put(`/requests/${reqId}`, { status });
      fetchRequests(); fetchClassDetails();
      addNotification(`Request ${status} successfully.`, status === 'accepted' ? 'success' : 'error');
    } catch { addNotification('Error updating request', 'error'); }
  };

  /* ── remove student ── */
  const openRemoveConfirm = (studentId, studentName) => {
    setPendingRemoveId(studentId);
    setPendingRemoveName(studentName);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveStudent = async () => {
    setIsRemoving(true);
    try {
      await axios.delete(`/classes/${id}/students/${pendingRemoveId}`);
      addNotification('Student removed successfully.', 'success');
      setSelectedStudent(null);
      setShowRemoveConfirm(false);
      fetchClassDetails();
    } catch { addNotification('Error removing student', 'error'); }
    setIsRemoving(false);
  };

  /* ── attendance ── */
  const handleAttendanceChange = (studentId, status) =>
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));

  const handleConfirmAttendance = async () => {
    try {
      const records = Object.keys(attendanceState)
        .filter(sid => attendanceState[sid])
        .map(studentId => ({ studentId, status: attendanceState[studentId] }));
      await axios.post('/attendance/notify', { classId: id, date: new Date(), records });
      setIsConfirming(true);
      addNotification('Notifications sent to students! Submit to finalise.', 'info');
    } catch { addNotification('Error notifying students', 'error'); }
  };

  const handleSubmitAttendance = async () => {
    try {
      const records = Object.keys(attendanceState)
        .filter(sid => attendanceState[sid])
        .map(studentId => ({ studentId, status: attendanceState[studentId] }));
      await axios.post('/attendance/submit', { classId: id, date: new Date(), records });
      setIsConfirming(false);
      addNotification('Attendance submitted successfully!', 'success');
      fetchAttendanceHistory();
    } catch { addNotification('Error submitting attendance', 'error'); }
  };

  /* ── delete class ── */
  const handleDeleteClass = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`/classes/${id}`);
      addNotification('Class deleted successfully.', 'success');
      navigate('/dashboard');
    } catch (err) {
      addNotification(err.response?.data?.message || 'Error deleting class', 'error');
      setIsDeleting(false);
    }
  };

  /* ── loading ── */
  if (!classData) return (
    <><Navbar />
      <div className="container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading class details…</p>
        </div>
      </div>
    </>
  );

  const isTeacher = classData.teacher._id === user._id;
  const marked = Object.values(attendanceState).filter(Boolean).length;
  const total = classData.students.length;

  /* helper: compute attendance stats per student */
  const getStudentStats = (studentId) => {
    let present = 0;
    attendanceRecords.forEach(record => {
      const r = record.records.find(rc => rc.student && rc.student._id === studentId);
      if (r && r.status === 'present') present++;
    });
    const tot = attendanceRecords.length;
    const rate = tot ? Math.round((present / tot) * 100) : 0;
    return { present, total: tot, rate };
  };

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <Navbar />
      <div className="container">

        {/* ── Back + Header ─────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between fade-in-up mb-4"
          style={{ flexWrap: 'wrap', gap: '0.75rem' }}
        >
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost"
              style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
              onClick={() => navigate('/dashboard')}
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h2 className="heading-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>
                {classData.className}
              </h2>
              <p style={{ fontSize: '0.85rem', marginTop: '0.1rem' }}>
                {classData.subject}&nbsp;·&nbsp;
                <span style={{ color: 'var(--primary)' }}>
                  {isTeacher ? 'You are teaching this class' : `Teacher: ${classData.teacher.name}`}
                </span>
              </p>
            </div>
          </div>

          {/* Delete Class button (teacher only) */}
          {isTeacher && (
            <button
              className="btn btn-danger"
              style={{ gap: '0.4rem', fontSize: '0.85rem' }}
              onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
            >
              <FiTrash2 size={15} /> Delete Class
            </button>
          )}
        </div>

        {/* ── TEACHER VIEW ──────────────────────────────────────────────── */}
        {isTeacher ? (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 grid-cols-md-3 mb-4" style={{ gap: '1rem' }}>
              {[
                { icon: <FiUsers />, label: 'Students', value: classData.students.length },
                { icon: <FiClock />, label: 'Pending Requests', value: requests.length },
                { icon: <FiCalendar />, label: 'Attendance Sessions', value: attendanceRecords.length },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="glass-panel"
                  style={{ padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>{stat.icon}</div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tab bar */}
            <div className="tab-bar">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {tab === 'Requests' && requests.length > 0 && (
                    <span style={{ marginLeft: '0.4rem', background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', padding: '0 5px', borderRadius: '999px', fontWeight: 700 }}>
                      {requests.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab: Requests ── */}
            {activeTab === 'Requests' && (
              <div className="glass-panel card fade-in-up">
                <h3 style={{ marginBottom: '1.25rem' }}>Pending Join Requests</h3>
                {requests.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">✅</div>
                    <p>No pending requests.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {requests.map(req => (
                      <div
                        key={req._id}
                        className="flex items-center justify-between"
                        style={{
                          padding: '0.85rem 1rem',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.07)',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '0.75rem' }}>
                            {getInitials(req.student.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.student.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {req.student.email} · Roll: {req.rollNo}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-success"
                            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', gap: '0.3rem' }}
                            onClick={() => handleRequestResponse(req._id, 'accepted')}
                          >
                            <FiCheck size={13} /> Accept
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', gap: '0.3rem' }}
                            onClick={() => handleRequestResponse(req._id, 'rejected')}
                          >
                            <FiX size={13} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Enrolled ── STUDENT CARD GRID ── */}
            {activeTab === 'Enrolled' && (
              <div className="glass-panel card fade-in-up">
                <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3>Enrolled Students</h3>
                  <span className="badge badge-info">{classData.students.length} enrolled</span>
                </div>
                {classData.students.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">🎒</div>
                    <p>No students enrolled yet.</p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    {classData.students.map(s => {
                      const stats = getStudentStats(s.student._id);
                      return (
                        <div
                          key={s.student._id}
                          onClick={() => setSelectedStudent({ ...s.student, rollNo: s.rollNo, ...stats })}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: '14px',
                            padding: '1.2rem',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.15)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* Subtle glow orb */}
                          <div style={{
                            position: 'absolute', top: '-20px', right: '-20px',
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: `radial-gradient(circle, ${rateColor(stats.rate)}22, transparent 70%)`,
                            pointerEvents: 'none',
                          }} />

                          {/* Top: avatar + name */}
                          <div className="flex items-center gap-3" style={{ marginBottom: '0.85rem' }}>
                            <div
                              className="avatar"
                              style={{ width: '42px', height: '42px', fontSize: '0.9rem', flexShrink: 0 }}
                            >
                              {getInitials(s.student.name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontWeight: 700, fontSize: '0.92rem',
                                color: 'var(--text-main)', whiteSpace: 'nowrap',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {s.student.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.student.email}
                              </div>
                            </div>
                          </div>

                          {/* Roll no chip */}
                          <div style={{ marginBottom: '0.85rem' }}>
                            <span className="chip" style={{ fontSize: '0.72rem' }}>
                              Roll #{s.rollNo || '—'}
                            </span>
                          </div>

                          {/* Attendance progress bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              flex: 1, height: '6px', borderRadius: '999px',
                              background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${stats.rate}%`, height: '100%',
                                borderRadius: '999px',
                                background: rateColor(stats.rate),
                                transition: 'width 0.6s ease',
                              }} />
                            </div>
                            <span style={{
                              fontSize: '0.8rem', fontWeight: 700,
                              color: rateColor(stats.rate), minWidth: '38px', textAlign: 'right',
                            }}>
                              {stats.rate}%
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                            {stats.present}/{stats.total} classes attended
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Attendance ── */}
            {activeTab === 'Attendance' && (
              <div className="glass-panel card fade-in-up">
                <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3>Mark Attendance for Today</h3>
                  <span className="badge badge-info">{marked}/{total} marked</span>
                </div>
                {classData.students.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">🎒</div>
                    <p>No students enrolled yet.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {classData.students.map(s => (
                        <div
                          key={s.student._id}
                          className="flex items-center justify-between"
                          style={{
                            padding: '0.8rem 1rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.07)',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.72rem' }}>
                              {getInitials(s.student.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.student.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll: {s.rollNo}</div>
                            </div>
                          </div>
                          <div className="att-toggle-group">
                            <button
                              className={`att-pill present ${attendanceState[s.student._id] === 'present' ? 'active' : ''}`}
                              onClick={() => handleAttendanceChange(s.student._id, 'present')}
                            >✓ Present</button>
                            <button
                              className={`att-pill absent ${attendanceState[s.student._id] === 'absent' ? 'active' : ''}`}
                              onClick={() => handleAttendanceChange(s.student._id, 'absent')}
                            >✗ Absent</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <p className="text-muted text-sm" style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Step 1 notifies · Step 2 finalises</p>
                      <button
                        className="btn btn-secondary"
                        onClick={handleConfirmAttendance}
                        disabled={isConfirming || marked === 0}
                      >
                        {isConfirming ? '✓ Notified' : '1. Confirm & Notify'}
                      </button>
                      <button className="btn btn-primary" onClick={handleSubmitAttendance} disabled={!isConfirming}>
                        2. Submit Final
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Tab: History ── */}
            {activeTab === 'History' && (
              <div className="glass-panel card fade-in-up">
                <h3 style={{ marginBottom: '1.25rem' }}>Attendance History</h3>
                {attendanceRecords.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">📋</div>
                    <p>No attendance records yet.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Present</th>
                          <th>Absent</th>
                          <th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map(record => {
                          const presentCount = record.records.filter(r => r.status === 'present').length;
                          const absentCount = record.records.filter(r => r.status === 'absent').length;
                          const rate = record.records.length ? Math.round((presentCount / record.records.length) * 100) : 0;
                          return (
                            <tr key={record._id}>
                              <td>{new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                              <td><span className="badge badge-success">{presentCount}</span></td>
                              <td><span className="badge badge-danger">{absentCount}</span></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: `${rate}%`, height: '100%', borderRadius: '999px', background: rateColor(rate) }} />
                                  </div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '34px' }}>{rate}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Chat ── */}
            {activeTab === 'Chat' && (
              <div style={{ marginTop: '1rem' }}>
                <ClassChat classId={id} />
              </div>
            )}
          </>
        ) : (
          /* ── STUDENT VIEW ────────────────────────────────────────────── */
          <div className="glass-panel card fade-in-up">
            <h3 style={{ marginBottom: '1.25rem' }}>📊 My Attendance</h3>
            {studentAttendance.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">📋</div>
                <p>No attendance records yet.</p>
              </div>
            ) : (
              <>
                {(() => {
                  const present = studentAttendance.filter(r => r.status === 'present').length;
                  const tot = studentAttendance.length;
                  const pct = tot ? Math.round((present / tot) * 100) : 0;
                  return (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Total Classes', val: tot, color: 'var(--primary)' },
                        { label: 'Present', val: present, color: 'var(--success)' },
                        { label: 'Absent', val: tot - present, color: 'var(--danger)' },
                        { label: 'Attendance %', val: `${pct}%`, color: rateColor(pct) },
                      ].map(s => (
                        <div key={s.label} className="glass-panel" style={{ padding: '0.85rem 1.2rem', flex: '1 1 100px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {studentAttendance.map((record, index) => (
                        <tr key={index}>
                          <td>{new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>
                            <span className={`badge badge-${record.status === 'present' ? 'success' : record.status === 'absent' ? 'danger' : 'pending'}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STUDENT DETAIL MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {selectedStudent && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="glass-panel card fade-in-up"
            style={{ width: '100%', maxWidth: '620px', maxHeight: '88vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
              <div className="flex items-center gap-3">
                <div className="avatar" style={{ width: '46px', height: '46px', fontSize: '1.1rem' }}>
                  {getInitials(selectedStudent.name)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedStudent.name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    <span className="chip" style={{ fontSize: '0.7rem' }}>Roll #{selectedStudent.rollNo || '—'}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FiMail size={11} /> {selectedStudent.email}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ borderRadius: '50%', padding: '0.5rem', flexShrink: 0 }}
                onClick={() => setSelectedStudent(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Classes', val: selectedStudent.total, color: 'var(--primary)' },
                { label: 'Present', val: selectedStudent.present, color: 'var(--success)' },
                { label: 'Absent', val: selectedStudent.total - selectedStudent.present, color: 'var(--danger)' },
                { label: 'Rate', val: `${selectedStudent.rate}%`, color: rateColor(selectedStudent.rate) },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    flex: '1 1 80px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.15rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Attendance progress bar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <span>Attendance Rate</span>
                <span style={{ color: rateColor(selectedStudent.rate), fontWeight: 700 }}>{selectedStudent.rate}%</span>
              </div>
              <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  width: `${selectedStudent.rate}%`, height: '100%',
                  borderRadius: '999px', background: rateColor(selectedStudent.rate),
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            {/* Attendance history list */}
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              Session History
            </h4>
            {attendanceRecords.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem', borderRadius: '10px' }}>
                <div className="empty-state-icon" style={{ fontSize: '2rem' }}>📋</div>
                <p>No attendance sessions recorded yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
                {attendanceRecords.map((att, idx) => {
                  const rec = att.records.find(r => r.student && r.student._id === selectedStudent._id);
                  const status = rec ? rec.status : null;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.6rem 0.9rem',
                        background: 'rgba(0,0,0,0.15)',
                        border: `1px solid ${status === 'present' ? 'rgba(16,185,129,0.2)' : status === 'absent' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '8px',
                        borderLeft: `3px solid ${status === 'present' ? 'var(--success)' : status === 'absent' ? 'var(--danger)' : 'rgba(255,255,255,0.15)'}`,
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        {new Date(att.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      {status ? (
                        <span className={`badge badge-${status === 'present' ? 'success' : 'danger'}`}>
                          {status === 'present' ? '✓ Present' : '✗ Absent'}
                        </span>
                      ) : (
                        <span className="badge badge-pending">Not recorded</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Remove Student */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                className="btn btn-danger"
                style={{ width: '100%', gap: '0.5rem' }}
                onClick={() => openRemoveConfirm(selectedStudent._id, selectedStudent.name)}
              >
                <FiTrash2 size={15} /> Remove Student from Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          REMOVE STUDENT CONFIRMATION MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showRemoveConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '1rem',
          }}
        >
          <div
            className="glass-panel card fade-in-up"
            style={{ width: '100%', maxWidth: '420px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.85rem',
              }}>
                <FiAlertTriangle size={22} style={{ color: 'var(--danger)' }} />
              </div>
              <h3 style={{ marginBottom: '0.4rem' }}>Remove Student?</h3>
              <p style={{ fontSize: '0.88rem' }}>
                Are you sure you want to remove <strong style={{ color: 'var(--text-main)' }}>{pendingRemoveName}</strong> from this class?
                <br />This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                disabled={isRemoving}
                onClick={() => setShowRemoveConfirm(false)}
                style={{ flex: '1', minWidth: '100px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={isRemoving}
                onClick={confirmRemoveStudent}
                style={{ flex: '1', minWidth: '100px' }}
              >
                {isRemoving ? 'Removing…' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CLASS CONFIRMATION MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '1rem',
          }}
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="glass-panel card fade-in-up"
            style={{ width: '100%', maxWidth: '460px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <FiTrash2 size={24} style={{ color: 'var(--danger)' }} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Delete This Class?</h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                This will permanently delete <strong style={{ color: 'var(--text-main)' }}>{classData.className}</strong>,
                all its attendance records, and all join requests.
                <br />
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>This action cannot be undone.</span>
              </p>
            </div>

            {/* Type class name to confirm */}
            <div className="form-group">
              <label className="form-label">
                Type <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  {classData.className}
                </strong> to confirm
              </label>
              <input
                className="form-control"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={classData.className}
                disabled={isDeleting}
                style={{
                  borderColor: deleteConfirmText && deleteConfirmText !== classData.className
                    ? 'rgba(239,68,68,0.5)' : undefined,
                }}
              />
            </div>

            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                style={{ flex: '1', minWidth: '100px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={isDeleting || deleteConfirmText !== classData.className}
                onClick={handleDeleteClass}
                style={{ flex: '1', minWidth: '100px', opacity: deleteConfirmText !== classData.className ? 0.45 : 1 }}
              >
                {isDeleting ? 'Deleting…' : <><FiTrash2 size={14} /> Delete Class</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClassDetail;
