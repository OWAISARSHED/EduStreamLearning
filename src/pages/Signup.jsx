import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, MessageSquare, Globe, Zap, UserCheck, Upload } from 'lucide-react';
import { auth } from '../services/api';
import '../styles/login.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [idCardFile, setIdCardFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      let idCardUrl = '';
      if (role === 'mentor' && idCardFile) {
        try {
          const formData = new FormData();
          formData.append('file', idCardFile);
          const res = await fetch('/api/courses/upload-public', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const uploadData = await res.json();
            idCardUrl = uploadData.file_url;
          }
        } catch (e) { /* upload non-critical */ }
      }

      await auth.register({ name, email, password, role, id_card_url: idCardUrl });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">E</div>
          <h1>EduStream</h1>
          <p>AI-Assisted Learning & Multilingual Mentor Ecosystem powered by intelligent technology</p>
        </div>
        <div className="login-features">
          <div className="login-feature">
            <GraduationCap size={20} />
            <span>AI-powered learning assistance & document insights</span>
          </div>
          <div className="login-feature">
            <Globe size={20} />
            <span>Multilingual support — English, Urdu & more</span>
          </div>
          <div className="login-feature">
            <MessageSquare size={20} />
            <span>Interactive forums with mentor-verified responses</span>
          </div>
          <div className="login-feature">
            <Zap size={20} />
            <span>Real-time collaboration & milestone tracking</span>
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-form-container">
          <h2>Create Account</h2>
          <p>Join EduStream and start your learning journey</p>
          {error && <div className="login-error">{error}</div>}
          <form className="login-form" onSubmit={handleSignup}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>I want to join as</label>
              <div className="role-selector">
                <button type="button" className={`role-btn ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
                  <UserCheck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Student
                </button>
                <button type="button" className={`role-btn ${role === 'mentor' ? 'active' : ''}`} onClick={() => setRole('mentor')}>
                  <UserCheck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Mentor
                </button>
              </div>
            </div>
            {role === 'mentor' && (
              <div className="form-group">
                <label>Upload ID Card (Required for mentor verification)</label>
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => document.getElementById('idCardInput').click()}>
                  <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {idCardFile ? idCardFile.name : 'Click to upload your ID card'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Will be uploaded after account creation</p>
                  <input id="idCardInput" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setIdCardFile(e.target.files[0])} />
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Create a password (min. 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            {role === 'mentor' && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                After registration, your account will be reviewed by an admin. You'll be able to log in once approved.
              </p>
            )}
            <div className="login-divider">or continue with</div>
            <p className="register-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
          <div className="login-footer">
            &copy; 2026 EduStream. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
