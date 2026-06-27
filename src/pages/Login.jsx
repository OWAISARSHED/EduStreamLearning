import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, MessageSquare, Globe, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'student' ? '/dashboard' : user.role === 'mentor' ? '/mentor' : '/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page" role="main" aria-label="Login page">
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
          <h2>{t('auth.login')}</h2>
          <p>Sign in to continue your learning journey</p>
          {error && <div className="login-error" role="alert">{error}</div>}
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label htmlFor="login-email">{t('auth.email')}</label>
              <input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required aria-required="true" autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">{t('auth.password')}</label>
              <input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required aria-required="true" autoComplete="current-password" />
            </div>
            <div className="form-options">
              <label>
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <Link to="/forgot-password" aria-label="Forgot password">{t('auth.forgotPassword')}</Link>
            </div>
            <button type="submit" className="login-btn" aria-label="Sign in to your account">{t('auth.login')}</button>
            <div className="login-divider" role="separator" aria-orientation="horizontal">or continue with</div>
            <p className="register-link">
              {t('auth.noAccount')} <Link to="/signup">{t('auth.signup')}</Link>
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
