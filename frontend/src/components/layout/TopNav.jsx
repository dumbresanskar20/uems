import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Sparkles, Search, CheckCircle2 } from 'lucide-react';
import { markRead } from '../../store/slices/notificationSlice';
import api from '../../services/api';

function NotificationPanel({ onClose, notifications, unreadCount, dispatch }) {
  const handleMarkAll = async () => {
    try {
      await api.put('/notifications/all/read');
      dispatch(markRead('all'));
    } catch {}
  };

  const priorityColors = {
    urgent: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20',
    high: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
    medium: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20',
    low: 'text-[#94A3B8] bg-[#94A3B8]/10 border-[#94A3B8]/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 top-full mt-4 w-96 rounded-2xl glass overflow-hidden z-50 shadow-premium"
    >
      <div className="p-4 border-b border-[#8B5CF6]/10 flex items-center justify-between bg-[#111827]/80">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#EF4444]/20 text-[#EF4444] text-xs font-bold border border-[#EF4444]/30">
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={handleMarkAll} className="text-xs text-[#8B5CF6] hover:text-white transition-colors flex items-center gap-1">
          <CheckCircle2 size={14} /> Mark all read
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto bg-[#070B14]/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-[#94A3B8] text-sm">No new notifications</div>
        ) : notifications.slice(0, 15).map(n => (
          <div
            key={n._id}
            onClick={() => dispatch(markRead(n._id))}
            className={`p-4 border-b border-[#8B5CF6]/5 transition-all cursor-pointer hover:bg-white/5 
              ${!n.isRead ? 'bg-[#8B5CF6]/5' : ''}
            `}
          >
            <div className="flex gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 shadow-glow ${!n.isRead ? 'bg-[#8B5CF6]' : 'bg-[#374151]'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${!n.isRead ? 'text-white' : 'text-[#94A3B8]'}`}>{n.title}</p>
                <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${priorityColors[n.priority] || priorityColors.medium}`}>
                    {n.priority}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function TopNav({ setMobileOpen }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { notifications, unreadCount } = useSelector(s => s.notification);
  const [notifOpen, setNotifOpen] = useState(false);

  const org = user?.organization || user;

  return (
    <header className="h-20 px-6 lg:px-8 flex items-center justify-between z-30 sticky top-0 bg-[#070B14]/80 backdrop-blur-xl border-b border-[#8B5CF6]/10">
      
      {/* Left side: Mobile Menu & Global Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          className="lg:hidden p-2 rounded-xl bg-white/5 text-[#94A3B8] hover:text-white transition-colors border border-white/5"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#111827]/80 border border-[#8B5CF6]/10 w-full max-w-md focus-within:border-[#8B5CF6]/40 focus-within:shadow-glow transition-all">
          <Search size={18} className="text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search enquiries, leads, branches..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-[#94A3B8] w-full"
          />
          <div className="hidden lg:flex items-center gap-1">
            <kbd className="px-2 py-1 rounded bg-white/5 text-[#94A3B8] text-[10px] font-mono border border-white/10">⌘</kbd>
            <kbd className="px-2 py-1 rounded bg-white/5 text-[#94A3B8] text-[10px] font-mono border border-white/10">K</kbd>
          </div>
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* AI Assistant Button */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6]/10 to-[#3B82F6]/10 border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 hover:shadow-neon transition-all group">
          <Sparkles size={16} className="text-[#8B5CF6] group-hover:text-white transition-colors" />
          <span className="text-sm font-medium bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] bg-clip-text text-transparent group-hover:text-white transition-colors">
            Ask AI
          </span>
        </button>

        <div className="w-px h-6 bg-[#8B5CF6]/20 hidden sm:block" />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2.5 rounded-xl bg-[#111827] border border-[#8B5CF6]/20 text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/40 transition-all relative group"
          >
            <Bell size={18} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center shadow-glow border border-[#070B14]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <NotificationPanel
                onClose={() => setNotifOpen(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                dispatch={dispatch}
              />
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div 
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-3 pl-2 sm:pl-4 cursor-pointer group"
        >
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-white group-hover:text-[#8B5CF6] transition-colors">{user?.name || org?.name}</p>
            <p className="text-xs text-[#94A3B8] capitalize">{user?.role}</p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center text-white font-bold shadow-glow group-hover:shadow-neon transition-shadow">
              {(user?.name || org?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#10B981] border-2 border-[#070B14] rounded-full" />
          </div>
        </div>
      </div>

      {notifOpen && <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />}
    </header>
  );
}
