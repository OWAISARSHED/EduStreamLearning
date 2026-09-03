import { useState, useEffect, useRef } from 'react';
import { Plus, BookOpen, Users, Clock, Upload, FileText, Target, Send, Trash2, Edit3, ChevronDown, ChevronUp, ExternalLink, AlertCircle, FolderOpen, Film, Headphones, Image, X } from 'lucide-react';
import { courses, forum } from '../services/api';
import '../styles/mentor.css';

export default function MentorWorkspace() {
  const [myCourses, setMyCourses] = useState([]);
  const [stats, setStats] = useState({ totalCourses: 0, totalEnrollments: 0, totalWatchTimeSeconds: 0 });
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', level: 'beginner', language: 'English' });
  const [modules, setModules] = useState([{ title: 'Module 1', files: [] }]);
  const [saving, setSaving] = useState(false);
  const [studentProgressList, setStudentProgressList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const fileInputRefs = useRef({});

  useEffect(() => {
    loadData();
    loadStudentProgress();
  }, []);

  const loadStudentProgress = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch('/api/courses/mentor/students-progress', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('edustream_token') }
      });
      if (res.ok) setStudentProgressList(await res.json());
    } catch (e) {}
    setLoadingStudents(false);
  };


  const loadData = async () => {
    try {
      const list = await courses.list({});
      setMyCourses(Array.isArray(list) ? list : []);
    } catch (e) { /* ignore */ }
    try {
      const res = await fetch('/api/users/mentor-stats', { headers: { Authorization: 'Bearer ' + localStorage.getItem('edustream_token') } });
      if (res.ok) setStats(await res.json());
    } catch (e) { /* ignore */ }
  };

  const openCreateForm = () => {
    setForm({ title: '', description: '', category: '', level: 'beginner', language: 'English' });
    setModules([{ title: 'Module 1', files: [] }]);
    setEditCourse(null);
    setShowCreateForm(true);
    setSelectedCourse(null);
    setCourseDetail(null);
  };

  const openEditForm = (c) => {
    setForm({ title: c.title, description: c.description, category: c.category, level: c.level, language: c.language || 'English' });
    setEditCourse(c);
    setShowCreateForm(true);
    setModules([]);
  };

  const handleFilesSelected = (moduleIdx, fileList) => {
    const newFiles = Array.from(fileList).map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      type: f.name.split('.').pop().toLowerCase(),
      uploading: false,
      uploaded: false,
      file_url: '',
    }));
    setModules(prev => prev.map((m, i) =>
      i === moduleIdx ? { ...m, files: [...m.files, ...newFiles] } : m
    ));
  };

  const removeFile = (moduleIdx, fileIdx) => {
    setModules(prev => prev.map((m, i) =>
      i === moduleIdx ? { ...m, files: m.files.filter((_, fi) => fi !== fileIdx) } : m
    ));
  };

  const addModule = () => {
    setModules(prev => [...prev, { title: `Module ${prev.length + 1}`, files: [] }]);
  };

  const removeModule = (idx) => {
    setModules(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title is required');
    setSaving(true);
    try {
      let course;
      if (editCourse) {
        await courses.update(editCourse._id, form);
        course = editCourse;
      } else {
        course = await courses.create(form);
      }

      for (const mod of modules) {
        for (const f of mod.files) {
          if (f.uploaded) continue;
          try {
            const uploadRes = await courses.upload(f.file);
            await courses.addResource(course._id, {
              title: f.name,
              file_url: uploadRes.file_url,
              file_type: uploadRes.file_type || f.type,
              file_size: uploadRes.file_size || f.size,
              module_number: modules.indexOf(mod) + 1,
              module_title: mod.title,
            });
          } catch (e) { /* skip failed file */ }
        }
      }

      setShowCreateForm(false);
      setEditCourse(null);
      loadData();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    await courses.delete(id);
    if (selectedCourse === id) { setSelectedCourse(null); setCourseDetail(null); }
    loadData();
  };

  const handleSubmit = async (id) => {
    await courses.submit(id);
    loadData();
  };

  const viewCourse = async (course) => {
    setSelectedCourse(course._id);
    try {
      const data = await courses.get(course._id);
      setCourseDetail(data);
    } catch (e) { setCourseDetail(null); }
  };

  const addResource = async () => {
    const moduleNum = prompt('Module number (e.g. 1, 2, 3):', '1');
    if (!moduleNum) return;
    const moduleTitle = prompt('Module title:', `Module ${moduleNum}`);
    if (!moduleTitle) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      for (const file of Array.from(e.target.files)) {
        if (!file || !courseDetail) continue;
        try {
          const uploadRes = await courses.upload(file);
          await courses.addResource(courseDetail.course._id, { title: file.name, file_url: uploadRes.file_url, file_type: uploadRes.file_type, file_size: uploadRes.file_size, module_number: parseInt(moduleNum), module_title: moduleTitle });
        } catch (err) { /* skip failed */ }
      }
      viewCourse(courseDetail.course);
    };
    input.click();
  };

  const deleteResource = async (id) => {
    await courses.deleteResource(id);
    viewCourse(courseDetail.course);
  };

  const addAssignment = async () => {
    const title = prompt('Assignment title:');
    if (!title || !courseDetail) return;
    await courses.addAssignment(courseDetail.course._id, { title, description: '', due_date: null, total_points: 100 });
    viewCourse(courseDetail.course);
  };

  const deleteAssignment = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    await courses.deleteAssignment(id);
    viewCourse(courseDetail.course);
  };

  const addQuiz = async () => {
    const title = prompt('Quiz title:');
    if (!title || !courseDetail) return;
    await courses.addQuiz(courseDetail.course._id, { title, description: '', questions: [{ question_text: 'Sample question?', options: ['Option A', 'Option B'], correct_answer: 0, points: 10 }], time_limit_minutes: 30, passing_score: 60 });
    viewCourse(courseDetail.course);
  };

  const deleteQuiz = async (id) => {
    if (!confirm('Delete this quiz?')) return;
    await courses.deleteQuiz(id);
    viewCourse(courseDetail.course);
  };

  const formatTime = (s) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

  const statusColor = (s) => {
    if (s === 'approved') return { bg: 'rgba(0,200,83,0.15)', color: '#00c853' };
    if (s === 'pending') return { bg: 'rgba(255,152,0,0.15)', color: '#ff9800' };
    if (s === 'rejected') return { bg: 'rgba(255,68,68,0.15)', color: '#ff4444' };
    return { bg: 'rgba(112,48,224,0.15)', color: '#7030e0' };
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mentor Dashboard</h1>
          <p className="page-subtitle">Create courses, add resources, assignments, quizzes — submit for admin approval</p>
        </div>
      </div>

      <div className="mentor-stats">
        <div className="mentor-stat"><h4>{stats.totalCourses}</h4><p>Total Courses</p></div>
        <div className="mentor-stat"><h4>{stats.totalEnrollments}</h4><p>Enrolled Students</p></div>
        <div className="mentor-stat"><h4>{formatTime(stats.totalWatchTimeSeconds)}</h4><p>Total Watch Time</p></div>
        <div className="mentor-stat"><h4>{myCourses.filter(c => c.status === 'approved').length}</h4><p>Approved</p></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['courses', 'students'].map(t => (
          <button key={t} onClick={() => { setActiveTab(t); setSelectedCourse(null); setCourseDetail(null); }}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeTab === t ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: activeTab === t ? '#fff' : 'var(--text-secondary)' }}>
            {t === 'courses' ? 'My Courses' : 'Student Progress'}
          </button>
        ))}
      </div>

      {activeTab === 'courses' && (
        <div className="mentor-card" style={{ marginBottom: 16 }}>
          <div className="mentor-card-header">
            <h3><BookOpen size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> My Courses</h3>
            {!selectedCourse && <button className="action-btn" onClick={openCreateForm}><Plus size={14} /> New Course</button>}
            {selectedCourse && <button className="action-btn" onClick={() => { setSelectedCourse(null); setCourseDetail(null); }}>← Back to Courses</button>}
          </div>

          {!selectedCourse && showCreateForm && (
            <div style={{ padding: 16, marginBottom: 12, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-tertiary)' }}>
              <h4 style={{ fontSize: 14, marginBottom: 12 }}>{editCourse ? 'Edit Course' : 'Create New Course'}</h4>
              <input style={s} placeholder="Course title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea style={{ ...s, minHeight: 60, resize: 'vertical' }} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...s, flex: 1 }} placeholder="Category (e.g. Programming, Math)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                <select style={{ ...s, width: 140 }} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select style={{ ...s, flex: 1 }} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Kashmiri">Kashmiri</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {!editCourse && (
                <div style={{ marginTop: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h5 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>
                      <FolderOpen size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Course Modules
                    </h5>
                    <button className="action-btn" onClick={addModule}><Plus size={13} /> Add Module</button>
                  </div>
                  {modules.map((mod, mi) => (
                    <div key={mi} style={{ marginBottom: 12, padding: 12, border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <input style={{ flex: 1, padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12 }} placeholder="Module title" value={mod.title} onChange={e => setModules(prev => prev.map((m, i) => i === mi ? { ...m, title: e.target.value } : m))} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{mod.files.length} file(s)</span>
                        {modules.length > 1 && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-light)', padding: 2 }} onClick={() => removeModule(mi)}><Trash2 size={14} /></button>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        {['ppt', 'pptx', 'pdf', 'mp4', 'webm', 'mp3', 'wav', 'doc', 'docx', 'xlsx', 'zip'].map(ext => (
                          <label key={ext} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, background: mod.files.some(f => f.type === ext) ? 'rgba(112,48,224,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', cursor: 'pointer', color: mod.files.some(f => f.type === ext) ? 'var(--accent-light)' : 'var(--text-muted)', fontWeight: 500 }}>
                            <input type="file" accept={ext === 'ppt' || ext === 'pptx' ? '.ppt,.pptx' : ext === 'pdf' ? '.pdf' : ext === 'mp4' || ext === 'webm' ? '.mp4,.webm' : ext === 'mp3' || ext === 'wav' ? '.mp3,.wav' : ext === 'doc' || ext === 'docx' ? '.doc,.docx' : ext === 'xlsx' ? '.xlsx' : ext === 'zip' ? '.zip' : ''} style={{ display: 'none' }} onChange={e => { if (e.target.files.length) handleFilesSelected(mi, e.target.files); e.target.value = ''; }} />
                                            .{ext}
                                          </label>
                                        ))}
                                      </div>
                                      {mod.files.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                          {mod.files.map((f, fi) => (
                                            <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.15)', fontSize: 12 }}>
                                              {['mp4', 'webm'].includes(f.type) ? <Film size={12} style={{ color: '#2196f3' }} /> :
                                               ['mp3', 'wav'].includes(f.type) ? <Headphones size={12} style={{ color: '#ff9800' }} /> :
                                               ['jpg', 'jpeg', 'png', 'gif'].includes(f.type) ? <Image size={12} style={{ color: '#00c853' }} /> :
                                               <FileText size={12} style={{ color: 'var(--text-muted)' }} />}
                                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{f.name}</span>
                                              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-light)', padding: 2 }} onClick={() => removeFile(mi, fi)}><X size={12} /></button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={handleSave} disabled={saving}>
                                  {saving ? 'Saving...' : editCourse ? 'Update Course' : 'Create Course'}
                                </button>
                                <button className="action-btn" onClick={() => { setShowCreateForm(false); setEditCourse(null); }}>Cancel</button>
                              </div>
                            </div>
                          )}

          {!selectedCourse && !showCreateForm && myCourses.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>You haven't created any courses yet.</p>
              <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }} onClick={openCreateForm}>
                <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Create Your First Course
              </button>
            </div>
          )}

          {!selectedCourse && myCourses.map((c, i) => (
            <div key={c._id} className="query-item" style={{ cursor: 'pointer' }} onClick={() => viewCourse(c)}>
              <div className="query-avatar" style={{ background: statusColor(c.status).color }}><BookOpen size={16} /></div>
              <div className="query-content">
                <h4>{c.title}</h4>
                <p>{c.description?.substring(0, 100) || 'No description'}</p>
                <div className="query-meta">
                  <span className="time">{new Date(c.created_at).toLocaleDateString()}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: statusColor(c.status).bg, color: statusColor(c.status).color, fontWeight: 500 }}>
                    {c.status?.charAt(0).toUpperCase() + c.status?.slice(1)}
                  </span>
                  {c.language && <span className="time">{c.language}</span>}
                  {c.enrolled_count > 0 && <span className="time">{c.enrolled_count} enrolled</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                <button className="action-btn" onClick={(e) => { e.stopPropagation(); openEditForm(c); }}><Edit3 size={12} /> Edit</button>
                {c.status === 'draft' && (
                  <button className="action-btn" style={{ background: 'rgba(0,200,83,0.15)', color: '#00c853' }} onClick={(e) => { e.stopPropagation(); handleSubmit(c._id); }}>
                    <Send size={12} /> Submit
                  </button>
                )}
                <button className="action-btn" style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444' }} onClick={(e) => { e.stopPropagation(); handleDelete(c._id); }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}

          {selectedCourse && courseDetail && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 16, marginBottom: 4 }}>{courseDetail.course?.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{courseDetail.course?.description}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: statusColor(courseDetail.course?.status).bg, color: statusColor(courseDetail.course?.status).color, fontWeight: 500 }}>
                    {courseDetail.course?.status?.charAt(0).toUpperCase() + courseDetail.course?.status?.slice(1)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Level: {courseDetail.course?.level}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Category: {courseDetail.course?.category}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Language: {courseDetail.course?.language || 'English'}</span>
                  {courseDetail.course?.status === 'rejected' && courseDetail.course?.rejection_reason && (
                    <span style={{ fontSize: 11, color: '#ff4444' }}>Reason: {courseDetail.course.rejection_reason}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button className="action-btn" onClick={addResource}><Upload size={14} /> Add Resource</button>
                <button className="action-btn" onClick={addAssignment}><FileText size={14} /> Add Assignment</button>
                <button className="action-btn" onClick={addQuiz}><Target size={14} /> Add Quiz</button>
                {courseDetail.course?.status === 'draft' && (
                  <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => handleSubmit(courseDetail.course._id)}>
                    <Send size={14} /> Submit for Approval
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, marginBottom: 8, color: 'var(--accent-light)' }}>
                  <Upload size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Resources ({courseDetail.resources?.length || 0})
                </h4>
                {(!courseDetail.resources || courseDetail.resources.length === 0) ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No resources yet. Click "Add Resource" to upload files.</p>
                ) : (() => {
                  const grouped = {};
                  courseDetail.resources.forEach(r => {
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
                        const ext = (r.file_type || '').toLowerCase();
                        const icon = ['mp4', 'webm'].includes(ext) ? <Film size={16} style={{ color: '#2196f3' }} /> :
                                     ['mp3', 'wav'].includes(ext) ? <Headphones size={16} style={{ color: '#ff9800' }} /> :
                                     ['jpg', 'jpeg', 'png', 'gif'].includes(ext) ? <Image size={16} style={{ color: '#00c853' }} /> :
                                     <FileText size={16} style={{ color: 'var(--accent-light)' }} />;
                        return (
                          <div key={r._id} className="resource-list-item">
                            {icon}
                            <span style={{ flex: 1, fontSize: 13 }}>{r.title}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8, textTransform: 'uppercase' }}>{ext}</span>
                            {r.file_size ? <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>{(r.file_size / 1024 / 1024).toFixed(1)} MB</span> : null}
                            <button className="action-btn" style={{ background: 'rgba(255,68,68,0.12)', color: '#ff4444' }} onClick={() => deleteResource(r._id)}><Trash2 size={12} /></button>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, marginBottom: 8, color: 'var(--accent-light)' }}>
                  <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Assignments ({courseDetail.assignments?.length || 0})
                </h4>
                {(!courseDetail.assignments || courseDetail.assignments.length === 0) ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No assignments yet.</p>
                ) : courseDetail.assignments.map(a => (
                  <div key={a._id} className="resource-list-item">
                    <FileText size={16} style={{ color: '#ff9800' }} />
                    <span style={{ flex: 1, fontSize: 13 }}>{a.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>{a.total_points} pts</span>
                    {a.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                    <button className="action-btn" style={{ background: 'rgba(255,68,68,0.12)', color: '#ff4444' }} onClick={() => deleteAssignment(a._id)}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, marginBottom: 8, color: 'var(--accent-light)' }}>
                  <Target size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Quizzes ({courseDetail.quizzes?.length || 0})
                </h4>
                {(!courseDetail.quizzes || courseDetail.quizzes.length === 0) ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No quizzes yet.</p>
                ) : courseDetail.quizzes.map(q => (
                  <div key={q._id} className="resource-list-item">
                    <Target size={16} style={{ color: '#2196f3' }} />
                    <span style={{ flex: 1, fontSize: 13 }}>{q.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>{q.questions?.length || 0} questions · {q.time_limit_minutes} min</span>
                    <button className="action-btn" style={{ background: 'rgba(255,68,68,0.12)', color: '#ff4444' }} onClick={() => deleteQuiz(q._id)}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="mentor-card">
          <div className="mentor-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><Users size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Student Progress & Course Completion</h3>
            <button className="action-btn" onClick={loadStudentProgress} style={{ fontSize: 12, padding: '4px 10px' }}>↻ Refresh</button>
          </div>

          {loadingStudents ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>Loading student progress...</p>
          ) : studentProgressList.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>No students enrolled in your courses yet.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table className="admin-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Student</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Course</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Progress</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Enrolled Date</th>
                  </tr>
                </thead>
                <tbody>
                  {studentProgressList.map((e, i) => {
                    const studentName = e.student_id?.name || 'Student';
                    const studentEmail = e.student_id?.email || '';
                    const courseTitle = e.course_id?.title || 'Course';
                    const pct = e.progress_percent || 0;
                    const isDone = e.completed || pct >= 90;

                    return (
                      <tr key={e._id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{studentName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{studentEmail}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>{courseTitle}</td>
                        <td style={{ padding: '12px', minWidth: 150 }}>
                          <div className="progress-bar" style={{ height: 6, marginBottom: 4, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                            <div className="progress-fill" style={{ height: '100%', width: `${pct}%`, background: isDone ? '#00c853' : '#7030e0', transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: isDone ? '#00c853' : 'var(--accent-light)' }}>
                            {pct}% Completed
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {isDone ? (
                            <span style={{ background: 'rgba(0,200,83,0.15)', color: '#00c853', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              ✓ Course Completed
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(255,152,0,0.15)', color: '#ff9800', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                              In Progress ({pct}%)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)' }}>
                          {e.created_at ? new Date(e.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </>
  );
}

const s = {
  width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, marginBottom: 8, boxSizing: 'border-box',
};
