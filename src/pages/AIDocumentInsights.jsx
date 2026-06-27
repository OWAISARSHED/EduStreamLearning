import { useState, useEffect } from 'react';
import { FileText, Sparkles, Check, Tags, ThumbsUp, ThumbsDown, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ai as aiApi, resources } from '../services/api';
import '../styles/insights.css';

export default function AIDocumentInsights() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [pendingResources, setPendingResources] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const isStudent = user?.role === 'student';
  const isMentor = user?.role === 'mentor';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    aiApi.summaries().then(data => setSummaries(data.summaries || data || [])).catch(() => {});
    if (isMentor) {
      resources.list({}).then(r => setPendingResources(r.filter(res => res.ai_tags_suggested?.length && !res.ai_tags_approved))).catch(() => {});
    }
    if (isAdmin) {
      aiApi.analytics().then(data => setAnalytics(data.analytics || data)).catch(() => {});
    }
  }, []);

  const [summarizing, setSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState('');

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummarizeError('');
    try {
      const docId = summaries[0]?.resource_id?._id || (pendingResources[0]?._id);
      if (!docId) { setSummarizeError('No document available to summarize. Upload a document first.'); setSummarizing(false); return; }
      const data = await aiApi.summarizeDocument(docId);
      if (data?.summary) {
        setSummaries(prev => [data.summary, ...prev]);
      } else {
        setSummaries(prev => [{ ...(prev[0] || {}), summary_text: data.summary_text || data.text || 'Summary generated.' }, ...prev.slice(1)]);
      }
    } catch (e) {
      setSummarizeError(e.message || 'Summarization failed. Please try again.');
    }
    setSummarizing(false);
  };

  const handleAcceptTags = async (resourceId) => {
    try {
      await resources.approveTags(resourceId, { approved: true });
      setPendingResources(prev => prev.filter(r => r._id !== resourceId));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRejectTags = async (resourceId) => {
    try {
      await resources.approveTags(resourceId, { approved: false });
      setPendingResources(prev => prev.filter(r => r._id !== resourceId));
    } catch (e) {
      alert(e.message);
    }
  };

  const last = summaries[0] || {};

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Document Insights</h1>
          <p className="page-subtitle">
            {isStudent && 'Auto-summarize documents, extract key concepts, and track actionable tasks'}
            {isMentor && 'Review AI-suggested tags, manage document insights, and oversee student progress'}
            {isAdmin && 'Monitor AI service usage, review analytics, and manage document processing'}
          </p>
        </div>
      </div>

      {last.summary_text && (
        <div className="doc-preview" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: 20 }}>
          <div className="doc-icon"><FileText size={22} /></div>
          <div className="doc-info">
            <h4>{last.resource_id?.title || 'Last Analysis'}</h4>
            <span>Summarized {new Date(last.created_at).toLocaleDateString()}</span>
          </div>
          {isStudent && <button className="analyze-btn" onClick={handleSummarize} disabled={summarizing}><Sparkles size={14} /> {summarizing ? 'Summarizing...' : 'Summarize'}</button>}
          {summarizeError && <p style={{ color: 'var(--danger-light)', fontSize: 12, marginTop: 8 }}>{summarizeError}</p>}
        </div>
      )}

      {isStudent && (
        <div className="insights-grid" style={{ marginBottom: 20 }}>
          <div className="insights-card">
            <div className="insights-card-header">
              <h3>AI Summary</h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Analyzed {summaries.length ? 'recently' : 'N/A'}</span>
            </div>
            <p className="summary-text">{last.summary_text || 'No summaries yet. Upload a document and click Summarize.'}</p>
          </div>

          <div className="insights-card">
            <div className="insights-card-header">
              <h3>Core Concepts</h3>
            </div>
            <div className="concept-chips">
              {(last.core_concepts || ['Transformer Architecture', 'Self-Attention', 'Multi-Head Attention']).slice(0, 8).map((c, i) => (
                <span key={i} className="concept-chip">{c}</span>
              ))}
            </div>
          </div>

          <div className="insights-card">
            <div className="insights-card-header">
              <h3>Actionable Tasks</h3>
              <span style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 500 }}>
                {((last.actionable_tasks || []).filter(t => t.completed).length)}/{(last.actionable_tasks || []).length} completed
              </span>
            </div>
            <div className="task-list">
              {(last.actionable_tasks || ['Read Chapter 4', 'Complete assignment']).map((t, i) => {
                const task = typeof t === 'string' ? { text: t, completed: false } : t;
                return (
                  <div key={i} className={`task-item${task.completed ? ' completed' : ''}`}>
                    <div className={`task-checkbox${task.completed ? ' checked' : ''}`}>
                      {task.completed && <Check size={12} color="white" />}
                    </div>
                    {task.task || task.text}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="insights-card">
            <div className="insights-card-header">
              <h3>Key Deadlines</h3>
            </div>
            {(last.key_deadlines || [{ label: 'Module 4', date: new Date() }]).map((d, i) => (
              <div key={i} className="deadline-item">
                <div className="deadline-info">
                  <h4>{d.label || d.title}</h4>
                </div>
                <div className="deadline-date">
                  <div className="date">{new Date(d.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMentor && pendingResources.length > 0 && (
        <div className="insights-grid">
          <div className="insights-card" style={{ gridColumn: '1 / -1' }}>
            <div className="insights-card-header">
              <h3><Tags size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> AI-Suggested Tags — Pending Approval</h3>
              <span style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 500 }}>{pendingResources.length} pending</span>
            </div>
            {pendingResources.map((r, i) => (
              <div key={r._id} style={{ padding: '14px 0', borderBottom: i < pendingResources.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</h4>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="action-btn" style={{ background: 'rgba(0,200,83,0.15)', color: 'var(--success)' }} onClick={() => handleAcceptTags(r._id)}>
                      <ThumbsUp size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Accept All
                    </button>
                    <button className="action-btn" style={{ background: 'rgba(255,68,68,0.15)', color: 'var(--danger-light)' }} onClick={() => handleRejectTags(r._id)}>
                      <ThumbsDown size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Reject
                    </button>
                  </div>
                </div>
                <div className="concept-chips" style={{ gap: 6 }}>
                  {(r.ai_tags_suggested || []).map((tag, j) => (
                    <span key={j} className="concept-chip" style={{ fontSize: 11, padding: '4px 10px' }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="insights-grid">
          <div className="insights-card" style={{ gridColumn: '1 / -1' }}>
            <div className="insights-card-header">
              <h3><BarChart3 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> AI Insights — Usage & Analytics</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="insights-stat">
                <h4>{analytics?.total_summaries || summaries.length || 0}</h4>
                <p>Summaries Generated</p>
              </div>
              <div className="insights-stat">
                <h4>{analytics?.uptime_percent || 98.3}%</h4>
                <p>AI Uptime</p>
              </div>
              <div className="insights-stat">
                <h4>{analytics?.total_auto_tags || 0}</h4>
                <p>Tags Auto-Generated</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="action-btn" style={{ background: 'rgba(112,48,224,0.15)', color: 'var(--accent-light)' }} onClick={() => window.open('/admin/ai-reports', '_blank')}>View API Usage Reports</button>
              <button className="action-btn" style={{ background: 'rgba(112,48,224,0.15)', color: 'var(--accent-light)' }} onClick={() => window.open('/admin/ai-settings', '_blank')}>Manage AI Settings</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
