import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { setNotifications, markRead } from '../store/slices/notificationSlice';
import api from '../services/api';
import { Bell, CheckCheck, AlertTriangle, CreditCard, GitBranch, Inbox, Sparkles, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NOTIF_ICONS = {
  urgent_enquiry: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  new_enquiry: { icon: Inbox, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  subscription_expiry: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  branch_activity: { icon: GitBranch, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  payment: { icon: CreditCard, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  system: { icon: Sparkles, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector(s => s.notification);

  useEffect(() => {
    api.get('/notifications?limit=50').then(r => {
      dispatch(setNotifications({ notifications: r.data.notifications, unreadCount: r.data.unreadCount }));
    });
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/all/read');
      dispatch(markRead('all'));
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      dispatch(markRead(id));
    } catch {}
  };

  const grouped = notifications.reduce((acc, n) => {
    const date = new Date(n.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(n);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Notifications</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
            className="flex items-center gap-2 text-sm text-[#a5bafd] hover:text-white transition-colors btn-secondary py-2 px-4">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: 'rgba(15,15,35,0.6)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <Bell size={28} className="text-[#6366f1]" />
          </div>
          <p className="text-white font-medium">No notifications yet</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">We'll notify you of important activity here</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                {new Date(date).toDateString() === new Date().toDateString() ? 'Today' :
                 new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' :
                 new Date(date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <div className="space-y-2">
                {items.map((n, i) => {
                  const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.system;
                  const IconComp = cfg.icon;
                  return (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => !n.isRead && handleMarkRead(n._id)}
                      className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/5 ${!n.isRead ? 'border-l-2' : 'border-l-2 border-transparent'}`}
                      style={{
                        background: !n.isRead ? `${cfg.color}06` : 'rgba(15,15,35,0.6)',
                        borderLeftColor: !n.isRead ? cfg.color : 'transparent',
                        border: `1px solid ${!n.isRead ? cfg.color + '20' : 'rgba(99,102,241,0.08)'}`,
                        borderLeftWidth: !n.isRead ? '3px' : '1px',
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.bg }}>
                        <IconComp size={18} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!n.isRead ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                          {n.title}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: cfg.color }} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
