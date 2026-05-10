import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Globe, Building2, Calendar, GitBranch, CreditCard, CheckCircle2, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useSelector(s => s.auth);
  const org = user?.organization || user;

  const InfoRow = ({ icon: Icon, label, value }) => value ? (
    <div className="flex items-center justify-between py-4 border-b border-[#8B5CF6]/5 group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/5 group-hover:border-[#8B5CF6]/30 group-hover:bg-[#8B5CF6]/10 transition-colors">
          <Icon size={18} className="text-[#94A3B8] group-hover:text-[#8B5CF6] transition-colors" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</p>
          <p className="text-sm font-medium text-white">{value}</p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Organization Profile</h1>
        <p className="text-[#94A3B8] mt-1">Manage your account settings and preferences</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="rounded-3xl glass overflow-hidden border border-[#8B5CF6]/20 shadow-premium relative"
      >
        {/* Banner */}
        <div className="h-40 relative bg-gradient-to-r from-[#111827] via-[#070B14] to-[#111827]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111827]/90" />
          
          <motion.div 
            animate={{ x: [0, 50, 0], y: [0, -20, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-10 w-64 h-64 bg-[#8B5CF6]/30 rounded-full blur-[80px]" 
          />
        </div>

        {/* Profile Content */}
        <div className="px-8 pb-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 mb-8">
            <div className="flex items-end gap-6">
              {/* Avatar with Glow Ring */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="w-32 h-32 rounded-3xl border-4 border-[#070B14] overflow-hidden flex-shrink-0 relative z-10 bg-gradient-to-br from-[#111827] to-[#1F2937] flex items-center justify-center">
                  <span className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6]">
                    {(org?.name || user?.name || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-[#10B981] border-2 border-[#070B14] z-20 shadow-glow" />
              </div>

              <div className="mb-2">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-bold text-white tracking-tight">{org?.name || user?.name}</h2>
                  {user?.role === 'organization' && <CheckCircle2 size={24} className="text-[#3B82F6]" />}
                </div>
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Shield size={14} />
                  <span className="text-sm font-medium capitalize">{user?.role} Account</span>
                </div>
              </div>
            </div>

            <button className="btn-secondary px-6 py-2 shadow-sm whitespace-nowrap hidden sm:block">
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white mb-4 tracking-tight">Contact Information</h3>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <InfoRow icon={Mail} label="Email Address" value={user?.email} />
                <InfoRow icon={User} label="Username" value={user?.username} />
                <InfoRow icon={Phone} label="Mobile Number" value={org?.mobile} />
                <InfoRow icon={Globe} label="Website" value={org?.website} />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white mb-4 tracking-tight">Organization Details</h3>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <InfoRow icon={Building2} label="Industry" value={org?.industryType} />
                {user?.branch && (
                  <InfoRow icon={GitBranch} label="Branch" value={`${user.branch.name} (${user.branch.code})`} />
                )}
                {org?.createdAt && (
                  <InfoRow
                    icon={Calendar}
                    label="Member Since"
                    value={new Date(org.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />
                )}
                {user?.subscriptionExpiry && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[#8B5CF6]/10 to-[#3B82F6]/10 border border-[#8B5CF6]/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider mb-1">Active Plan</p>
                      <p className="text-sm font-medium text-white">
                        Expires {new Date(user.subscriptionExpiry).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <CreditCard size={24} className="text-[#8B5CF6] opacity-80" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
