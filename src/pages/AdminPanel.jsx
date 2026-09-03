import { useState, useEffect } from 'react';
import { Shield, Users, BookOpen, CheckCircle, XCircle, Clock, UserCheck, Activity, BarChart3, FileText, Search, Plus, X, Eye, Layers, ChevronDown, ChevronRight, Link, ClipboardList, HelpCircle, Loader } from 'lucide-react';
import { users as usersApi, courses } from '../services/api';
import '../styles/admin.css';

export default function AdminPanel() {
  const [allUsers, setAllUsers] = useState([]);
  const [userRoles, setUserRoles] = useState({});
  const [pendingCourses, setPendingCourses] = useState([]);
  const [pendingMentors, setPendingMentors] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ totalStudents: 0, totalMentors: 0, pendingMentors: 0, totalCourses: 0, pendingCourses: 0, approvedCourses: 0, totalEnrollments: 0 });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });
  const [idCardModal, setIdCardModal] = useState(null); // { name, url }
  const [courseModal, setCourseModal] = useState(null); // full course details object
  const [courseModalLoading, setCourseModalLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [list, pendingC, pendingM, statsData] = await Promise.all([
        usersApi.list({}).catch(() => []),
        courses.pending().catch(() => []),
        fetch('/api/users/pending-mentors', { headers: { Authorization: 'Bearer ' + localStorage.getItem('edustream_token') } }).then(r => r.ok ? r.json() : []),
        fetch('/api/users/stats', { headers: { Authorization: 'Bearer ' + localStorage.getItem('edustream_token') } }).then(r => r.ok ? r.json() : {}),
      ]);
      const roles = {};
      (Array.isArray(list) ? list : []).forEach(u => { roles[u._id] = u.role; });
      setAllUsers(Array.isArray(list) ? list : []);
      setUserRoles(roles);
      setPendingCourses(Array.isArray(pendingC) ? pendingC : []);
      setPendingMentors(Array.isArray(pendingM) ? pendingM : []);
      setStats(statsData);
    } catch (e) { /* ignore */ }
  };

  const handleRoleChange = async (id, newRole) => {
    setUserRoles(prev => ({ ...prev, [id]: newRole }));
    try {
      await usersApi.update(id, { role: newRole });
    } catch (e) {
      setUserRoles(prev => ({ ...prev, [id]: allUsers.find(u => u._id === id)?.role }));
    }
  };

  const handleViewCourse = async (courseId) => {
    setCourseModalLoading(true);
    setCourseModal({ _loading: true });
    setExpandedModules({});
    try {
      const data = await courses.get(courseId);
      setCourseModal(data); // { course, resources, assignments, quizzes }
    } catch (e) {
      setCourseModal(null);
      alert('Failed to load course details: ' + e.message);
    } finally {
      setCourseModalLoading(false);
    }
  };

  const handleApproveCourse = async (id) => {
    await courses.approve(id);
    loadData();
  };

  const handleRejectCourse = async (id) => {
    const reason = prompt('Rejection reason:');
    await courses.reject(id, reason || 'Not approved');
    loadData();
  };

  const handleApproveMentor = async (id) => {
    await usersApi.update(id, { mentor_status: 'approved' });
    loadData();
  };

  const handleRejectMentor = async (id) => {
    await usersApi.update(id, { mentor_status: 'rejected' });
    loadData();
  };

  const handleSuspendUser = async (id, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await usersApi.update(id, { account_status: newStatus });
    loadData();
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    try {
      await usersApi.create(newUser);
      setShowCreateUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'student' });
      loadData();
    } catch (e) { alert(e.message); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? Their posts will be anonymized.')) return;
    try {
      await usersApi.delete(id);
      loadData();
    } catch (e) { alert(e.message); }
  };

  const tabs = ['overview', 'courses', 'mentors', 'users'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Management Panel</h1>
          <p className="page-subtitle">Manage courses, mentors, users, and platform operations</p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat"><h4>{stats.totalStudents}</h4><p>Students</p></div>
        <div className="admin-stat"><h4>{stats.totalMentors}</h4><p>Active Mentors</p></div>
        <div className="admin-stat"><h4>{stats.pendingMentors}</h4><p>Pending Mentors</p></div>
        <div className="admin-stat"><h4>{stats.totalCourses}</h4><p>Total Courses</p></div>
        <div className="admin-stat"><h4>{stats.pendingCourses}</h4><p>Pending Courses</p></div>
        <div className="admin-stat"><h4>{stats.approvedCourses}</h4><p>Approved Courses</p></div>
        <div className="admin-stat"><h4>{stats.totalEnrollments}</h4><p>Enrollments</p></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t} className={`action-btn ${activeTab === t ? 'btn-primary' : ''}`}
            style={activeTab === t ? { padding: '6px 14px', fontSize: 12 } : { fontSize: 12 }}
            onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="admin-grid-3">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3><BarChart3 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Platform Overview</h3>
            </div>
            <div className="activity-feed">
              <div className="activity-entry">
                <div className="activity-icon user"><Users size={14} /></div>
                <div><div className="text" style={{ fontSize: 12 }}>Students: {stats.totalStudents}</div></div>
              </div>
              <div className="activity-entry">
                <div className="activity-icon user"><UserCheck size={14} /></div>
                <div><div className="text" style={{ fontSize: 12 }}>Mentors: {stats.totalMentors}</div></div>
              </div>
              <div className="activity-entry">
                <div className="activity-icon system"><Shield size={14} /></div>
                <div><div className="text" style={{ fontSize: 12 }}>Admins: {allUsers.filter(u => u.role === 'admin').length}</div></div>
              </div>
              <div className="activity-entry">
                <div className="activity-icon" style={{ background: 'rgba(255,152,0,0.15)' }}><Clock size={14} /></div>
                <div><div className="text" style={{ fontSize: 12 }}>Pending Approvals: {stats.pendingMentors + stats.pendingCourses}</div></div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3><BookOpen size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Courses Summary</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total Courses', value: stats.totalCourses },
                { label: 'Approved', value: stats.approvedCourses },
                { label: 'Pending Review', value: stats.pendingCourses },
                { label: 'Total Enrollments', value: stats.totalEnrollments },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
                  <span>{r.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3><Activity size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Quick Actions</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, width: '100%' }} onClick={() => setActiveTab('courses')}>
                Review Pending Courses ({stats.pendingCourses})
              </button>
              <button className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, width: '100%' }} onClick={() => setActiveTab('mentors')}>
                Review Pending Mentors ({stats.pendingMentors})
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><BookOpen size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Pending Course Approvals</h3>
          </div>
          {pendingCourses.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>No pending course approvals</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Course</th><th>Mentor</th><th>Modules</th><th>Submitted</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pendingCourses.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(c.description || '').substring(0, 60)}...</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.mentor_id?.name || 'Unknown'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(c.modules || []).length} modules</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="table-action" style={{ background: 'rgba(112,48,224,0.15)', color: 'var(--primary-light)' }} onClick={() => handleViewCourse(c._id)}>
                          <Eye size={14} /> View
                        </button>
                        <button className="table-action" style={{ background: 'rgba(0,200,83,0.15)', color: 'var(--success)' }} onClick={() => handleApproveCourse(c._id)}>
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button className="table-action" style={{ background: 'rgba(255,68,68,0.15)', color: 'var(--danger-light)' }} onClick={() => handleRejectCourse(c._id)}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'mentors' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><UserCheck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Pending Mentor Approvals</h3>
          </div>
          {pendingMentors.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>No pending mentor approvals</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>ID Card</th><th>Registered</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pendingMentors.map((m, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="table-avatar" style={{ background: ['#2196f3', '#00c853', '#7030e0', '#ff9800'][i % 4] }}>
                          {(m.name || '?')[0]}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{m.email}</td>
                    <td>
                      {m.id_card_url ? (
                        <button className="table-action" style={{ fontSize: 11 }} onClick={() => setIdCardModal({ name: m.name, url: m.id_card_url })}>
                          <FileText size={12} /> View ID
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No ID uploaded</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="table-action" style={{ background: 'rgba(0,200,83,0.15)', color: 'var(--success)' }} onClick={() => handleApproveMentor(m._id)}>
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button className="table-action" style={{ background: 'rgba(255,68,68,0.15)', color: 'var(--danger-light)' }} onClick={() => handleRejectMentor(m._id)}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><Users size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> User Management</h3>
            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setShowCreateUser(true)}>
              <Plus size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Create User
            </button>
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Mentor Status</th><th>Status</th><th>Joined</th><th>Action</th></tr>
            </thead>
            <tbody>
              {allUsers.map((u, i) => {
                const initial = (u.name || '?')[0];
                const colors = ['#2196f3', '#00c853', '#7030e0', '#ff9800', '#ff4444'];
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="table-avatar" style={{ background: colors[i % colors.length] }}>{initial}</div>
                        <div><div className="table-name">{u.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div></div>
                      </div>
                    </td>
                    <td>
                      <select className="role-select-dropdown" value={userRoles[u._id] || u.role} onChange={e => handleRoleChange(u._id, e.target.value)}>
                        <option value="student">Student</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      {u.role === 'mentor' ? (
                        <span className={`priority-badge ${u.mentor_status === 'approved' ? '' : u.mentor_status === 'rejected' ? 'critical' : ''}`}
                          style={{ fontSize: 11, background: u.mentor_status === 'approved' ? 'rgba(0,200,83,0.15)' : u.mentor_status === 'rejected' ? 'rgba(255,68,68,0.15)' : 'rgba(255,152,0,0.15)', color: u.mentor_status === 'approved' ? 'var(--success)' : u.mentor_status === 'rejected' ? 'var(--danger-light)' : '#ff9800' }}>
                          {u.mentor_status || 'none'}
                        </span>
                      ) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>N/A</span>}
                    </td>
                    <td><span className={`status-dot ${u.account_status}`} />{u.account_status?.charAt(0).toUpperCase() + u.account_status?.slice(1)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="table-action" onClick={() => handleSuspendUser(u._id, u.account_status)}>
                          {u.account_status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        {u.role !== 'admin' && (
                          <button className="table-action" style={{ background: 'rgba(255,68,68,0.15)', color: 'var(--danger-light)' }} onClick={() => handleDeleteUser(u._id)}>
                            <XCircle size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {showCreateUser && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateUser(false)}>
              <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Create New User</h3>
                  <button onClick={() => setShowCreateUser(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 13 }}>Name</label>
                    <input type="text" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13 }} placeholder="Full name" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 13 }}>Email</label>
                    <input type="email" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13 }} placeholder="Email address" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 13 }}>Password</label>
                    <input type="password" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13 }} placeholder="Min. 6 characters" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 13 }}>Role</label>
                    <select style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13 }} value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                      <option value="student">Student</option>
                      <option value="mentor">Mentor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button className="btn-primary" style={{ padding: '10px', fontSize: 13, marginTop: 4 }} onClick={handleCreateUser}>Create User</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ── ID Card Modal ── */}
      {idCardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setIdCardModal(null)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: 24, maxWidth: 600, width: '90vw', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>ID Card — {idCardModal.name}</h3>
              <button onClick={() => setIdCardModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ borderRadius: 8, overflow: 'hidden', background: 'var(--bg-secondary)', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(idCardModal.url) ? (
                <img src={idCardModal.url} alt="ID Card" style={{ width: '100%', borderRadius: 8, display: 'block' }} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              ) : null}
              <div style={{ display: /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(idCardModal.url) ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40, color: 'var(--text-muted)' }}>
                <FileText size={48} />
                <p style={{ fontSize: 13 }}>This file cannot be previewed directly.</p>
                <a href={idCardModal.url} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none', borderRadius: 8 }}>Open / Download File</a>
              </div>
            </div>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <a href={idCardModal.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary-light)' }}>Open in new tab ↗</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Course Detail Modal ── */}
      {courseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setCourseModal(null)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: 28, maxWidth: 720, width: '92vw', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>

            {/* Loading */}
            {courseModal._loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12, color: 'var(--text-muted)' }}>
                <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} /> Loading course details...
              </div>
            ) : (() => {
              const c = courseModal.course || courseModal;
              const resources = courseModal.resources || [];
              const assignments = courseModal.assignments || [];
              const quizzes = courseModal.quizzes || [];
              return (
                <>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{c.title}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        By <strong style={{ color: 'var(--text-secondary)' }}>{c.mentor_id?.name || 'Unknown'}</strong>
                        {c.mentor_id?.email && <> &bull; {c.mentor_id.email}</>}
                        <span style={{ marginLeft: 10, background: 'rgba(112,48,224,0.15)', color: 'var(--primary-light)', borderRadius: 20, padding: '1px 8px', fontSize: 11 }}>{c.level}</span>
                        <span style={{ marginLeft: 6, background: 'rgba(255,152,0,0.15)', color: '#ff9800', borderRadius: 20, padding: '1px 8px', fontSize: 11 }}>{c.category || 'Uncategorized'}</span>
                      </div>
                    </div>
                    <button onClick={() => setCourseModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}><X size={20} /></button>
                  </div>

                  {/* Description */}
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {c.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided.</span>}
                  </div>

                  {/* Resources */}
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                    <Link size={14} style={{ color: '#7030e0' }} /> Resources ({resources.length})
                  </h4>
                  {resources.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, paddingLeft: 4 }}>No resources uploaded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                      {resources.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-color)' }}>
                          <FileText size={14} style={{ color: '#7030e0', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title || r.file_name || 'Untitled'}</div>
                            {r.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.description}</div>}
                          </div>
                          {r.file_url && (
                            <a href={`http://localhost:5000${r.file_url}`} target="_blank" rel="noreferrer"
                              style={{ fontSize: 11, color: 'var(--primary-light)', whiteSpace: 'nowrap', textDecoration: 'none', border: '1px solid rgba(112,48,224,0.3)', borderRadius: 6, padding: '3px 8px' }}>
                              View ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assignments */}
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                    <ClipboardList size={14} style={{ color: '#00c853' }} /> Assignments ({assignments.length})
                  </h4>
                  {assignments.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, paddingLeft: 4 }}>No assignments added yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                      {assignments.map((a, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-color)', fontSize: 13 }}>
                          <div style={{ fontWeight: 600 }}>{a.title}</div>
                          {a.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{a.description}</div>}
                          {a.due_date && <div style={{ fontSize: 11, color: '#ff9800', marginTop: 3 }}>Due: {new Date(a.due_date).toLocaleDateString()}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quizzes */}
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                    <HelpCircle size={14} style={{ color: '#ff9800' }} /> Quizzes ({quizzes.length})
                  </h4>
                  {quizzes.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, paddingLeft: 4 }}>No quizzes added yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                      {quizzes.map((q, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-color)', fontSize: 13 }}>
                          <div style={{ fontWeight: 600 }}>{q.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{(q.questions || []).length} questions &bull; Pass: {q.passing_score || 60}%</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                    <button className="table-action" style={{ background: 'rgba(255,68,68,0.15)', color: 'var(--danger-light)', padding: '8px 16px' }}
                      onClick={() => { handleRejectCourse(c._id); setCourseModal(null); }}>
                      <XCircle size={15} /> Reject Course
                    </button>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}
                      onClick={() => { handleApproveCourse(c._id); setCourseModal(null); }}>
                      <CheckCircle size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Approve Course
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
