import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GraduationCap, MessageSquare, Globe, Zap, ArrowLeft, CheckCircle } from 'lucide-react';
import { auth } from '../services/api';
import '../styles/login.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
      await auth.resetPassword(token, password);
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
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle size={56} color="#22c55e" style={{ marginBottom: 16 }} />
              <h2>Password Reset!</h2>
              <p style={{ marginBottom: 24, lineHeight: 1.6 }}>
                Your password has been updated successfully.
              </p>
              <Link to="/login" className="login-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Sign In
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7030e0', fontSize: 13, fontWeight: 500, marginBottom: 24, textDecoration: 'none' }}>
                <ArrowLeft size={16} /> Back to Login
              </Link>
              <h2>Set New Password</h2>
              <p>Enter your new password below</p>
              {error && <div className="login-error">{error}</div>}
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
