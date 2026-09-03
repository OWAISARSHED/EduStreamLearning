import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, MessageSquare, Globe, Zap, UserCheck, Upload, Mail, CheckCircle, ArrowRight, RefreshCw, Shield } from 'lucide-react';
import { auth } from '../services/api';
import '../styles/login.css';

const ADMIN_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// steps: 'email' -> 'otp' -> 'details'
export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Step control
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'details'

  // Email step
  const [email, setEmail] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // OTP step
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Details step
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [idCardFile, setIdCardFile] = useState(null);
  const [agreeTos, setAgreeTos] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Step 1: Send OTP ─────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOtpSent(true);
      setStep('otp');

      // If backend returns dev_code (dev mode), auto-fill it
      if (data.dev_code) {
        setOtpDigits(data.dev_code.split(''));
        setSuccess(`Code: ${data.dev_code} (auto-filled for testing)`);
      } else {
        setSuccess('Verification code sent! Check your inbox.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  // ── OTP input handling ────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs[5].current?.focus();
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) { setError('Please enter all 6 digits'); return; }
    setError('');
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEmailVerified(true);
      setSuccess('');
      setStep('details');
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Step 3: Register ─────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Full name is required'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (role === 'admin' && !ADMIN_PASSWORD_REGEX.test(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return;
    }
    if (!agreeTos) { setError('You must agree to the Terms of Service and Privacy Policy'); return; }
    setLoading(true);
    try {
      let idCardUrl = '';
      if (role === 'mentor' && idCardFile) {
        try {
          const formData = new FormData();
          formData.append('file', idCardFile);
          const res = await fetch('/api/courses/upload-public', { method: 'POST', body: formData });
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

  // Step indicator
  const steps = [
    { id: 'email', label: 'Email' },
    { id: 'otp', label: 'Verify' },
    { id: 'details', label: 'Details' },
  ];
  const stepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="login-page" role="main" aria-label="Sign up page">
      <div className="login-left" aria-hidden="true">
        <div className="login-brand">
          <div className="login-brand-icon" aria-hidden="true">E</div>
          <h1>EduStream</h1>
          <p>{t('app.tagline')}</p>
        </div>
        <div className="login-features">
          <div className="login-feature"><GraduationCap size={20} aria-hidden="true" /><span>AI-powered learning assistance & document insights</span></div>
          <div className="login-feature"><Globe size={20} aria-hidden="true" /><span>Multilingual support — English, Urdu & more</span></div>
          <div className="login-feature"><MessageSquare size={20} aria-hidden="true" /><span>Interactive forums with mentor-verified responses</span></div>
          <div className="login-feature"><Zap size={20} aria-hidden="true" /><span>Real-time collaboration & milestone tracking</span></div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h2>{t('auth.signup')}</h2>
          <p>Join EduStream and start your learning journey</p>

          {/* Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, marginTop: 8 }}>
            {steps.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                  background: i < stepIndex ? 'var(--success)' : i === stepIndex ? '#7030e0' : 'var(--bg-secondary)',
                  color: i <= stepIndex ? '#fff' : 'var(--text-muted)',
                  border: i === stepIndex ? '2px solid #a855f7' : '2px solid transparent',
                  transition: 'all 0.3s',
                }}>
                  {i < stepIndex ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i === stepIndex ? '#a855f7' : i < stepIndex ? 'var(--success)' : 'var(--text-muted)', marginLeft: 6, marginRight: 6, whiteSpace: 'nowrap' }}>{s.label}</span>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < stepIndex ? 'var(--success)' : 'var(--border-color)', borderRadius: 2, margin: '0 8px', transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}
          {success && <div style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--success)', marginBottom: 16 }}>{success}</div>}

          {/* ── STEP 1: Email ── */}
          {step === 'email' && (
            <form className="login-form" onSubmit={handleSendOtp} noValidate>
              <div className="form-group">
                <label htmlFor="signup-email"><Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('auth.email')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    required
                    aria-required="true"
                    autoComplete="email"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={sendingOtp || !email}
                    style={{ padding: '10px 18px', fontSize: 13, whiteSpace: 'nowrap', borderRadius: 8, flexShrink: 0 }}
                  >
                    {sendingOtp ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><ArrowRight size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Send Code</>}
                  </button>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  We'll send a 6-digit verification code to this email.
                </span>
              </div>
              <p className="register-link" style={{ marginTop: 16 }}>
                {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
              </p>
            </form>
          )}

          {/* ── STEP 2: OTP Verify ── */}
          {step === 'otp' && (
            <form className="login-form" onSubmit={handleVerifyOtp} noValidate>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(112,48,224,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Mail size={24} style={{ color: '#a855f7' }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Check your inbox (also spam folder). Valid for 10 minutes.</p>
              </div>

              {/* 6-digit OTP boxes */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: 48, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 700,
                      borderRadius: 10, border: `2px solid ${digit ? '#7030e0' : 'var(--border-color)'}`,
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                  />
                ))}
              </div>

              <button type="submit" className="login-btn" disabled={verifyingOtp || otpDigits.join('').length < 6}>
                {verifyingOtp ? 'Verifying...' : <><Shield size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Verify Code</>}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12 }}>
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }} onClick={() => setStep('email')}>
                  ← Change email
                </button>
                <button type="button" style={{ background: 'none', border: 'none', color: '#7030e0', cursor: 'pointer', fontSize: 12 }} onClick={handleSendOtp} disabled={sendingOtp}>
                  {sendingOtp ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Details ── */}
          {step === 'details' && (
            <form className="login-form" onSubmit={handleSignup} noValidate>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12 }}>
                <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span style={{ color: 'var(--success)' }}>Email verified: <strong>{email}</strong></span>
              </div>

              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input id="signup-name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required aria-required="true" autoComplete="name" />
              </div>

              <div className="form-group">
                <label>I want to join as</label>
                <div className="role-selector" role="radiogroup" aria-label="Select role">
                  <button type="button" className={`role-btn ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')} role="radio" aria-checked={role === 'student'}>
                    <UserCheck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden="true" />Student
                  </button>
                  <button type="button" className={`role-btn ${role === 'mentor' ? 'active' : ''}`} onClick={() => setRole('mentor')} role="radio" aria-checked={role === 'mentor'}>
                    <UserCheck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden="true" />Mentor
                  </button>
                </div>
              </div>

              {role === 'mentor' && (
                <div className="form-group">
                  <label htmlFor="idCardInput">Upload ID Card <span style={{ color: '#ff9800', fontSize: 11 }}>(Required for mentor verification)</span></label>
                  <div style={{ border: `2px dashed ${idCardFile ? '#7030e0' : 'var(--border-color)'}`, borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer', background: idCardFile ? 'rgba(112,48,224,0.05)' : 'transparent', transition: 'all 0.2s' }}
                    onClick={() => document.getElementById('idCardInput').click()} role="button" tabIndex={0} aria-label="Upload ID card"
                    onKeyDown={e => e.key === 'Enter' && document.getElementById('idCardInput').click()}>
                    <Upload size={24} style={{ color: idCardFile ? '#a855f7' : 'var(--text-muted)', marginBottom: 8 }} aria-hidden="true" />
                    <p style={{ fontSize: 12, color: idCardFile ? '#a855f7' : 'var(--text-muted)', fontWeight: idCardFile ? 600 : 400 }}>
                      {idCardFile ? `✓ ${idCardFile.name}` : 'Click to upload your ID card'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG or PDF accepted</p>
                    <input id="idCardInput" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setIdCardFile(e.target.files[0])} />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="signup-password">{t('auth.password')}</label>
                <input id="signup-password" type="password" placeholder="Create a password (min. 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required aria-required="true" autoComplete="new-password" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {role === 'admin' ? 'Min 8 chars, uppercase, lowercase, number & special character' : 'Min 6 characters'}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="signup-confirm">Confirm Password</label>
                <input id="signup-confirm" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required aria-required="true" autoComplete="new-password" />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="tos" checked={agreeTos} onChange={e => setAgreeTos(e.target.checked)} style={{ width: 16, height: 16 }} aria-required="true" />
                <label htmlFor="tos" style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  I agree to the <a href="/terms" target="_blank" style={{ color: '#7030e0' }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color: '#7030e0' }}>Privacy Policy</a>
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

              <p className="register-link">
                {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
              </p>
            </form>
          )}

          <div className="login-footer">&copy; 2026 EduStream. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
}
