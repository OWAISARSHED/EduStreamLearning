import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, MessageSquare, Globe, Zap, UserCheck, Upload } from 'lucide-react';
import { auth } from '../services/api';
import '../styles/login.css';

const ADMIN_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export default function Signup() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [idCardFile, setIdCardFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTos, setAgreeTos] = useState(false);
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
    if (role === 'admin' && !ADMIN_PASSWORD_REGEX.test(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return;
    }
    if (!agreeTos) {
      setError('You must agree to the Terms of Service and Privacy Policy');
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
    <div className="login-page" role="main" aria-label="Sign up page">
      <div className="login-left" aria-hidden="true">
        <div className="login-brand">
          <div className="login-brand-icon" aria-hidden="true">E</div>
          <h1>EduStream</h1>
          <p>{t('app.tagline')}</p>
        </div>
        <div className="login-features">
          <div className="login-feature">
            <GraduationCap size={20} aria-hidden="true" />
            <span>AI-powered learning assistance & document insights</span>
          </div>
          <div className="login-feature">
            <Globe size={20} aria-hidden="true" />
            <span>Multilingual support — English, Urdu & more</span>
          </div>
          <div className="login-feature">
            <MessageSquare size={20} aria-hidden="true" />
            <span>Interactive forums with mentor-verified responses</span>
          </div>
          <div className="login-feature">
            <Zap size={20} aria-hidden="true" />
            <span>Real-time collaboration & milestone tracking</span>
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-form-container">
          <h2>{t('auth.signup')}</h2>
          <p>Join EduStream and start your learning journey</p>
          {error && <div className="login-error" role="alert">{error}</div>}
          <form className="login-form" onSubmit={handleSignup} noValidate>
            <div className="form-group">
              <label htmlFor="signup-name">Full Name</label>
              <input id="signup-name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required aria-required="true" autoComplete="name" />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">{t('auth.email')}</label>
              <input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required aria-required="true" autoComplete="email" />
            </div>
            <div className="form-group">
              <label>I want to join as</label>
              <div className="role-selector" role="radiogroup" aria-label="Select role">
                <button type="button" className={`role-btn ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')} role="radio" aria-checked={role === 'student'}>
                  <UserCheck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden="true" />
                  Student
                </button>
                <button type="button" className={`role-btn ${role === 'mentor' ? 'active' : ''}`} onClick={() => setRole('mentor')} role="radio" aria-checked={role === 'mentor'}>
                  <UserCheck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden="true" />
                  Mentor
                </button>
              </div>
            </div>
            {role === 'mentor' && (
              <div className="form-group">
                <label htmlFor="idCardInput">Upload ID Card (Required for mentor verification)</label>
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => document.getElementById('idCardInput').click()} role="button" tabIndex={0} aria-label="Upload ID card" onKeyDown={e => e.key === 'Enter' && document.getElementById('idCardInput').click()}>
                  <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} aria-hidden="true" />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {idCardFile ? idCardFile.name : 'Click to upload your ID card'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Will be uploaded after account creation</p>
                  <input id="idCardInput" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setIdCardFile(e.target.files[0])} />
                </div>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="signup-password">{t('auth.password')}</label>
              <input id="signup-password" type="password" placeholder="Create a password (min. 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required aria-required="true" aria-describedby="password-reqs" autoComplete="new-password" />
              <span id="password-reqs" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {role === 'admin' ? 'Min 8 chars, uppercase, lowercase, number & special character required' : 'Min 6 characters'}
              </span>
            </div>
            <div className="form-group">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <input id="signup-confirm" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required aria-required="true" autoComplete="new-password" />
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="tos" checked={agreeTos} onChange={e => setAgreeTos(e.target.checked)} style={{ width: 16, height: 16 }} aria-required="true" />
              <label htmlFor="tos" style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                I agree to the <a href="/terms" target="_blank" style={{ color: '#7030e0' }} tabIndex={0}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color: '#7030e0' }} tabIndex={0}>Privacy Policy</a>
              </label>
            </div>
            <button type="submit" className="login-btn" disabled={loading} aria-label="Create your account">
              {loading ? 'Creating Account...' : t('auth.signup')}
            </button>
            {role === 'mentor' && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }} role="status">
                After registration, your account will be reviewed by an admin. You'll be able to log in once approved.
              </p>
            )}
            <div className="login-divider" role="separator" aria-orientation="horizontal">or continue with</div>
            <p className="register-link">
              {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
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
