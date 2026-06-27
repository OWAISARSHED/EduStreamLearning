import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, MessageSquare, Globe, Zap, ArrowLeft, CheckCircle } from 'lucide-react';
import { auth } from '../services/api';
import '../styles/login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSuccess(true);
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
          {success ? (
            <>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={56} color="#22c55e" style={{ marginBottom: 16 }} />
                <h2>Check Your Email</h2>
                <p style={{ marginBottom: 24, lineHeight: 1.6 }}>
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link. It expires in 1 hour.
                </p>
                <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>
                  (In development, the reset link is printed in the server console.)
                </p>
                <Link to="/login" className="login-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7030e0', fontSize: 13, fontWeight: 500, marginBottom: 24, textDecoration: 'none' }}>
                <ArrowLeft size={16} /> Back to Login
              </Link>
              <h2>Reset Password</h2>
              <p>Enter your email and we'll send you a reset link</p>
              {error && <div className="login-error">{error}</div>}
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="register-link" style={{ marginTop: 24 }}>
                Remember your password? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
