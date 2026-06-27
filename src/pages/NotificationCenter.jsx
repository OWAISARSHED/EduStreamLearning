import { useState, useEffect } from 'react';
import { MessageSquare, FileText, AlertTriangle, CheckCircle, Send, ThumbsUp, XCircle, UserPlus, BookOpen } from 'lucide-react';
import { notifications as notifApi } from '../services/api';
import '../styles/notifications.css';

export default function NotificationCenter() {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);

  const fetchNotifs = async () => {
    try {
      const data = await notifApi.list();
      setNotifications(data.notifications || []);
    } catch (e) { setNotifications([]); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.is_read);
  const sorted = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const iconMap = {
    mentor_reply: { icon: MessageSquare, iconClass: 'reply' },
    new_resource: { icon: FileText, iconClass: 'resource' },
    system_warning: { icon: AlertTriangle, iconClass: 'warning' },
    milestone: { icon: CheckCircle, iconClass: 'milestone' },
    course_submitted: { icon: Send, iconClass: 'submitted' },
    course_approved: { icon: ThumbsUp, iconClass: 'approved' },
    course_rejected: { icon: XCircle, iconClass: 'rejected' },
    course_enrolled: { icon: UserPlus, iconClass: 'enrolled' },
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p className="page-subtitle">Stay updated with replies, resources, and system alerts</p>
        </div>
        <button className="btn-secondary" onClick={async () => { await notifApi.markAllRead(); fetchNotifs(); }}>Mark All Read</button>
      </div>

      <div className="notif-tabs">
        <button className={`notif-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All Notifications</button>
        <button className={`notif-tab${filter === 'unread' ? ' active' : ''}`} onClick={() => setFilter('unread')}>Unread</button>
      </div>

      <div className="notif-list">
        {sorted.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No notifications</p>
        ) : sorted.map((n, i) => {
          const Icon = iconMap[n.type]?.icon || MessageSquare;
          const cls = iconMap[n.type]?.iconClass || 'reply';
          return (
            <div key={n._id} className={`notif-item${!n.is_read ? ' unread' : ''}`}>
              {!n.is_read && <div className="unread-dot" />}
              <div className={`notif-icon ${cls}`}><Icon size={18} /></div>
              <div className="notif-content">
                <h4>{n.title}</h4>
                <p>{n.message}</p>
                <div className="time">{new Date(n.created_at).toLocaleDateString()}</div>
              </div>
              <button className="notif-cta" onClick={async () => { await notifApi.markRead(n._id); fetchNotifs(); }}>
                {n.cta_label || 'View'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
