import { Search, Bell, Sun, Moon, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'U';

  const toggleLanguage = () => {
    const next = i18n.language === 'ur' ? 'en' : 'ur';
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <div className="topbar-search">
          <Search size={16} color="#505060" aria-hidden="true" />
          <input type="text" placeholder="Search courses, mentors, resources..." aria-label="Search" />
        </div>
      </div>
      <div className="topbar-right">
        <button className="topbar-icon-btn" onClick={toggleLanguage} title={`Switch to ${i18n.language === 'ur' ? 'English' : 'Urdu'}`} aria-label={`Switch to ${i18n.language === 'ur' ? 'English' : 'Urdu'}`}>
          <Globe size={18} />
          <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 2 }}>{i18n.language === 'ur' ? 'EN' : 'اردو'}</span>
        </button>
        <button className="topbar-icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="topbar-icon-btn" onClick={() => navigate('/notifications')} aria-label="Notifications">
          <Bell size={18} aria-hidden="true" />
          <span className="dot" aria-hidden="true" />
        </button>
        <div className="topbar-user" onClick={() => navigate('/profile')} role="button" tabIndex={0} aria-label="View profile" onKeyDown={e => e.key === 'Enter' && navigate('/profile')}>
          <div className="topbar-avatar" aria-hidden="true">{initials}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.name || 'User'}</span>
            <span className="topbar-user-role">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
