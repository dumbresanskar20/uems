import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { addNotification, setNotifications } from '../store/slices/notificationSlice';
import { addEnquiryRealtime, updateEnquiryRealtime } from '../store/slices/enquirySlice';
import { connectSocket, disconnectSocket } from '../services/socket';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import TopNav from '../components/layout/TopNav';

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const org = user?.organization || user;

  // Load notifications
  useEffect(() => {
    api.get('/notifications').then(r => {
      dispatch(setNotifications({ notifications: r.data.notifications, unreadCount: r.data.unreadCount }));
    }).catch(() => {});
  }, [dispatch]);

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
  }, [org, dispatch]);

  // Dynamic branding
  useEffect(() => {
    if (org?.name) document.title = `${org.name} — UEMS`;
    if (org?.favicon) {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.rel = 'icon'; link.href = org.favicon;
      document.head.appendChild(link);
    }
  }, [org]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#070B14] noise text-white">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#3B82F6]/10 rounded-full blur-[120px] pointer-events-none" />

        <TopNav setMobileOpen={setMobileOpen} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8 relative z-10 scroll-smooth">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-full max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
