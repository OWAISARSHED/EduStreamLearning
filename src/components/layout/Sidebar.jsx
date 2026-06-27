import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FileText, BookOpen, Bell, Settings, Shield, Sparkles, Bot, LogOut, GraduationCap, BarChart3, Clock, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notifications as notifApi } from '../../services/api';

const allNavItems = {
  student: [
    { section: 'Main Menu' },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'AI Prompt', icon: Sparkles, path: '/ai-prompt' },
    { label: 'Forum', icon: MessageSquare, path: '/forum' },
    { label: 'AI Insights', icon: FileText, path: '/ai-insights' },
    { label: 'AI Chat', icon: Bot, path: '/ai-chat' },
    { label: 'Resources', icon: BookOpen, path: '/resources' },
    { section: 'Account' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
    { label: 'Profile', icon: Settings, path: '/profile' },
  ],
  mentor: [
    { section: 'Main Menu' },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/mentor' },
    { label: 'My Courses', icon: GraduationCap, path: '/mentor' },
    { label: 'Forum', icon: MessageSquare, path: '/forum' },
    { label: 'AI Insights', icon: FileText, path: '/ai-insights' },
    { label: 'AI Chat', icon: Bot, path: '/ai-chat' },
    { label: 'Resources', icon: BookOpen, path: '/resources' },
    { section: 'Account' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
    { label: 'Profile', icon: Settings, path: '/profile' },
  ],
  admin: [
    { section: 'Main Menu' },
    { label: 'Dashboard', icon: Shield, path: '/admin' },
    { label: 'Course Approvals', icon: CheckSquare, path: '/admin/courses' },
    { label: 'AI Analytics', icon: BarChart3, path: '/admin/ai-analytics' },
    { label: 'Online Time', icon: Clock, path: '/admin/online-time' },
    { label: 'AI Chat', icon: Bot, path: '/ai-chat' },
    { section: 'Account' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
    { label: 'Profile', icon: Settings, path: '/profile' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await notifApi.list();
        setUnreadCount(data.unreadCount || 0);
      } catch (e) {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const navItems = allNavItems[user.role] || allNavItems.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">E</div>
        <span className="sidebar-logo-text">EduStream</span>
      </NavLink>
      <nav className="sidebar-nav">
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section-label">{item.section}</div>
          ) : (
            <NavLink
              key={i}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
              {item.path === '/notifications' && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </NavLink>
          )
        )}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%', cursor: 'pointer', background: 'none', fontSize: 14 }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
