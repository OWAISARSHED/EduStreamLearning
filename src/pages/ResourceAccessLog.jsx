import { useState, useEffect } from 'react';
import { Search, Eye, Download, FileText, File, User, Calendar } from 'lucide-react';
import { resources as resourcesApi } from '../services/api';
import '../styles/repository.css';

export default function ResourceAccessLog() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resourcesApi.accessLogs({}).then(setLogs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    !search ||
    l.student_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.resource_id?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resource Access Logs</h1>
          <p className="page-subtitle">Review which students have viewed or downloaded learning resources</p>
        </div>
      </div>

      <div className="repo-controls">
        <div className="repo-search">
          <Search size={16} color="#505060" />
          <input type="text" placeholder="Search by student or resource name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading access logs...</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No access logs found</p>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Student</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Resource</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Action</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={14} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500 }}>{log.student_id?.name || 'Unknown'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>{log.student_id?.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {log.resource_id?.file_type === 'pdf' ? <FileText size={14} color="var(--text-muted)" /> : <File size={14} color="var(--text-muted)" />}
                    <span>{log.resource_id?.title || 'Deleted resource'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: log.action === 'download' ? 'rgba(0,200,83,0.12)' : 'rgba(33,150,243,0.12)', color: log.action === 'download' ? '#00c853' : '#2196f3' }}>
                      {log.action === 'download' ? <Download size={12} /> : <Eye size={12} />}
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={12} />
                    {new Date(log.accessed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
