import { useState, useEffect } from 'react';
import { Search, FileText, File, Upload, Trash2, Edit3, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resources as resourcesApi } from '../services/api';
import '../styles/repository.css';

export default function DocumentRepository() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [catFilter, setCatFilter] = useState('All');

  const isStudent = user?.role === 'student';
  const isMentor = user?.role === 'mentor';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const params = {};
    if (catFilter !== 'All') params.category = catFilter.toLowerCase().replace(' ', '_');
    resourcesApi.list(params).then(setResources).catch(() => {});
  }, [catFilter]);

  const handleDelete = async (id) => {
    await resourcesApi.delete(id);
    setResources(prev => prev.filter(r => r._id !== id));
  };

  const categories = ['All', 'core_curriculum', 'advanced_labs', 'community_assets'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Repository</h1>
          <p className="page-subtitle">
            {isStudent && 'Browse learning resources, manuals, and project guidelines'}
            {isMentor && 'Upload, organize, and manage learning resources for your students'}
            {isAdmin && 'Manage all platform resources, storage, and content oversight'}
          </p>
        </div>
        {!isStudent && <button className="btn-primary"><Upload size={16} /> Upload Resource</button>}
      </div>

      <div className="repo-controls">
        <div className="repo-search">
          <Search size={16} color="#505060" />
          <input type="text" placeholder="Search by title, category, or tags..." />
        </div>
      </div>

      <div className="category-chips">
        {categories.map((c, i) => (
          <span key={i} className={`category-chip${catFilter === c ? ' active' : ''}`} onClick={() => setCatFilter(c)}>
            {c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        ))}
      </div>

      {(isMentor || isAdmin) && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div className="dashboard-card-header" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              <Upload size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {isMentor ? 'Upload New Resource' : 'Upload / Manage Resources'}
            </h3>
          </div>
          <div className="upload-area" style={{ border: '2px dashed var(--border-color)', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer' }}>
            <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
            <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Drag & drop files here</h4>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>PDF, DOCX, PPTX, MP4, ZIP — Max 50 MB per file</p>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><HardDrive size={14} /> Storage Settings</button>
              <button className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,68,68,0.15)', color: 'var(--danger-light)' }}><Trash2 size={14} /> Clean Unused</button>
            </div>
          )}
        </div>
      )}

      <div className="repo-grid">
        {resources.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>No resources found</p>
        ) : resources.map((r, i) => {
          const iconColor = ['#7030e0', '#00c853', '#2196f3', '#ff9800'][i % 4];
          return (
            <div key={r._id} className="resource-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="resource-icon" style={{ background: `${iconColor}22`, color: iconColor }}>
                  {r.file_type === 'pdf' ? <FileText size={22} /> : <File size={22} />}
                </div>
                {!isStudent && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="action-btn" style={{ padding: '4px 8px' }}><Edit3 size={12} /></button>
                    <button className="action-btn" style={{ padding: '4px 8px', background: 'rgba(255,68,68,0.15)', color: 'var(--danger-light)' }} onClick={() => handleDelete(r._id)}><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
              <h4>{r.title}</h4>
              <p className="description">{r.description}</p>
              <div className="resource-tags">
                {(r.tags || r.ai_tags_suggested || []).slice(0, 3).map((t, j) => <span key={j} className="resource-tag">{t}</span>)}
              </div>
              <div className="resource-meta">
                <span>{(r.file_size / 1024 / 1024).toFixed(1)} MB</span>
                <span>{r.download_count || 0} downloads</span>
                <span>v{r.version || 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
