import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { users as usersApi } from '../services/api';
import '../styles/profile.css';

export default function UserProfile() {
  const { user } = useAuth();
  const [lang, setLang] = useState(user?.language_preference || 'en');
  const [autoTranslate, setAutoTranslate] = useState(user?.auto_translate_enabled ?? true);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [title, setTitle] = useState(user?.title || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersApi.update(user._id, { name, title, language_preference: lang, auto_translate_enabled: autoTranslate });
    } catch (e) {}
    setSaving(false);
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const s = user?.stats || {};

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile & Preferences</h1>
          <p className="page-subtitle">Manage your account settings and personalization options</p>
        </div>
        <button className="save-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      <div className="profile-layout">
        <div className="profile-sidebar-card">
          <div className="profile-avatar-large">{initials}</div>
          <h3>{user?.name}</h3>
          <div className="role-tag">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</div>
          <div className="email">{user?.email}</div>
          <div className="profile-stats">
            <div className="profile-stat"><h4>{s.total_hours || 0}h</h4><p>Hours</p></div>
            <div className="profile-stat"><h4>{s.certificates_count || 0}</h4><p>Certificates</p></div>
            <div className="profile-stat"><h4>{s.weekly_goal_percent || 0}%</h4><p>Goal</p></div>
          </div>
        </div>

        <div className="profile-main">
          <div className="profile-card">
            <div className="profile-card-header">
              <h3>Personal Information</h3>
            </div>
            <div className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Title / Status</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Pro Learner" />
              </div>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-header">
              <h3>Preferences</h3>
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <h4>Language Preference</h4>
                <p>Choose your primary interface language</p>
              </div>
              <select value={lang} onChange={e => setLang(e.target.value)}
                style={{ padding: '8px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                <option value="en">English</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="ks">Kashmiri</option>
              </select>
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <h4>Auto-Translate Queries</h4>
                <p>Automatically translate community queries to your preferred language</p>
              </div>
              <button className={`toggle${autoTranslate ? ' on' : ''}`} onClick={() => setAutoTranslate(!autoTranslate)} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
