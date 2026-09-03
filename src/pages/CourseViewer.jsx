import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronRight, CheckCircle, Circle, FileText, Headphones, BookOpen, ArrowLeft, Loader2, Film, ClipboardList } from 'lucide-react';
import '../styles/courseviewer.css';

const API = (endpoint, opts = {}) => {
  const token = localStorage.getItem('edustream_token');
  return fetch(`/api${endpoint}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  }).then(r => r.json());
};

export default function CourseViewer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [activeResource, setActiveResource] = useState(null);
  const [progress, setProgress]       = useState({});   // { resource_id: VideoProgress }
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [isMuted, setIsMuted]         = useState(false);
  const [videoProgress, setVideoProgress] = useState(0); // 0-100
  const [videoTime, setVideoTime]     = useState({ current: 0, duration: 0 });
  const videoRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Load course data
  useEffect(() => {
    setLoading(true);
    API(`/courses/${courseId}/learn`)
      .then(d => {
        if (d.message) { setError(d.message); return; }
        setData(d);
        // Build progress map
        const map = {};
        (d.progress || []).forEach(p => { map[p.resource_id] = p; });
        setProgress(map);
        // Auto-select first resource
        const first = (d.resources || [])[0];
        if (first) setActiveResource(first);
      })
      .catch(() => setError('Failed to load course.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Save progress to backend (debounced)
  const saveProgress = useCallback((resourceId, currentTime, duration) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await API(`/courses/${courseId}/progress`, {
          method: 'POST',
          body: JSON.stringify({ resource_id: resourceId, watched_seconds: Math.round(currentTime), duration_seconds: Math.round(duration) }),
        });
        setProgress(prev => ({ ...prev, [resourceId]: res }));
      } catch {}
    }, 3000); // save every 3 seconds of inactivity
  }, [courseId]);

  // Video event handlers
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !activeResource) return;
    const pct = v.duration > 0 ? (v.currentTime / v.duration) * 100 : 0;
    setVideoProgress(pct);
    setVideoTime({ current: v.currentTime, duration: v.duration });
    saveProgress(activeResource._id, v.currentTime, v.duration);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    saveProgress(activeResource._id, videoRef.current?.duration, videoRef.current?.duration);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play(); setIsPlaying(true); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Course overall progress
  const totalResources = (data?.resources || []).length;
  const completedResources = Object.values(progress).filter(p => p.completed).length;
  const overallPct = totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;

  // Group resources by module
  const grouped = {};
  (data?.resources || []).forEach(r => {
    const key = r.module_number || 1;
    if (!grouped[key]) grouped[key] = { title: r.module_title || `Module ${key}`, items: [] };
    grouped[key].items.push(r);
  });

  const isVideo = r => ['mp4', 'webm', 'mov', 'avi'].includes((r.file_type || '').toLowerCase());
  const isPDF   = r => (r.file_type || '').toLowerCase() === 'pdf';
  const isAudio = r => ['mp3', 'wav', 'ogg'].includes((r.file_type || '').toLowerCase());

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#7030e0' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading course...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: 'var(--danger-light)', fontSize: 15, marginBottom: 16 }}>{error}</p>
      <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '10px 24px' }}>← Back to Dashboard</button>
    </div>
  );

  const course = data?.course;

  return (
    <div className="cv-wrapper">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="cv-topbar">
        <button className="cv-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="cv-course-title">{course?.title}</div>
        {/* Overall progress */}
        <div className="cv-overall-progress">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>
            {completedResources}/{totalResources} completed
          </span>
          <div className="cv-progress-track">
            <div className="cv-progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <span style={{ fontSize: 12, color: '#7030e0', fontWeight: 700, marginLeft: 8 }}>{overallPct}%</span>
        </div>
      </div>

      <div className="cv-body">
        {/* ── Main Content Area ─────────────────────────────── */}
        <div className="cv-main">
          {activeResource ? (
            <>
              {/* Video Player */}
              {isVideo(activeResource) && (
                <div className="cv-video-container" onContextMenu={e => e.preventDefault()}>
                  <video
                    ref={videoRef}
                    src={`http://localhost:5000${activeResource.file_url}`}
                    className="cv-video"
                    controlsList="nodownload"
                    onContextMenu={e => e.preventDefault()}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedMetadata={() => setVideoTime(prev => ({ ...prev, duration: videoRef.current?.duration || 0 }))}
                  />
                  {/* Custom Controls */}
                  <div className="cv-controls">
                    <div className="cv-seekbar" onClick={handleSeek}>
                      <div className="cv-seekbar-fill" style={{ width: `${videoProgress}%` }} />
                      <div className="cv-seekbar-thumb" style={{ left: `${videoProgress}%` }} />
                    </div>
                    <div className="cv-controls-row">
                      <button className="cv-ctrl-btn" onClick={togglePlay}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button className="cv-ctrl-btn" onClick={toggleMute}>
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      <span className="cv-time">{formatTime(videoTime.current)} / {formatTime(videoTime.duration)}</span>
                      <div style={{ flex: 1 }} />
                      {/* Resource progress indicator */}
                      {progress[activeResource._id] && (
                        <span style={{ fontSize: 11, color: progress[activeResource._id]?.completed ? '#00c853' : '#ff9800', fontWeight: 600 }}>
                          {progress[activeResource._id]?.completed ? '✓ Completed' : `${progress[activeResource._id]?.progress_percent || 0}% watched`}
                        </span>
                      )}
                      <button className="cv-ctrl-btn" onClick={() => videoRef.current?.requestFullscreen()}>
                        <Maximize size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Player */}
              {isAudio(activeResource) && (
                <div className="cv-audio-box" onContextMenu={e => e.preventDefault()}>
                  <Headphones size={48} style={{ color: '#ff9800', marginBottom: 12 }} />
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{activeResource.title}</p>
                  <audio controls controlsList="nodownload" onContextMenu={e => e.preventDefault()} style={{ width: '100%', borderRadius: 8 }}
                    src={`http://localhost:5000${activeResource.file_url}`}
                    onTimeUpdate={e => saveProgress(activeResource._id, e.target.currentTime, e.target.duration)}
                  />
                </div>
              )}

              {/* PDF Viewer */}
              {isPDF(activeResource) && (
                <div className="cv-pdf-box" onContextMenu={e => e.preventDefault()}>
                  <iframe
                    src={`http://localhost:5000${activeResource.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="cv-pdf-frame"
                    title={activeResource.title}
                    onLoad={() => saveProgress(activeResource._id, 1, 1)}
                  />
                </div>
              )}

              {/* Other files */}
              {!isVideo(activeResource) && !isPDF(activeResource) && !isAudio(activeResource) && (
                <div className="cv-other-box">
                  <FileText size={48} style={{ color: '#7030e0', marginBottom: 12 }} />
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{activeResource.title}</p>
                  <a
                    href={`http://localhost:5000${activeResource.file_url}`}
                    target="_blank" rel="noreferrer"
                    className="btn-primary"
                    style={{ padding: '10px 24px', textDecoration: 'none', borderRadius: 10, fontSize: 14, display: 'inline-block' }}
                    onClick={() => saveProgress(activeResource._id, 1, 1)}
                  >
                    View File Inline ↗
                  </a>
                </div>
              )}


              <div className="cv-resource-title-bar">
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{activeResource.title}</h2>
                {activeResource.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0' }}>{activeResource.description}</p>}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-muted)' }}>
              <BookOpen size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p>Select a lesson from the sidebar to start learning</p>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <div className={`cv-sidebar${sidebarOpen ? '' : ' cv-sidebar-closed'}`}>
          <div className="cv-sidebar-header">
            <span style={{ fontSize: 13, fontWeight: 700 }}>Course Content</span>
            <button className="cv-ctrl-btn" onClick={() => setSidebarOpen(p => !p)} style={{ marginLeft: 'auto' }}>
              <ChevronRight size={14} style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
          </div>

          {sidebarOpen && Object.entries(grouped).map(([key, mod]) => (
            <div key={key} className="cv-module">
              <div className="cv-module-title">
                <BookOpen size={13} />
                {mod.title}
              </div>
              {mod.items.map(r => {
                const p = progress[r._id];
                const isActive = activeResource?._id === r._id;
                return (
                  <div
                    key={r._id}
                    className={`cv-lesson${isActive ? ' cv-lesson-active' : ''}`}
                    onClick={() => { setActiveResource(r); setIsPlaying(false); setVideoProgress(0); }}
                  >
                    <div className="cv-lesson-icon">
                      {p?.completed
                        ? <CheckCircle size={16} style={{ color: '#00c853' }} />
                        : isVideo(r) ? <Film size={14} style={{ color: '#2196f3' }} />
                        : isPDF(r)   ? <FileText size={14} style={{ color: '#ff9800' }} />
                        : isAudio(r) ? <Headphones size={14} style={{ color: '#ff9800' }} />
                        : <Circle size={14} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                    <div className="cv-lesson-info">
                      <span className="cv-lesson-name">{r.title}</span>
                      {p && !p.completed && p.progress_percent > 0 && (
                        <div className="cv-lesson-progress">
                          <div className="cv-lesson-progress-fill" style={{ width: `${p.progress_percent}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Assignments */}
          {(data?.assignments || []).length > 0 && sidebarOpen && (
            <div className="cv-module">
              <div className="cv-module-title"><ClipboardList size={13} /> Assignments</div>
              {data.assignments.map(a => (
                <div key={a._id} className="cv-lesson">
                  <ClipboardList size={14} style={{ color: '#ff9800', flexShrink: 0 }} />
                  <span className="cv-lesson-name" style={{ marginLeft: 10 }}>{a.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
