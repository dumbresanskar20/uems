import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Globe, Building2, Calendar, GitBranch, CreditCard } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useSelector(s => s.auth);
  const org = user?.organization || user;

  const InfoRow = ({ icon: Icon, label, value }) => value ? (
    <div className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
        <Icon size={15} className="text-[#6366f1]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value}</p>
      </div>
    </div>
  ) : null;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-display">Profile</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Your account information</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
        {/* Banner */}
        <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
        </div>

        {/* Avatar */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl border-4 overflow-hidden flex-shrink-0"
              style={{ borderColor: 'rgba(15,15,35,0.8)', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-black">
                {(org?.name || user?.name || 'U')[0].toUpperCase()}
              </div>
            </div>
            <span className={`badge mb-2 capitalize ${user?.role === 'organization' ? 'badge-completed' : user?.role === 'branch' ? 'badge-in_progress' : 'badge-new'}`}>
              {user?.role}
            </span>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold text-white font-display">{org?.name || user?.name}</h2>
            {user?.branch && (
              <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                <GitBranch size={13} /> Branch: {user.branch.name} ({user.branch.code})
              </p>
            )}
          </div>

          <div className="space-y-0">
            <InfoRow icon={Mail} label="Email" value={user?.email} />
            <InfoRow icon={User} label="Username" value={user?.username} />
            <InfoRow icon={Phone} label="Mobile" value={org?.mobile} />
            <InfoRow icon={Globe} label="Website" value={org?.website} />
            <InfoRow icon={Building2} label="Industry" value={org?.industryType} />
            {user?.subscriptionExpiry && (
              <InfoRow
                icon={CreditCard}
                label="Subscription Expires"
                value={new Date(user.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              />
            )}
            {org?.createdAt && (
              <InfoRow
                icon={Calendar}
                label="Member Since"
                value={new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
