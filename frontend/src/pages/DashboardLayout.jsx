import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { logout } from '../store/slices/authSlice';
import { addNotification, setNotifications, markRead } from '../store/slices/notificationSlice';
import { addEnquiryRealtime, updateEnquiryRealtime } from '../store/slices/enquirySlice';
import { toggleSidebarCollapse } from '../store/slices/uiSlice';
import { connectSocket, disconnectSocket } from '../services/socket';
import api from '../services/api';
import {
  LayoutDashboard, Inbox, GitBranch, Bell, Settings, LogOut,
  CreditCard, Menu, X, ChevronLeft, ChevronRight, Users,
  Kanban, FormInput, User, Building2, Sparkles, BarChart3
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dashboard/enquiries', icon: Inbox, label: 'Enquiries' },
  { path: '/dashboard/pipeline', icon: Kanban, label: 'Pipeline' },
  { path: '/dashboard/form-builder', icon: FormInput, label: 'Form Builder' },
  { path: '/dashboard/branches', icon: GitBranch, label: 'Branches', orgOnly: true },
  { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { path: '/dashboard/subscription', icon: CreditCard, label: 'Subscription', orgOnly: true },
  { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { path: '/dashboard/profile', icon: User, label: 'Profile' },
];

function NotificationPanel({ onClose }) {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector(s => s.notification);

  const handleMarkAll = async () => {
    try {
      await api.put('/notifications/all/read');
      dispatch(markRead('all'));
    } catch {}
  };

  const priorityColors = {
    urgent: 'text-red-400 bg-red-400/10',
    high: 'text-amber-400 bg-amber-400/10',
    medium: 'text-indigo-400 bg-indigo-400/10',
    low: 'text-gray-400 bg-gray-400/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50"
      style={{ background: 'rgba(15,15,35,0.98)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
    >
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge badge-urgent text-xs">{unreadCount}</span>
          )}
        </div>
        <button onClick={handleMarkAll} className="text-xs text-[#a5bafd] hover:text-white transition-colors">Mark all read</button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-secondary)] text-sm">No notifications yet</div>
        ) : notifications.slice(0, 15).map(n => (
          <div key={n._id}
            className={`p-4 border-b transition-colors cursor-pointer hover:bg-white/5 ${!n.isRead ? 'bg-indigo-500/5' : ''}`}
            style={{ borderColor: 'rgba(99,102,241,0.05)' }}
            onClick={() => dispatch(markRead(n._id))}
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-[#6366f1]' : 'bg-gray-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{n.title}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{n.message}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[n.priority] || priorityColors.medium}`}>
                  {n.priority}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { sidebarCollapsed } = useSelector(s => s.ui);
  const { unreadCount } = useSelector(s => s.notification);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const org = user?.organization || user;
  const isOrgAccount = user?.role === 'organization';

  // Load notifications
  useEffect(() => {
    api.get('/notifications').then(r => {
      dispatch(setNotifications({ notifications: r.data.notifications, unreadCount: r.data.unreadCount }));
    }).catch(() => {});
  }, []);

  // Socket connection
  useEffect(() => {
    const orgId = org?.id || org?._id;
    if (!orgId) return;
    const socket = connectSocket(orgId);

    socket.on('new_enquiry', (enquiry) => {
      dispatch(addEnquiryRealtime(enquiry));
      toast.success(`New enquiry from ${enquiry.name}`, { icon: '📨' });
    });

    socket.on('enquiry_updated', (enquiry) => {
      dispatch(updateEnquiryRealtime(enquiry));
    });

    socket.on('notification', (notif) => {
      dispatch(addNotification(notif));
      if (notif.priority === 'urgent') {
        toast.error(notif.message, { icon: '🚨', duration: 6000 });
      } else {
        toast(notif.message, { icon: '🔔' });
      }
    });

    return () => disconnectSocket();
  }, [org]);

  // Dynamic branding
  useEffect(() => {
    if (org?.name) document.title = `${org.name} — UEMS`;
    if (org?.favicon) {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.rel = 'icon'; link.href = org.favicon;
      document.head.appendChild(link);
    }
  }, [org]);

  const handleLogout = () => {
    dispatch(logout());
    disconnectSocket();
    navigate('/login');
    toast.success('Signed out successfully');
  };

  const filteredNav = NAV_ITEMS.filter(item => !item.orgOnly || isOrgAccount);

  const SidebarContent = ({ collapsed }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-6 ${collapsed ? 'justify-center px-4' : ''}`}
        style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
        >
          <Building2 size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm font-display truncate leading-tight">{org?.name || 'UEMS'}</p>
            <p className="text-xs text-[var(--text-secondary)] truncate capitalize">{user?.role}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`}
            title={collapsed ? item.label : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
        <button onClick={handleLogout}
          className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-3' : ''}`}>
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col flex-shrink-0 relative"
        style={{ background: 'rgba(10,10,26,0.95)', borderRight: '1px solid rgba(99,102,241,0.1)' }}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-colors"
          style={{ background: 'rgba(99,102,241,0.8)', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          {sidebarCollapsed ? <ChevronRight size={12} className="text-white" /> : <ChevronLeft size={12} className="text-white" />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-60 z-50 flex flex-col"
              style={{ background: 'rgba(10,10,26,0.98)', borderRight: '1px solid rgba(99,102,241,0.1)' }}
            >
              <div className="flex justify-end p-4">
                <button onClick={() => setMobileOpen(false)} className="text-[var(--text-secondary)] hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden"><SidebarContent collapsed={false} /></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'rgba(10,10,26,0.8)', borderBottom: '1px solid rgba(99,102,241,0.08)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-[var(--text-secondary)] hover:text-white" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <Sparkles size={14} className="text-[#6366f1]" />
              <span className="text-xs text-[var(--text-secondary)]">AI-Powered</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Subscription badge */}
            {user?.subscriptionExpiry && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">Active</span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(99,102,241,0.15)' }}
              >
                <Bell size={17} className="text-[var(--text-secondary)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-bold"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
              </AnimatePresence>
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard/profile')}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {(user?.name || org?.name || 'U')[0].toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white leading-tight">{user?.name || org?.name}</p>
                <p className="text-xs text-[var(--text-secondary)] capitalize leading-tight">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-0)' }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Click outside to close notifications */}
      {notifOpen && <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />}
    </div>
  );
}
