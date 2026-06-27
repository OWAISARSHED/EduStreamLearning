import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, MessageSquare, Globe, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

export default function Login() {
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
          <h2>Welcome Back</h2>
          <p>Sign in to continue your learning journey</p>
          {error && <div className="login-error">{error}</div>}
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="form-options">
              <label>
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <a href="#">Forgot password?</a>
            </div>
            <button type="submit" className="login-btn">Sign In</button>
            <div className="login-divider">or continue with</div>
            <p className="register-link">
              Don't have an account? <Link to="/signup">Sign up</Link>
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
