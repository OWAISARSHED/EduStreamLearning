import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, FileText, MessageSquare, Sparkles, Globe, Bot } from 'lucide-react';
import { ai as aiApi } from '../services/api';
import '../styles/admin.css';

export default function AdminAIAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await (await fetch(`/api/ai/usage-analytics?days=${days}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('edustream_token') },
      })).json();
      setAnalytics(data);
    } catch (e) { setAnalytics(null); }
    setLoading(false);
  };

  const typeColors = { summary: '#7030e0', translation: '#2196f3', tag_suggestion: '#ff9800' };
  const typeIcons = { summary: <FileText size={14} />, translation: <Globe size={14} />, tag_suggestion: <Sparkles size={14} /> };

  if (loading) return <p style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>Loading analytics...</p>;
  if (!analytics) return <p style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>No analytics data available.</p>;

  const maxDailyCount = Math.max(...(analytics.daily || []).map(d => d.count), 1);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Usage Analytics</h1>
          <p className="page-subtitle">Monitor AI service usage across the platform — summaries, translations, tag suggestions</p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat"><h4>{analytics.total || 0}</h4><p>Total AI Calls</p></div>
        {(analytics.byType || []).map(t => (
          <div key={t._id} className="admin-stat">
            <h4>{t.count}</h4>
            <p style={{ textTransform: 'capitalize' }}>{t._id.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Period:</span>
        {[7, 14, 30, 90].map(d => (
          <button key={d} className={`action-btn ${days === d ? 'btn-primary' : ''}`}
            style={days === d ? { padding: '6px 14px', fontSize: 12 } : { fontSize: 12 }}
            onClick={() => setDays(d)}>
            Last {d} days
          </button>
        ))}
      </div>

      <div className="admin-grid-2" style={{ marginBottom: 20 }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><BarChart3 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Daily AI Usage</h3>
          </div>
          <div style={{ padding: '8px 0' }}>
            {(analytics.daily || []).length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No usage data in this period.</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160, padding: '8px 0' }}>
                {(analytics.daily || []).map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%', maxWidth: 28, borderRadius: '3px 3px 0 0',
                      height: `${Math.max((d.count / maxDailyCount) * 140, 4)}px`,
                      background: typeColors[d.type] || '#7030e0',
                      opacity: 0.8, transition: 'height 0.3s',
                    }} title={`${d._id}: ${d.count} ${d.type}`} />
                    {i % 5 === 0 && (
                      <span style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 4, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                        {d._id?.slice(5)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
              {Object.entries(typeColors).map(([type, color]) => (
                <span key={type} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
                  {type.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3><TrendingUp size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Distribution by Type</h3>
          </div>
          <div style={{ padding: '12px 0' }}>
            {(analytics.byType || []).map(t => {
              const pct = analytics.total > 0 ? Math.round((t.count / analytics.total) * 100) : 0;
              return (
                <div key={t._id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {typeIcons[t._id] || <Sparkles size={14} />}
                      <span style={{ textTransform: 'capitalize' }}>{t._id.replace('_', ' ')}</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{t.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: typeColors[t._id] || '#7030e0', transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3><Users size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Top AI Users</h3>
        </div>
        {(analytics.byUser || []).length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 16, textAlign: 'center' }}>No user data.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>#</th><th>User</th><th>Email</th><th>AI Calls</th></tr>
            </thead>
            <tbody>
              {(analytics.byUser || []).map((u, i) => (
                <tr key={i}>
                  <td style={{ width: 40, color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="table-avatar" style={{ background: ['#7030e0','#2196f3','#00c853','#ff9800','#ff4444'][i % 5], width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>
                        {(u.name || '?')[0]}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email || '-'}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{u.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
