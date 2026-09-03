import { useState, useEffect } from 'react';
import { Clock, BookOpen, Award, FileText, MessageSquare, Sparkles, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { milestones, forum, courses } from '../services/api';
import '../styles/dashboard.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [recentThreads, setRecentThreads] = useState([]);

  useEffect(() => {
    milestones.list({ status: 'in_progress' }).then(setEnrolledCourses).catch(() => {});
    forum.threads({}).then(threads => setRecentThreads(threads.slice(0, 4))).catch(() => {});
    courses.list({}).then(setAvailableCourses).catch(() => {});
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const token = localStorage.getItem('edustream_token');
      // Get all approved courses
      const res = await fetch('/api/courses?status=approved', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) return;
      const all = await res.json();
      // Get enrollments for current student
      const enrollRes = await fetch('/api/users/my-enrollments', { headers: { Authorization: 'Bearer ' + token } });
      if (enrollRes.ok) {
        const enrollments = await enrollRes.json();
        const enrollMap = new Map();
        (enrollments || []).forEach(e => {
          if (e.course_id) {
            const cid = typeof e.course_id === 'object' ? e.course_id._id?.toString() : e.course_id.toString();
            enrollMap.set(cid, e.progress_percent || 0);
          }
        });
        const enrolled = (Array.isArray(all) ? all : [])
          .filter(c => enrollMap.has(c._id?.toString()))
          .map(c => ({
            ...c,
            progress_percent: enrollMap.get(c._id?.toString()) || 0,
          }));
        setEnrolledCourses(enrolled);
        setAvailableCourses((Array.isArray(all) ? all : []).filter(c => !enrollMap.has(c._id?.toString())));
      } else {
        setAvailableCourses(Array.isArray(all) ? all : []);
      }
    } catch (e) { /* ignore */ }
  };


  const handleEnroll = async (courseId) => {
    try {
      await courses.enroll(courseId);
      await loadEnrollments();
      navigate(`/course/${courseId}`);
    } catch (e) {
      alert(e.message || 'Enrollment failed');
    }
  };


  const s = user?.stats || {};

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}! Continue your learning journey.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><Clock size={22} /></div>
          <div className="stat-info">
            <h4>{s.total_hours || 47}h</h4>
            <p>Learning Hours</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Award size={22} /></div>
          <div className="stat-info">
            <h4>{s.certificates_count || 12}</h4>
            <p>Certificates</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><BookOpen size={22} /></div>
          <div className="stat-info">
            <h4>{s.weekly_goal_percent || 68}%</h4>
            <p>Weekly Goal</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>My Enrolled Courses</h3>
          </div>
          {enrolledCourses.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '16px 0' }}>
              No enrolled courses yet. Enroll in a course below to start learning!
            </p>
          ) : (
            enrolledCourses.map((c, i) => (
              <div key={c._id || i} className="course-card">
                <div className="course-card-top">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</h4>
                    <div className="mentor">{c.mentor_id?.name || 'Instructor'} &bull; {c.level}</div>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 }}
                    onClick={() => navigate(`/course/${c._id}`)}
                  >
                    ▶ Watch Now
                  </button>
                </div>
                <div className="progress-bar" style={{ marginTop: 10 }}>
                  <div className="progress-fill purple" style={{ width: `${c.progress_percent || 0}%` }} />
                </div>
                <div className="progress-info">
                  <span>Course Progress</span>
                  <span style={{ color: '#7030e0', fontWeight: 600 }}>{c.progress_percent || 0}%</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Recent Forum Activity</h3>
            <span className="see-all" onClick={() => navigate('/forum')} style={{ cursor: 'pointer' }}>See All</span>
          </div>
          {recentThreads.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '16px 0' }}>No recent activity</p>
          ) : recentThreads.map((t, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot purple" />
              <div>
                <div className="activity-text">{t.title}</div>
                <div className="activity-time">{t.reply_count} replies</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-card full-width">
          <div className="dashboard-card-header">
            <h3>Available Courses</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {availableCourses.filter(c => !enrolledCourses.find(e => e._id === c._id)).slice(0, 6).map((c, i) => (
              <div key={i} style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                <h4 style={{ fontSize: 13, marginBottom: 4 }}>{c.title}</h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{c.mentor_id?.name}  |  {c.level}</p>
                <button className="action-btn" style={{ background: 'rgba(112,48,224,0.15)', color: 'var(--accent-light)' }} onClick={() => handleEnroll(c._id)}>
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card full-width">
          <div className="dashboard-card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate('/ai-chat')}><Sparkles size={18} /> AI Query Assistant</button>
            <button className="quick-action-btn" onClick={() => navigate('/forum')}><MessageSquare size={18} /> Discussion Forum</button>
            <button className="quick-action-btn" onClick={() => navigate('/ai-insights')}><FileText size={18} /> Document Insights</button>
            <button className="quick-action-btn" onClick={() => navigate('/resources')}><Users size={18} /> Resources</button>
          </div>
        </div>
      </div>
    </>
  );
}
