import { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { MessageSquare, Eye, Clock, CheckCircle, Filter, Shield, UserCheck, BookOpen, X, Code, Send, Search, Paperclip, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forum as forumApi } from '../services/api';
import '../styles/forum.css';

export default function DiscussionForum() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', body: '', tags: '', code_snippet: '', channel: 'general' });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isStudent = user?.role === 'student';
  const isMentor = user?.role === 'mentor';
  const isAdmin = user?.role === 'admin';

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'resolved') params.status = 'resolved';
      if (filter === 'unresolved') params.status = 'unresolved';
      if (filter === 'verified') params.verified = 'true';
      if (filter === 'unverified') params.verified = 'false';
      if (filter === 'my') { params.author_id = user?._id; }
      if (search) params.search = search;
      const data = await forumApi.threads(params);
      setThreads(data);
    } catch (e) { setThreads([]); }
    setLoading(false);
  };

  useEffect(() => { fetchThreads(); }, [filter, search]);

  const handleVerify = async (id) => {
    await forumApi.verifyThread(id);
    fetchThreads();
  };

  const handleCreateThread = async () => {
    if (!newThread.title.trim() || !newThread.body.trim()) return;
    setCreating(true);
    try {
      const tags = newThread.tags.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        title: newThread.title,
        body: newThread.body,
        tags,
        code_snippet: newThread.code_snippet,
        channel: newThread.channel,
      };
      if (attachment) {
        payload.attachment_url = attachment.url;
        payload.attachment_name = attachment.name;
      }
      await forumApi.createThread(payload);
      setShowModal(false);
      setNewThread({ title: '', body: '', tags: '', code_snippet: '', channel: 'general' });
      setAttachment(null);
      fetchThreads();
    } catch (e) {
      alert(e.message);
    }
    setCreating(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10 MB'); return; }
    setUploading(true);
    try {
      const result = await forumApi.uploadFile(file);
      setAttachment(result);
    } catch (e) { alert('Upload failed'); }
    setUploading(false);
  };

  const handleModerate = async (id) => {
    if (!window.confirm('Delete this thread?')) return;
    try {
      await forumApi.deleteThread(id);
      fetchThreads();
    } catch (e) {
      alert(e.message);
    }
  };

function CodeBlock({ code, language }) {
  const highlighted = language
    ? hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : hljs.highlightAuto(code).value
    : hljs.highlightAuto(code).value;
  return (
    <pre style={{ background: '#1e1e2e', borderRadius: 6, padding: 12, overflow: 'auto', fontSize: 12, margin: '8px 0' }}>
      <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Interactive Discussion Forum</h1>
          <p className="page-subtitle">
            {isStudent && 'Ask questions, collaborate with peers, and get mentor-verified answers'}
            {isMentor && 'Review student queries, provide verified responses, and track discussions'}
            {isAdmin && 'Moderate discussions, manage content, and oversee platform interactions'}
          </p>
        </div>
        {isStudent && <button className="btn-primary" onClick={() => setShowModal(true)}><MessageSquare size={16} /> New Thread</button>}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 24, width: 560, maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Create New Thread</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Title</label>
              <input type="text" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }} placeholder="Thread title..." value={newThread.title} onChange={e => setNewThread(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Body</label>
              <textarea style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, minHeight: 100, resize: 'vertical' }} placeholder="Describe your problem..." value={newThread.body} onChange={e => setNewThread(p => ({ ...p, body: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tags (comma-separated)</label>
              <input type="text" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }} placeholder="#ReactJS, #WebHooks" value={newThread.tags} onChange={e => setNewThread(p => ({ ...p, tags: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Code Snippet (optional)</label>
              <textarea style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace', minHeight: 80, resize: 'vertical' }} placeholder="Paste your code here... (syntax highlighting supported)" value={newThread.code_snippet} onChange={e => setNewThread(p => ({ ...p, code_snippet: e.target.value }))} />
              {newThread.code_snippet && (
                <div style={{ marginTop: 8, borderRadius: 6, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: 12 }}><code className="hljs" dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(newThread.code_snippet).value }} /></pre>
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Attachment (optional, max 10 MB)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Paperclip size={14} /> {attachment ? 'Change File' : 'Choose File'}
                  <input type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
                </label>
                {uploading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Uploading...</span>}
                {attachment && (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{attachment.name}</span>
                    <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-light)' }}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Channel</label>
              <select style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }} value={newThread.channel} onChange={e => setNewThread(p => ({ ...p, channel: e.target.value }))}>
                <option value="general">General Discussion</option>
                <option value="code_review">Code Review</option>
                <option value="project_tracking">Project Tracking</option>
              </select>
            </div>
            <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 13, width: '100%' }} onClick={handleCreateThread} disabled={creating || uploading}>
              {creating ? 'Creating...' : <><Send size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Create Thread</>}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 14px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input type="text" placeholder="Search threads by keyword, author, or tag..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--text-primary)' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>}
        </div>
      </div>

      <div className="forum-layout">
        <div className="forum-sidebar">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Filters</h3>
          <button className={`forum-filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}><Filter size={15} /> All Threads <span className="count">{threads.length}</span></button>
          <button className={`forum-filter-btn${filter === 'unresolved' ? ' active' : ''}`} onClick={() => setFilter('unresolved')}><MessageSquare size={15} /> Unresolved</button>
          <button className={`forum-filter-btn${filter === 'resolved' ? ' active' : ''}`} onClick={() => setFilter('resolved')}><CheckCircle size={15} /> Resolved</button>
          {isStudent && <button className={`forum-filter-btn${filter === 'my' ? ' active' : ''}`} onClick={() => setFilter('my')}><Clock size={15} /> My Threads</button>}

          {(isMentor || isAdmin) && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 14px', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                <Shield size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {isMentor ? 'Mentor Tools' : 'Admin Tools'}
              </h3>
              {isMentor && (
                <button className={`forum-filter-btn${filter === 'unverified' ? ' active' : ''}`} onClick={() => setFilter('unverified')}>
                  <UserCheck size={15} /> Pending Review <span className="count">{threads.length}</span>
                </button>
              )}
              {isAdmin && (
                <button className="forum-filter-btn" style={{ color: 'var(--danger-light)' }}><Shield size={15} /> Flagged Content</button>
              )}
            </div>
          )}
        </div>

        <div className="forum-main">
          {loading ? (
            <p className="forum-empty">Loading...</p>
          ) : threads.length === 0 ? (
            <p className="forum-empty">No threads found</p>
          ) : threads.map(t => {
            const author = t.author_id || {};
            const initials = (author.name || '?')[0];
            const colors = ['#7030e0', '#00c853', '#2196f3', '#ff9800'];
            const colorIdx = (initials.charCodeAt(0) || 0) % colors.length;
            return (
              <div key={t._id} className="forum-thread">
                <div className="thread-header">
                  <div className="thread-author">
                    <div className="thread-avatar" style={{ background: colors[colorIdx] }}>{initials}</div>
                    <div className="thread-author-info">
                      <h4>{author.name || 'Unknown'}</h4>
                      <span>{author.role || 'student'}</span>
                    </div>
                  </div>
                  <div className="thread-tags">
                    {(t.tags || []).slice(0, 2).map((tag, i) => (
                      <span key={i} className="thread-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <h3 className="thread-title">{t.title}</h3>
                <p className="thread-preview">{(t.body || '').substring(0, 120)}{(t.body || '').length > 120 ? '...' : ''}</p>
                {t.code_snippet && <CodeBlock code={t.code_snippet} />}
                <div className="thread-meta">
                  <span className={`thread-lang-badge ${t.language || 'en'}`}>{(t.language || 'EN').toUpperCase()}</span>
                  <span className="thread-meta-item"><MessageSquare size={14} /> {t.reply_count || 0} replies</span>
                  <span className="thread-meta-item"><Clock size={14} /> {new Date(t.created_at).toLocaleDateString()}</span>
                  {t.verified && <span className="verified-badge"><CheckCircle size={12} /> Mentor Verified</span>}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    {(isMentor || isAdmin) && !t.verified && (
                      <button className="action-btn" style={{ padding: '3px 10px', fontSize: 11, background: 'rgba(0,200,83,0.15)', color: 'var(--success)' }} onClick={() => handleVerify(t._id)}>
                        <CheckCircle size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} /> Verify
                      </button>
                    )}
                    {isAdmin && (
                      <button className="action-btn" style={{ padding: '3px 10px', fontSize: 11, background: 'rgba(255,68,68,0.15)', color: 'var(--danger-light)' }} onClick={() => handleModerate(t._id)}>
                        <Shield size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} /> Moderate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
