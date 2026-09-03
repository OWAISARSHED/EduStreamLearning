import { useState, useRef } from 'react';
import { FileText, Sparkles, Upload, X, Brain, BookOpen, CheckSquare, HelpCircle, Loader2, ImageIcon, AlertCircle, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/insights.css';

export default function AIDocumentInsights() {
  const { user } = useAuth();
  const fileInputRef = useRef();

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ summary: true, keypoints: true, tasks: true, questions: false });

  const ACCEPTED = '.jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf';

  const handleFile = (f) => {
    if (!f) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'application/pdf'];
    if (!allowedTypes.includes(f.type)) {
      setError('Only images (JPG, PNG, GIF, WEBP, BMP) and PDF files are supported.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File size must be under 20MB.');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      setLoadingStep(file.type === 'application/pdf' ? '📄 Reading PDF...' : '🖼️ Running OCR on image...');
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('edustream_token');
      const res = await fetch('/api/ocr/analyze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      setLoadingStep('🤖 AI is analyzing the content...');
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Analysis failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const toggle = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  const Section = ({ id, icon, title, color, children }) => (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', cursor: 'pointer', borderBottom: expandedSections[id] ? '1px solid var(--border-color)' : 'none' }}
        onClick={() => toggle(id)}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{title}</span>
        {expandedSections[id] ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
      </div>
      {expandedSections[id] && <div style={{ padding: '14px 18px' }}>{children}</div>}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Document Insights</h1>
          <p className="page-subtitle">
            Upload any image or PDF — AI will extract text and provide smart analysis
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !file && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#7030e0' : file ? 'var(--success)' : 'var(--border-color)'}`,
          borderRadius: 14,
          padding: '32px 24px',
          textAlign: 'center',
          cursor: file ? 'default' : 'pointer',
          background: dragOver ? 'rgba(112,48,224,0.05)' : file ? 'rgba(0,200,83,0.04)' : 'var(--bg-secondary)',
          transition: 'all 0.2s',
          marginBottom: 20,
        }}
      >
        <input ref={fileInputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

        {!file ? (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(112,48,224,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Upload size={24} style={{ color: '#7030e0' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Drop a file here or click to browse
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Supports: JPG, PNG, GIF, WEBP, BMP, PDF &bull; Max 20MB
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
              {['📷 Photo', '🖼️ Screenshot', '📄 PDF', '📝 Handwriting', '📊 Diagram'].map(t => (
                <span key={t} style={{ fontSize: 11, background: 'rgba(112,48,224,0.1)', color: 'var(--primary-light)', borderRadius: 20, padding: '3px 10px' }}>{t}</span>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(0,200,83,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {file.type === 'application/pdf' ? <FileText size={22} style={{ color: 'var(--success)' }} /> : <ImageIcon size={22} style={{ color: 'var(--success)' }} />}
            </div>
            <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{(file.size / 1024).toFixed(1)} KB &bull; {file.type === 'application/pdf' ? 'PDF Document' : 'Image'}</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setFile(null); setResult(null); setError(''); }}
              style={{ background: 'rgba(255,68,68,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--danger-light)', flexShrink: 0 }}>
              <X size={14} /> Remove
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--danger-light)' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* Analyze Button */}
      {file && !result && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #7030e0, #a855f7)',
            color: loading ? 'var(--text-muted)' : '#fff', fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24,
            transition: 'all 0.2s',
          }}>
          {loading ? (
            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {loadingStep || 'Processing...'}</>
          ) : (
            <><Sparkles size={18} /> Analyze with AI</>
          )}
        </button>
      )}

      {/* Results */}
      {result && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {[
              { label: 'File Type', value: result.file_type?.toUpperCase() },
              { label: 'Characters Extracted', value: result.extracted_chars?.toLocaleString() },
              { label: 'Subject', value: result.analysis?.subject_area || 'Unknown' },
              { label: 'Level', value: result.analysis?.difficulty_level || '—' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 16px', flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
            <button
              onClick={() => { setFile(null); setResult(null); }}
              style={{ background: 'rgba(112,48,224,0.12)', border: '1px solid rgba(112,48,224,0.25)', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', color: 'var(--primary-light)', fontSize: 13, fontWeight: 600 }}>
              New Analysis
            </button>
          </div>

          {/* Summary */}
          <Section id="summary" icon={<Brain size={16} />} title="AI Summary" color="#7030e0">
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
              {result.analysis?.summary || 'No summary available.'}
            </p>
          </Section>

          {/* Key Points */}
          <Section id="keypoints" icon={<BookOpen size={16} />} title={`Key Points (${(result.analysis?.key_points || []).length})`} color="#2196f3">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(result.analysis?.key_points || []).map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(33,150,243,0.15)', color: '#2196f3', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{point}</p>
                </div>
              ))}
              {!(result.analysis?.key_points?.length) && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No key points extracted.</p>}
            </div>
          </Section>

          {/* Actionable Tasks */}
          <Section id="tasks" icon={<CheckSquare size={16} />} title={`Suggested Actions (${(result.analysis?.actionable_tasks || []).length})`} color="#00c853">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(result.analysis?.actionable_tasks || []).map((task, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(0,200,83,0.05)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(0,200,83,0.15)' }}>
                  <CheckSquare size={14} style={{ color: '#00c853', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{task}</span>
                </div>
              ))}
              {!(result.analysis?.actionable_tasks?.length) && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No tasks suggested.</p>}
            </div>
          </Section>

          {/* Comprehension Questions */}
          <Section id="questions" icon={<HelpCircle size={16} />} title={`Comprehension Questions (${(result.analysis?.questions || []).length})`} color="#ff9800">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(result.analysis?.questions || []).map((q, i) => (
                <div key={i} style={{ background: 'rgba(255,152,0,0.05)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ fontSize: 12, color: '#ff9800', fontWeight: 700, display: 'block', marginBottom: 4 }}>Q{i + 1}</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{q}</p>
                </div>
              ))}
              {!(result.analysis?.questions?.length) && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No questions generated.</p>}
            </div>
          </Section>

          {/* Extracted Text Toggle */}
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowRawText(p => !p)}
              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              {showRawText ? <EyeOff size={13} /> : <Eye size={13} />} {showRawText ? 'Hide' : 'Show'} Extracted Raw Text
            </button>
            {showRawText && (
              <div style={{ marginTop: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontFamily: 'monospace' }}>
                {result.extracted_text || 'No text preview available.'}
                {result.extracted_chars > 2000 && <div style={{ marginTop: 8, color: 'var(--primary-light)' }}>... ({result.extracted_chars - 2000} more characters extracted and sent to AI)</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!file && !result && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Sparkles size={40} style={{ marginBottom: 16, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Upload a document or image to get started</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Works with textbooks, notes, screenshots, assignments, handwritten content & more</p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
