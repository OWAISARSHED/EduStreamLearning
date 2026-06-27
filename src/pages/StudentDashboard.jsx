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
      const res = await fetch('/api/courses', { headers: { Authorization: 'Bearer ' + localStorage.getItem('edustream_token') } });
      if (res.ok) {
        const all = await res.json();
        const enrolled = all.filter(c => c.is_enrolled);
        setEnrolledCourses(Array.isArray(enrolled) ? enrolled : []);
      }
    } catch (e) { /* ignore */ }
  };

  const handleEnroll = async (courseId) => {
    try {
      await courses.enroll(courseId);
      loadEnrollments();
      courses.list({}).then(setAvailableCourses).catch(() => {});
    } catch (e) {
      alert(e.message);
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
          {enrolledCourses.length === 0 && availableCourses.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '16px 0' }}>No courses available yet</p>
          ) : (
            <>
              {enrolledCourses.map((c, i) => (
                <div key={i} className="course-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/resources')}>
                  <div className="course-card-top">
                    <div>
                      <h4>{c.title}</h4>
                      <div className="mentor">{c.mentor_id?.name || 'Instructor'}</div>
                    </div>
                    <span className="status in-progress">{c.enrolled_count || 0} students</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill purple" style={{ width: `${c.progress_percent || 0}%` }} />
                  </div>
                  <div className="progress-info">
                    <span>Progress</span>
                    <span>{c.progress_percent || 0}%</span>
                  </div>
                </div>
              ))}
              {availableCourses.filter(c => !enrolledCourses.find(e => e._id === c._id)).slice(0, 3).map((c, i) => (
                <div key={i} className="course-card">
                  <div className="course-card-top">
                    <div>
                      <h4>{c.title}</h4>
                      <div className="mentor">{c.mentor_id?.name || 'Instructor'}  |  {c.level}</div>
                    </div>
                    <button className="action-btn" style={{ background: 'rgba(112,48,224,0.15)', color: 'var(--accent-light)' }}
                      onClick={() => handleEnroll(c._id)}>
                      Enroll
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{(c.description || '').substring(0, 100)}...</p>
                </div>
              ))}
            </>
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
