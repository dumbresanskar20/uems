import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Inbox, Kanban, FormInput, GitBranch,
  Bell, CreditCard, Settings, User, LogOut, ChevronLeft, ChevronRight, Building2, Sparkles, X
} from 'lucide-react';
import { toggleSidebarCollapse } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { disconnectSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/dashboard/enquiries', icon: Inbox, label: 'Enquiries' },
      { path: '/dashboard/pipeline', icon: Kanban, label: 'Pipeline' },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { path: '/dashboard/form-builder', icon: FormInput, label: 'Form Builder' },
      { path: '/dashboard/branches', icon: GitBranch, label: 'Branches', orgOnly: true },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
      { path: '/dashboard/subscription', icon: CreditCard, label: 'Subscription', orgOnly: true },
      { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
      { path: '/dashboard/profile', icon: User, label: 'Profile' },
    ]
  }
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { sidebarCollapsed } = useSelector(s => s.ui);

  const org = user?.organization || user;
  const isOrgAccount = user?.role === 'organization';

  const handleLogout = () => {
    dispatch(logout());
    disconnectSocket();
    toast.success('Signed out successfully');
  };

  const SidebarContent = ({ collapsed }) => (
    <div className="flex flex-col h-full bg-[#070B14]/40 backdrop-blur-3xl border-r border-[#8B5CF6]/10 relative z-20">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-6 ${collapsed ? 'justify-center px-4' : ''}`}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] shadow-glow">
          <Building2 size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm truncate tracking-wide">{org?.name || 'UEMS'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles size={10} className="text-[#3B82F6]" />
              <p className="text-xs text-[#94A3B8] truncate uppercase tracking-widest font-semibold">{user?.role}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 overflow-y-auto space-y-6">
        {NAV_GROUPS.map((group, idx) => {
          const visibleItems = group.items.filter(item => !item.orgOnly || isOrgAccount);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <p className="text-[10px] text-[#94A3B8] font-bold tracking-widest px-4 mb-2 uppercase opacity-80">
                  {group.title}
                </p>
              )}
              {visibleItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 relative group
                    ${isActive ? 'bg-[#8B5CF6]/10 text-white' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'}
                    ${collapsed ? 'justify-center px-0' : ''}
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#8B5CF6] to-[#3B82F6] rounded-r-full shadow-glow"
                        />
                      )}
                      <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-[#8B5CF6]/20' : 'group-hover:bg-white/10'}`}>
                        <item.icon size={18} className={isActive ? 'text-[#8B5CF6]' : 'text-[#94A3B8] group-hover:text-white'} />
                      </div>
                      {!collapsed && <span className="text-sm tracking-wide">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom Profile/Logout */}
      <div className="p-4 border-t border-[#8B5CF6]/10">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all font-medium group ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <div className="p-1.5 rounded-lg group-hover:bg-[#EF4444]/20 transition-colors">
            <LogOut size={18} />
          </div>
          {!collapsed && <span className="text-sm tracking-wide">Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 88 : 280 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:flex flex-col flex-shrink-0 relative glass border-r-0 rounded-r-2xl my-4 ml-4"
        style={{ height: 'calc(100vh - 32px)' }}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        
        {/* Collapse Toggle */}
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center z-50 bg-[#111827] border border-[#8B5CF6]/30 text-[#94A3B8] hover:text-white hover:border-[#8B5CF6] hover:shadow-neon transition-all"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-[#070B14]/80 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 glass border-l-0"
            >
              <div className="absolute right-4 top-6 z-50">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 bg-white/5 rounded-full text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <SidebarContent collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
