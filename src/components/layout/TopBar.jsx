import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'U';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-search">
          <Search size={16} color="#505060" />
          <input type="text" placeholder="Search courses, mentors, resources..." />
        </div>
      </div>
      <div className="topbar-right">
        <button className="topbar-icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="topbar-icon-btn" onClick={() => navigate('/notifications')}>
          <Bell size={18} />
          <span className="dot" />
        </button>
        <div className="topbar-user" onClick={() => navigate('/profile')}>
          <div className="topbar-avatar">{initials}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.name || 'User'}</span>
            <span className="topbar-user-role">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
