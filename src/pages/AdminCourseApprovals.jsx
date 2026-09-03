import { useState, useEffect } from 'react';
import { Shield, BookOpen, CheckCircle, XCircle, Clock, Search, FileText, Target, Film, Headphones, Image, FolderOpen, Upload, ChevronDown, ChevronUp, X } from 'lucide-react';
import { courses } from '../services/api';
import '../styles/admin.css';

export default function AdminCourseApprovals() {
  const [allCourses, setAllCourses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);


  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const list = await courses.list({});
      setAllCourses(Array.isArray(list) ? list : []);
    } catch (e) { setAllCourses([]); }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    await courses.approve(id);
    setSelected(null); setDetail(null);
    loadCourses();
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    await courses.reject(id, reason || 'Not approved');
    setSelected(null); setDetail(null);
    loadCourses();
  };

  const viewDetail = async (c) => {
    setSelected(c._id);
    try {
      const data = await courses.get(c._id);
      setDetail(data);
    } catch (e) { setDetail(null); }
  };

  const statusColor = (s) => {
    if (s === 'approved') return { bg: 'rgba(0,200,83,0.15)', color: '#00c853' };
    if (s === 'pending') return { bg: 'rgba(255,152,0,0.15)', color: '#ff9800' };
    if (s === 'rejected') return { bg: 'rgba(255,68,68,0.15)', color: '#ff4444' };
    return { bg: 'rgba(112,48,224,0.15)', color: '#7030e0' };
  };

  const filtered = allCourses.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search && !c.title?.toLowerCase().includes(search.toLowerCase()) && !c.mentor_id?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Approvals</h1>
          <p className="page-subtitle">Review, approve, or reject courses submitted by mentors — view full details</p>
        </div>
      </div>

      <div className="admin-stats" style={{ marginBottom: 16 }}>
        <div className="admin-stat"><h4>{allCourses.length}</h4><p>Total Courses</p></div>
        <div className="admin-stat"><h4>{allCourses.filter(c => c.status === 'approved').length}</h4><p>Approved</p></div>
        <div className="admin-stat"><h4>{allCourses.filter(c => c.status === 'pending').length}</h4><p>Pending</p></div>
        <div className="admin-stat"><h4>{allCourses.filter(c => c.status === 'rejected').length}</h4><p>Rejected</p></div>
        <div className="admin-stat"><h4>{allCourses.filter(c => c.status === 'draft').length}</h4><p>Drafts</p></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'pending', 'approved', 'rejected', 'draft'].map(f => (
          <button key={f} className={`action-btn ${filter === f ? 'btn-primary' : ''}`}
            style={filter === f ? { padding: '6px 14px', fontSize: 12 } : { fontSize: 12 }}
            onClick={() => { setFilter(f); setSelected(null); setDetail(null); }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search courses or mentors..." style={{ padding: '6px 12px 6px 30px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 12, width: 220 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {selected && detail ? (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><BookOpen size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> {detail.course?.title}</h3>
            <button className="action-btn" onClick={() => { setSelected(null); setDetail(null); }}>← Back</button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{detail.course?.description}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: statusColor(detail.course?.status).bg, color: statusColor(detail.course?.status).color, fontWeight: 500 }}>
                {detail.course?.status?.charAt(0).toUpperCase() + detail.course?.status?.slice(1)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Level: {detail.course?.level}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Category: {detail.course?.category}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Language: {detail.course?.language || 'English'}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mentor: {detail.course?.mentor_id?.name || 'Unknown'}</span>
              {detail.course?.status === 'rejected' && detail.course?.rejection_reason && (
                <span style={{ fontSize: 11, color: '#ff4444' }}>Reason: {detail.course.rejection_reason}</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {detail.course?.status === 'pending' && (
              <>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, background: 'var(--success)' }} onClick={() => handleApprove(detail.course._id)}>
                  <CheckCircle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Approve
                </button>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, background: 'var(--danger)' }} onClick={() => handleReject(detail.course._id)}>
                  <XCircle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Reject
                </button>
              </>
            )}
            {detail.course?.status === 'draft' && (
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => handleApprove(detail.course._id)}>
                <CheckCircle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Approve Directly
              </button>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, marginBottom: 8, color: 'var(--accent-light)' }}>
              <Upload size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Resources ({detail.resources?.length || 0})
            </h4>
            {(!detail.resources || detail.resources.length === 0) ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No resources.</p>
            ) : (() => {
              const grouped = {};
              detail.resources.forEach(r => {
                const key = r.module_number || 1;
                if (!grouped[key]) grouped[key] = { title: r.module_title || `Module ${key}`, items: [] };
                grouped[key].items.push(r);
              });
              return Object.entries(grouped).map(([key, mod]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <h5 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 4 }}>
                    <FolderOpen size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {mod.title}
                  </h5>
                  {mod.items.map(r => {
                    const ext = (r.file_type || r.title?.split('.').pop() || '').toLowerCase();
                    const icon = ['mp4', 'webm', 'mov'].includes(ext) ? <Film size={16} style={{ color: '#2196f3' }} /> :
                      ['mp3', 'wav'].includes(ext) ? <Headphones size={16} style={{ color: '#ff9800' }} /> :
                      ['jpg', 'jpeg', 'png', 'gif'].includes(ext) ? <Image size={16} style={{ color: '#00c853' }} /> :
                      <FileText size={16} style={{ color: 'var(--accent-light)' }} />;
                    const fileUrl = r.file_url ? (r.file_url.startsWith('http') ? r.file_url : `http://localhost:5000${r.file_url}`) : '';
                    return (
                      <div key={r._id} className="resource-list-item" style={{ cursor: 'pointer' }} onClick={() => setPreviewMedia({ ...r, full_url: fileUrl, ext })}>
                        {icon}
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{r.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8, textTransform: 'uppercase' }}>{ext}</span>
                        {r.file_size ? <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>{(r.file_size / 1024 / 1024).toFixed(1)} MB</span> : null}
                        {fileUrl && (
                          <button
                            className="action-btn"
                            style={{ background: 'rgba(112,48,224,0.15)', color: 'var(--accent-light)', padding: '4px 10px', fontSize: 12 }}
                            onClick={(e) => { e.stopPropagation(); setPreviewMedia({ ...r, full_url: fileUrl, ext }); }}
                          >
                            {['mp4', 'webm', 'mov'].includes(ext) ? '▶ Play Video' : '👁 View File'}
                          </button>
                        )}
                      </div>
                    );
                  })}

                </div>
              ));
            })()}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, marginBottom: 8, color: '#ff9800' }}>
              <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Assignments ({detail.assignments?.length || 0})
            </h4>
            {(!detail.assignments || detail.assignments.length === 0) ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No assignments.</p>
            ) : detail.assignments.map(a => (
              <div key={a._id} className="resource-list-item">
                <FileText size={16} style={{ color: '#ff9800' }} />
                <span style={{ flex: 1, fontSize: 13 }}>{a.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.total_points} pts</span>
                {a.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due: {new Date(a.due_date).toLocaleDateString()}</span>}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, marginBottom: 8, color: '#2196f3' }}>
              <Target size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Quizzes ({detail.quizzes?.length || 0})
            </h4>
            {(!detail.quizzes || detail.quizzes.length === 0) ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No quizzes.</p>
            ) : detail.quizzes.map(q => (
              <div key={q._id} className="resource-list-item">
                <Target size={16} style={{ color: '#2196f3' }} />
                <span style={{ flex: 1, fontSize: 13 }}>{q.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.questions?.length || 0} questions · {q.time_limit_minutes} min</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><BookOpen size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> All Courses</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} course(s)</span>
          </div>
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>No courses found.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Title</th><th>Mentor</th><th>Level</th><th>Language</th><th>Status</th><th>Enrolled</th><th>Submitted</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(c.description || '').substring(0, 50)}...</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.mentor_id?.name || 'Unknown'}</td>
                    <td><span className="priority-badge" style={{ fontSize: 11 }}>{c.level}</span></td>
                    <td style={{ fontSize: 12 }}>{c.language || 'English'}</td>
                    <td>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: statusColor(c.status).bg, color: statusColor(c.status).color, fontWeight: 500 }}>
                        {c.status?.charAt(0).toUpperCase() + c.status?.slice(1)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.enrolled_count || 0}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="table-action" onClick={() => viewDetail(c)}><BookOpen size={14} /> View</button>
                        {c.status === 'pending' && (
                          <>
                            <button className="table-action" style={{ background: 'rgba(0,200,83,0.15)', color: 'var(--success)' }} onClick={() => handleApprove(c._id)}>
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button className="table-action" style={{ background: 'rgba(255,68,68,0.15)', color: 'var(--danger-light)' }} onClick={() => handleReject(c._id)}>
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Media Preview Modal ── */}
      {previewMedia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }} onClick={() => setPreviewMedia(null)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: 20, maxWidth: 840, width: '92vw', maxHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{previewMedia.title || previewMedia.file_name || 'File Preview'}</h3>
              <button onClick={() => setPreviewMedia(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={22} /></button>
            </div>
            
            <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              {['mp4', 'webm', 'mov'].includes(previewMedia.ext) ? (
                <video controls autoPlay src={previewMedia.full_url} style={{ width: '100%', maxHeight: '70vh' }} />
              ) : ['mp3', 'wav'].includes(previewMedia.ext) ? (
                <audio controls autoPlay src={previewMedia.full_url} style={{ width: '90%' }} />
              ) : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(previewMedia.ext) ? (
                <img src={previewMedia.full_url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
              ) : previewMedia.ext === 'pdf' ? (
                <iframe src={previewMedia.full_url} title="PDF Preview" style={{ width: '100%', height: '70vh', border: 'none' }} />
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={48} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, marginBottom: 16 }}>This file type (.{previewMedia.ext}) cannot be previewed inline.</p>
                  <a href={previewMedia.full_url} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none' }}>
                    Open / Download File ↗
                  </a>
                </div>
              )}
            </div>
            
            {previewMedia.full_url && (
              <div style={{ textAlign: 'right' }}>
                <a href={previewMedia.full_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary-light)' }}>Open in new tab ↗</a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

