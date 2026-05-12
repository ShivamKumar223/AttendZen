import React, { useState } from 'react';
import { FiUsers, FiCopy, FiCheck, FiBook } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Rotate through accent colours for the top strip
const ACCENTS = [
  'linear-gradient(90deg,#6366f1,#8b5cf6)',
  'linear-gradient(90deg,#ec4899,#f97316)',
  'linear-gradient(90deg,#06b6d4,#6366f1)',
  'linear-gradient(90deg,#10b981,#06b6d4)',
  'linear-gradient(90deg,#f59e0b,#ef4444)',
];

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const ClassCard = ({ classData, isTeacher, index = 0 }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const accent = ACCENTS[index % ACCENTS.length];

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(classData.classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="glass-panel card fade-in-up"
      onClick={() => navigate(`/class/${classData._id}`)}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem', animationDelay: `${index * 0.06}s` }}
    >
      {/* Coloured accent strip */}
      <div style={{ height: '4px', borderRadius: '999px', background: accent }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {classData.className}
          </h3>
          <span className="chip">
            <FiBook size={11} /> {classData.subject}
          </span>
        </div>
      </div>

      {/* Teacher info */}
      <div className="flex items-center gap-2" style={{ marginTop: '0.25rem' }}>
        <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '0.72rem' }}>
          {getInitials(classData.teacher?.name)}
        </div>
        <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          {isTeacher ? 'You (Teacher)' : classData.teacher?.name}
        </span>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          <FiUsers size={14} />
          <span>{classData.students?.length || 0} student{classData.students?.length !== 1 ? 's' : ''}</span>
        </div>

        {isTeacher && (
          <button
            className="btn btn-secondary"
            onClick={handleCopyCode}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem', gap: '0.4rem' }}
          >
            {copied ? <><FiCheck size={13} style={{ color: 'var(--success)' }} /> Copied!</> : <><FiCopy size={13} /> {classData.classCode}</>}
          </button>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
