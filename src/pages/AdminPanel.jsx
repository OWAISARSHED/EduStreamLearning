import { useState, useEffect } from 'react';
import { Shield, Users, BookOpen, CheckCircle, XCircle, Clock, UserCheck, Activity, BarChart3, FileText, Search, Plus, X } from 'lucide-react';
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
                <tr><th>Course</th><th>Mentor</th><th>Level</th><th>Submitted</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pendingCourses.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(c.description || '').substring(0, 60)}...</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.mentor_id?.name || 'Unknown'}</td>
                    <td><span className="priority-badge" style={{ fontSize: 11 }}>{c.level}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
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
                        <a href={m.id_card_url} target="_blank" rel="noreferrer" className="table-action" style={{ fontSize: 11 }}>
                          <FileText size={12} /> View ID
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No ID</span>
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
    </>
  );
}
