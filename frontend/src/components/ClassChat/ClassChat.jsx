import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';

import "./chat.css";
import { IoDocumentAttachOutline } from "react-icons/io5";
// Simple WhatsApp-like chat UI.
// Uses REST (scalable, works with/without socket). Can be upgraded later to full socket streaming.

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN');
};

const getFileKindLabel = (msg) => {
  if (msg.mediaType === 'pdf') return 'PDF';
  if (msg.mediaType === 'image') return 'Image';
  return '';
};

const isWithinDeleteWindow = (createdAt) => {
  if (!createdAt) return false;
  const diffSec = (Date.now() - new Date(createdAt).getTime()) / 1000;
  return diffSec <= 5;
};

const ClassChat = ({ classId }) => {
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);

  const [group, setGroup] = useState(null);
  const groupId = group?._id;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  const [blockedSet, setBlockedSet] = useState(() => new Set());

  const listRef = useRef(null);

  // const allowedFileHint = useMemo(() => 'Upload: images (jpg/png/webp/gif) or PDF (max 10MB).', []);

  useEffect(() => {
    if (!classId) return;

    const init = async () => {
      try {
        const res = await axios.get(`/chat/groups/${classId}`);
        const g = res.data.group || res.data;
        setGroup(g);
      } catch (e) {
        console.error(e);
        addNotification('Chat init failed', 'error');
      }
    };

    init();
  }, [classId, addNotification]);

  useEffect(() => {
    if (!groupId) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/chat/groups/${groupId}/messages?page=1&limit=50`);
        // backend returns { messages, page, limit }
        setMessages(res.data.messages || []);
      } catch (e) {
        console.error(e);
        addNotification('Failed to load messages', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [groupId, addNotification]);

  useEffect(() => {
    if (!group) return;
    setBlockedSet(new Set(group.blockedStudents || []));
  }, [group]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const refreshGroup = async () => {
    try {
      const res = await axios.get(`/chat/groups/${classId}`);
      const g = res.data.group || res.data;
      setGroup(g);
      setBlockedSet(new Set(g.blockedStudents || []));
    } catch (e) {
      console.error(e);
    }
  };

  const onPickFile = (f) => {
    if (!f) {
      setFile(null);
      setFilePreviewUrl(null);
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setFilePreviewUrl(url);
  };

  const handleSend = async () => {
    if (!groupId) return;
    if (sending) return;

    const hasText = text.trim().length > 0;
    if (!hasText && !file) {
      addNotification('Type a message or attach a file', 'error');
      return;
    }

    // Client-side hint: if blocked, API will enforce too.
    if (blockedSet.has(user._id)) {
      addNotification('You are blocked from sending messages in this group', 'error');
      return;
    }

    setSending(true);
    try {
      const form = new FormData();
      form.append('content', text.trim());
      if (file) form.append('file', file);

      const res = await axios.post(`/chat/groups/${groupId}/messages`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Append locally for responsiveness
      const msg = res.data.message;
      setMessages(prev => [msg, ...prev].sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt)));

      setText('');
      setFile(null);
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    } catch (e) {
      console.error(e);
      addNotification(e.response?.data?.error || 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    if (!groupId) return;
    try {
      await axios.delete(`/chat/groups/${groupId}/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (e) {
      addNotification(e.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const isTeacher = useMemo(() => {
    // backend stores teacher role in JWT? Not guaranteed.
    // We detect via user.role OR user.isTeacher (same logic as backend).
    return user?.role === 'teacher' || user?.isTeacher === true;
  }, [user]);

  const [selectedStudentToBlock, setSelectedStudentToBlock] = useState('');

  // Note: we don't have students list in this component.
  // We'll block by entering studentId manually (server expects studentId).
  // In next iteration we can pass classData.students.

  const handleBlock = async () => {
    if (!isTeacher) {
      addNotification('Only teacher can block', 'error');
      return;
    }
    if (!selectedStudentToBlock) {
      addNotification('Select studentId', 'error');
      return;
    }
    try {
      await axios.post(`/chat/groups/${groupId}/block`, { studentId: selectedStudentToBlock });
      await refreshGroup();
      addNotification('Student blocked', 'success');
    } catch (e) {
      console.error(e);
      addNotification(e.response?.data?.error || 'Block failed', 'error');
    }
  };

  return (
    <div className="glass-panel card fade-in-up" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0 }}>💬 Class Chat</h3>
            <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
              {loading ? 'Loading…' : `${messages.length} messages`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isTeacher && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="form-control"
                  style={{ width: 260 }}
                  placeholder="StudentId to block"
                  value={selectedStudentToBlock}
                  onChange={(e) => setSelectedStudentToBlock(e.target.value)}
                />
                <button className="btn btn-danger" onClick={handleBlock} disabled={!groupId}>
                  Block
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        style={{
          height: '58vh',
          overflowY: 'auto',
          padding: '1rem 1rem 0.5rem 1rem',
          background: 'rgba(0,0,0,0.12)',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading chat…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No messages yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {messages
              .slice()
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((m) => {
                const mine = m.sender?.toString?.() === user?._id?.toString?.() || m.sender === user?._id;
                const canDelete = mine && isWithinDeleteWindow(m.createdAt);

                return (
                  <div
                    key={m._id}
                    style={{
                      display: 'flex',
                      justifyContent: mine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '72%',
                        padding: '0.7rem 0.85rem',
                        borderRadius: 14,
                        background: mine ? 'rgba(99,102,241,0.20)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', color: 'rgba(148,163,184,0.9)', fontWeight: 700 }}>
                        {mine ? 'You' : m.senderName || 'Student'}
                        <span style={{ marginLeft: '0.5rem', fontWeight: 600, color: 'rgba(148,163,184,0.7)' }}>
                          · {timeAgo(m.createdAt)}
                        </span>
                      </div>

                      {m.content && (
                        <div style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {m.content}
                        </div>
                      )}

                      {m.mediaUrl && (
                        <div style={{ marginTop: '0.55rem' }}>
                          {m.mediaType === 'image' && (
                            <img
                              src={m.mediaUrl}
                              alt={m.originalFileName || 'image'}
                              style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}
                            />
                          )}
                          {m.mediaType === 'pdf' && (
                            <a
                              href={m.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: 'var(--text-main)',
                                textDecoration: 'none',
                                background: 'rgba(0,0,0,0.18)',
                              }}
                            >
                              <span style={{ fontWeight: 800 }}>📄</span>
                              {getFileKindLabel(m)}
                              {m.originalFileName ? (
                                <span style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 600 }}>· {m.originalFileName}</span>
                              ) : null}
                            </a>
                          )}
                        </div>
                      )}

                      {/* {canDelete && (
                        <div style={{ marginTop: '0.55rem', textAlign: mine ? 'right' : 'left' }}>
                          <button className="btn btn-ghost" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }} onClick={() => handleDelete(m._id)}>
                            Delete
                          </button>
                        </div>
                      )} */}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div style={{ padding: '0.9rem 1rem', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}>
            <label className="form-label" style={{ display: 'none', marginBottom: '0.4rem' }}>
              Message
            </label>
            <textarea
              className="form-control"
              style={{ minHeight: 44, resize: 'vertical', width: '100%' }}
              placeholder={blockedSet.has(user?._id) ? 'You are blocked' : 'Type your message…'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={blockedSet.has(user?._id)}
            />
          </div>

               {/* <div  style={{ flex: '0 0 auto' }}>
            <label name="file" className="form-label">
              <IoDocumentAttachOutline />
            </label>
            <input
            name="file"
               className='chat-file'
              type="file"
              accept="image/*,application/pdf"
              // className="form-control"
              style={{ padding: '0.45rem 0.8rem' }}
              disabled={blockedSet.has(user?._id)}
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {allowedFileHint}
            </div>
          </div> */}

          <button className="btn btn-primary" onClick={handleSend} disabled={sending || blockedSet.has(user?._id) || !groupId}>
            {sending ? 'Sending…' : 'Send ➤'}
          </button>

          {/* <div  style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filePreviewUrl && filePreviewUrl.startsWith('blob:') && file?.type?.startsWith('image/') && (
              <img
                src={filePreviewUrl}
                alt="preview"
                style={{ width: 90, height: 70, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)' }}
              />
            )}
            {filePreviewUrl && file?.type === 'application/pdf' && (
              <div style={{ width: 90, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.15)' }}>
                📄
              </div>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ClassChat;

