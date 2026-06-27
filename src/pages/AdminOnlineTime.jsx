import { useState, useEffect } from 'react';
import { Clock, Users, UserCheck, Search, Filter, Circle } from 'lucide-react';
import '../styles/admin.css';

export default function AdminOnlineTime() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/online-time', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('edustream_token') },
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const formatHours = (h) => {
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return `${hours}h ${mins}m`;
  };

  const timeAgo = (date) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalHours = users.reduce((sum, u) => sum + (u.stats?.total_hours || 0), 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Online Time Tracking</h1>
          <p className="page-subtitle">Monitor active time of mentors and students across the platform</p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat"><h4>{users.length}</h4><p>Active Users</p></div>
        <div className="admin-stat"><h4>{formatHours(totalHours)}</h4><p>Total Platform Time</p></div>
        <div className="admin-stat"><h4>{users.filter(u => u.role === 'student').length}</h4><p>Students</p></div>
        <div className="admin-stat"><h4>{users.filter(u => u.role === 'mentor').length}</h4><p>Mentors</p></div>
        <div className="admin-stat"><h4>{users.filter(u => {
          if (!u.last_login) return false;
          return Date.now() - new Date(u.last_login).getTime() < 86400000;
        }).length}</h4><p>Online Today</p></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'All Users', value: 'all', icon: <Users size={13} /> },
          { label: 'Students', value: 'student', icon: <Users size={13} /> },
          { label: 'Mentors', value: 'mentor', icon: <UserCheck size={13} /> },
        ].map(f => (
          <button key={f.value} className={`action-btn ${roleFilter === f.value ? 'btn-primary' : ''}`}
            style={roleFilter === f.value ? { padding: '6px 14px', fontSize: 12 } : { fontSize: 12 }}
            onClick={() => setRoleFilter(f.value)}>
            {f.icon} {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search user..." style={{ padding: '6px 12px 6px 30px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 12, width: 200 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3><Clock size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> User Activity Log</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} users</span>
        </div>
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>No users found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Total Online Time</th><th>Last Login</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const isOnline = u.last_login && (Date.now() - new Date(u.last_login).getTime() < 300000);
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="table-avatar" style={{
                          background: u.role === 'mentor' ? '#7030e0' : '#2196f3',
                          width: 32, height: 32, borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 13, fontWeight: 600,
                        }}>
                          {(u.name || '?')[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 500,
                        background: u.role === 'mentor' ? 'rgba(112,48,224,0.15)' : 'rgba(33,150,243,0.15)',
                        color: u.role === 'mentor' ? '#7030e0' : '#2196f3',
                      }}>
                        {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{formatHours(u.stats?.total_hours || 0)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(u.stats?.total_hours || 0).toFixed(1)} hours</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Circle size={8} fill={isOnline ? '#00c853' : u.account_status === 'suspended' ? '#ff4444' : '#666'} color={isOnline ? '#00c853' : u.account_status === 'suspended' ? '#ff4444' : '#666'} />
                        <span style={{ fontSize: 12, color: isOnline ? 'var(--success)' : u.account_status === 'suspended' ? 'var(--danger-light)' : 'var(--text-muted)' }}>
                          {isOnline ? 'Online' : timeAgo(u.last_login)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
