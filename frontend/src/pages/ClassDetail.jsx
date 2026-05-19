import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import Navbar from '../components/Navbar';
import { FiArrowLeft, FiCheck, FiX, FiUsers, FiCalendar, FiClock } from 'react-icons/fi';

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const TABS = ['Requests', 'Enrolled', 'Attendance', 'History'];

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);

  const [classData, setClassData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState('Requests');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);

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

  const fetchClassDetails = async () => {
    try {
      const res = await axios.get('/classes');
      const all = [...res.data.teaching, ...res.data.enrolled];
      const cls = all.find(c => c._id === id);
      setClassData(cls);
    } catch (err) { console.error(err); }
  };

  const fetchRequests = async () => {
    try { const res = await axios.get(`/requests/${id}`); setRequests(res.data); } catch (err) { }
  };

  const fetchAttendanceHistory = async () => {
    try { const res = await axios.get(`/attendance/class/${id}`); setAttendanceRecords(res.data); } catch (err) { }
  };

  const fetchStudentAttendance = async () => {
    try { const res = await axios.get(`/attendance/student/${id}`); setStudentAttendance(res.data); } catch (err) { }
  };

  const handleRequestResponse = async (reqId, status) => {
    try {
      await axios.put(`/requests/${reqId}`, { status });
      fetchRequests(); fetchClassDetails();
      addNotification(`Request ${status} successfully.`, status === 'accepted' ? 'success' : 'error');
    } catch (err) { addNotification('Error updating request', 'error'); }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student?")) return;
    try {
      await axios.delete(`/classes/${id}/students/${studentId}`);
      addNotification('Student removed successfully.', 'success');
      fetchClassDetails();
    } catch (err) { addNotification('Error removing student', 'error'); }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleConfirmAttendance = async () => {
    try {
      const records = Object.keys(attendanceState)
        .filter(id => attendanceState[id])
        .map(studentId => ({ studentId, status: attendanceState[studentId] }));
      await axios.post('/attendance/notify', { classId: id, date: new Date(), records });
      setIsConfirming(true);
      addNotification('Notifications sent to students! Submit to finalise.', 'info');
    } catch (err) { addNotification('Error notifying students', 'error'); }
  };

  const handleSubmitAttendance = async () => {
    try {
      const records = Object.keys(attendanceState)
        .filter(id => attendanceState[id])
        .map(studentId => ({ studentId, status: attendanceState[studentId] }));
      await axios.post('/attendance/submit', { classId: id, date: new Date(), records });
      setIsConfirming(false);
      addNotification('Attendance submitted successfully!', 'success');
      fetchAttendanceHistory();
    } catch (err) { addNotification('Error submitting attendance', 'error'); }
  };

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

  return (
    <>
      <Navbar />
      <div className="container">

        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-4 fade-in-up">
          <button className="btn btn-ghost" style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }} onClick={() => navigate('/dashboard')}>
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2 className="heading-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>{classData.className}</h2>
            <p style={{ fontSize: '0.85rem', marginTop: '0.1rem' }}>
              {classData.subject} &nbsp;·&nbsp;
              <span style={{ color: 'var(--primary)' }}>
                {isTeacher ? 'You are teaching this class' : `Teacher: ${classData.teacher.name}`}
              </span>
            </p>
          </div>
        </div>

        {/* ── TEACHER VIEW ─────────────────────────────────────────────────── */}
        {isTeacher ? (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 grid-cols-md-3 mb-4" style={{ gap: '1rem' }}>
              {[
                { icon: <FiUsers />, label: 'Students', value: classData.students.length },
                { icon: <FiClock />, label: 'Pending Requests', value: requests.length },
                { icon: <FiCalendar />, label: 'Attendance Sessions', value: attendanceRecords.length },
              ].map(stat => (
                <div key={stat.label} className="glass-panel" style={{ padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                      <div key={req._id} className="flex-res flex items-center justify-between" style={{ padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-3">
                          <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '0.75rem' }}>
                            {getInitials(req.student.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.student.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.student.email} &bull; Roll: {req.rollNo}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn btn-success" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', gap: '0.3rem' }} onClick={() => handleRequestResponse(req._id, 'accepted')}>
                            <FiCheck size={13} /> Accept
                          </button>
                          <button className="btn btn-danger" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', gap: '0.3rem' }} onClick={() => handleRequestResponse(req._id, 'rejected')}>
                            <FiX size={13} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Enrolled ── */}
            {activeTab === 'Enrolled' && (
              <div className="glass-panel card fade-in-up">
                <h3 style={{ marginBottom: '1.25rem' }}>Enrolled Students</h3>
                {classData.students.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">🎒</div>
                    <p>No students enrolled yet.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Roll No</th>
                          <th>Attendance</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classData.students.map(s => {
                          let present = 0;
                          let total = attendanceRecords.length;
                          attendanceRecords.forEach(record => {
                            const r = record.records.find(rc => rc.student && rc.student._id === s.student._id);
                            if (r && r.status === 'present') present++;
                          });
                          const rate = total ? Math.round((present / total) * 100) : 0;

                          return (
                            <tr key={s.student._id}>
                              <td
                                onClick={() => setSelectedStudentForModal({ ...s.student, rollNo: s.rollNo, rate, present, total: attendanceRecords.length })}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '0.7rem' }}>
                                    {getInitials(s.student.name)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.student.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.student.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{s.rollNo || '-'}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: `${rate}%`, height: '100%', borderRadius: '999px', background: rate >= 75 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '34px' }}>{rate}%</span>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-ghost"
                                  style={{ color: 'var(--danger)', padding: '0.3rem', fontSize: '0.8rem' }}
                                  onClick={() => handleRemoveStudent(s.student._id)}
                                >
                                  Remove
                                </button>
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
                        <div key={s.student._id} className="flex items-center justify-between" style={{ padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
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
                      <p className="text-muted text-sm" style={{ alignSelf: 'center' }}>Step 1 notifies · Step 2 finalises</p>
                      <button className="btn btn-secondary" onClick={handleConfirmAttendance} disabled={isConfirming || marked === 0}>
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
                                    <div style={{ width: `${rate}%`, height: '100%', borderRadius: '999px', background: rate >= 75 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
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
          </>
        ) : (
          /* ── STUDENT VIEW ──────────────────────────────────────────────── */
          <div className="glass-panel card fade-in-up">
            <h3 style={{ marginBottom: '1.25rem' }}>📊 My Attendance</h3>
            {studentAttendance.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">📋</div>
                <p>No attendance records yet.</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                {(() => {
                  const present = studentAttendance.filter(r => r.status === 'present').length;
                  const total = studentAttendance.length;
                  const pct = total ? Math.round((present / total) * 100) : 0;
                  return (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Total Classes', val: total, color: 'var(--primary)' },
                        { label: 'Present', val: present, color: 'var(--success)' },
                        { label: 'Absent', val: total - present, color: 'var(--danger)' },
                        { label: 'Attendance %', val: `${pct}%`, color: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' },
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

      {/* ── STUDENT DETAIL MODAL ─────────────────────────────────────── */}
      {selectedStudentForModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setSelectedStudentForModal(null)}
        >
          <div
            className="glass-panel card fade-in-up"
            style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
              <div className="flex items-center gap-3">
                <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                  {getInitials(selectedStudentForModal.name)}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedStudentForModal.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Roll: {selectedStudentForModal.rollNo || '-'} &bull; {selectedStudentForModal.email}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ borderRadius: '50%', padding: '0.5rem' }}
                onClick={() => setSelectedStudentForModal(null)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Classes', val: selectedStudentForModal.total, color: 'var(--primary)' },
                { label: 'Present', val: selectedStudentForModal.present, color: 'var(--success)' },
                { label: 'Absent', val: selectedStudentForModal.total - selectedStudentForModal.present, color: 'var(--danger)' },
                { label: 'Rate', val: `${selectedStudentForModal.rate}%`, color: selectedStudentForModal.rate >= 75 ? 'var(--success)' : selectedStudentForModal.rate >= 50 ? 'var(--warning)' : 'var(--danger)' },
              ].map(s => (
                <div key={s.label} className="glass-panel" style={{ padding: '0.85rem 1.2rem', flex: '1 1 100px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="table-container">
              <table className="table">
                <thead><tr><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {attendanceRecords.map((att, idx) => {
                    const rec = att.records.find(r => r.student && r.student._id === selectedStudentForModal._id);
                    const status = rec ? rec.status : 'pending';
                    return (
                      <tr key={idx}>
                        <td>{new Date(att.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td>
                          <span className={`badge badge-${status === 'present' ? 'success' : status === 'absent' ? 'danger' : 'pending'}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', padding: '1rem' }}>No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ClassDetail;
