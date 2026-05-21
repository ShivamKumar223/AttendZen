import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import Navbar from '../components/Navbar';
import ClassCard from '../components/ClassCard';
import { FiPlus, FiLogIn, FiBell } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { unreadCount, addNotification } = useContext(NotificationContext);

  const [teachingClasses, setTeachingClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);

  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showJoinClass, setShowJoinClass] = useState(false);

  // NEW STATE
  const [activeSection, setActiveSection] = useState('teaching');

  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/classes');
      setTeachingClasses(res.data.teaching);
      setEnrolledClasses(res.data.enrolled);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/classes', { className, subject });

      setShowCreateClass(false);
      setClassName('');
      setSubject('');

      fetchClasses();

      addNotification(
        `Class "${className}" created successfully!`,
        'success'
      );
    } catch (error) {
      addNotification(
        error.response?.data?.message || 'Error creating class',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/requests', { classId: joinCode, rollNo });

      setShowJoinClass(false);
      setJoinCode('');
      setRollNo('');

      addNotification(
        'Join request sent! Wait for the teacher to accept.',
        'success'
      );
    } catch (error) {
      addNotification(
        error.response?.data?.message || 'Error joining class',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  const greetHour = new Date().getHours();

  const greeting =
    greetHour < 12
      ? 'Good morning'
      : greetHour < 17
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <>
      <Navbar />

      <div className="container">

        {/* Hero Banner */}
        <div className="hero-banner fade-in-up">
          <div
            className="flex items-center justify-between"
            style={{
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 className="heading-gradient">
                {greeting}, {firstName} 👋
              </h2>

              <p style={{ marginTop: '0.4rem' }}>
                {teachingClasses.length} class
                {teachingClasses.length !== 1 ? 'es' : ''}
                &nbsp;·&nbsp;
                {enrolledClasses.length} enrolled
              </p>
            </div>

            <div className="flex gap-3 flex-res">
              <button
                className="btn btn-secondary"
                onClick={() => setShowJoinClass(true)}
              >
                <FiLogIn size={15} />
                &nbsp;Join Class
              </button>

              <button
                className="btn btn-primary"
                onClick={() => setShowCreateClass(true)}
              >
                <FiPlus size={15} />
                &nbsp;Create Class
              </button>
            </div>
          </div>


        </div>

        {/* SECTION SWITCH BUTTONS */}
        <div
          className="flex gap-3 mt-6"
          style={{
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            className={`btn ${activeSection === 'teaching'
              ? 'btn-primary'
              : 'btn-secondary'
              }`}
            onClick={() => setActiveSection('teaching')}
          >
            Classes I Teach
          </button>

          <button
            className={`btn ${activeSection === 'enrolled'
              ? 'btn-primary'
              : 'btn-secondary'
              }`}
            onClick={() => setActiveSection('enrolled')}
          >
            Enrolled Classes
          </button>
        </div>

        {/* ── MODALS ───────────────────────────────────────────────────── */}

        {showCreateClass && (
          <div
            className="modal-overlay"
            onClick={() => setShowCreateClass(false)}
          >
            <div
              className="glass-panel card modal-box"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: '1.25rem' }}>
                ✦ Create New Class
              </h3>

              <form onSubmit={handleCreateClass}>
                <div className="form-group">
                  <label className="form-label">Class Name</label>

                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>

                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. Algebra"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary w-full"
                    onClick={() => setShowCreateClass(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showJoinClass && (
          <div
            className="modal-overlay"
            onClick={() => setShowJoinClass(false)}
          >
            <div
              className="glass-panel card modal-box"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: '1.25rem' }}>
                🔗 Join a Class
              </h3>

              <form onSubmit={handleJoinClass}>
                <div className="form-group">
                  <label className="form-label">Class Code</label>

                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. A1B2C3"
                    value={joinCode}
                    onChange={(e) =>
                      setJoinCode(e.target.value.toUpperCase())
                    }
                    required
                    style={{
                      letterSpacing: '0.15em',
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Roll Number</label>

                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. 101"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary w-full"
                    onClick={() => setShowJoinClass(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? 'Sending…' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── TEACHING CLASSES ───────────────────────────────────────── */}

        {activeSection === 'teaching' && (
          <div className="mt-8">

            <div className="section-header">
              <h3>Classes I Teach</h3>

              {teachingClasses.length > 0 && (
                <span className="section-count">
                  {teachingClasses.length}
                </span>
              )}
            </div>

            {teachingClasses.length === 0 ? (
              <div className="empty-state">

                <div className="empty-state-icon">🏫</div>

                <p>You haven't created any classes yet.</p>

                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateClass(true)}
                >
                  <FiPlus size={14} />
                  &nbsp;Create your first class
                </button>

              </div>
            ) : (
              <div className="grid grid-cols-1 grid-cols-md-3">
                {teachingClasses.map((cls, i) => (
                  <ClassCard
                    key={cls._id}
                    classData={cls}
                    isTeacher={true}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ENROLLED CLASSES ──────────────────────────────────────── */}

        {activeSection === 'enrolled' && (
          <div className="mt-8">

            <div className="section-header">
              <h3>Classes I'm Enrolled In</h3>

              {enrolledClasses.length > 0 && (
                <span className="section-count">
                  {enrolledClasses.length}
                </span>
              )}
            </div>

            {enrolledClasses.length === 0 ? (
              <div className="empty-state">

                <div className="empty-state-icon">🎒</div>

                <p>You are not enrolled in any classes.</p>

                <button
                  className="btn btn-secondary"
                  onClick={() => setShowJoinClass(true)}
                >
                  <FiLogIn size={14} />
                  &nbsp;Join a class
                </button>

              </div>
            ) : (
              <div className="grid grid-cols-1 grid-cols-md-3">
                {enrolledClasses.map((cls, i) => (
                  <ClassCard
                    key={cls._id}
                    classData={cls}
                    isTeacher={false}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
};

export default Dashboard;