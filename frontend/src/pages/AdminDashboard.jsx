import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Building2, Users, Inbox, CreditCard, LogOut, TrendingUp,
  CheckCircle, AlertTriangle, Power, Plus, Loader2, Search,
  ChevronRight, BarChart3, IndianRupee, Trash2
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl p-5 relative overflow-hidden"
    style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
    <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 80% 20%, ${color}30, transparent 60%)` }} />
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('organizations');

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/organizations?limit=20'),
      api.get('/plans'),
    ]).then(([dashRes, orgsRes, plansRes]) => {
      setStats(dashRes.data.stats);
      setOrgs(orgsRes.data.organizations);
      setPlans(plansRes.data.plans);
    }).catch(() => toast.error('Failed to load admin data'))
    .finally(() => setLoading(false));
  }, []);

  const handleOrgStatus = async (orgId, newStatus) => {
    let suspensionDays = 0;
    if (newStatus === 'suspended') {
      const days = parseInt(prompt('How many days to suspend the account?'));
      if (!days || isNaN(days)) return;
      suspensionDays = days;
    }

    try {
      await api.put(`/admin/organizations/${orgId}/status`, { 
        status: newStatus,
        ...(suspensionDays > 0 && { suspensionDays })
      });
      setOrgs(o => o.map(org => org._id === orgId ? { ...org, status: newStatus } : org));
      toast.success(`Organization ${newStatus}${suspensionDays > 0 ? ` for ${suspensionDays} days` : ''}`);
    } catch { toast.error('Failed to update status'); }
  };

  const handleExtendSub = async (orgId) => {
    const days = parseInt(prompt('Extend by how many days?'));
    if (!days || isNaN(days)) return;
    try {
      await api.put(`/admin/organizations/${orgId}/subscription`, { days });
      toast.success(`Subscription extended by ${days} days`);
    } catch { toast.error('Failed to extend'); }
  };

  const handleDeleteOrg = async (orgId, orgName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${orgName}"? This will delete all branches, enquiries, and associated data. This action cannot be undone.`)) return;
    
    try {
      await api.delete(`/admin/organizations/${orgId}`);
      setOrgs(o => o.filter(org => org._id !== orgId));
      toast.success('Organization deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete organization');
    }
  };

  const filteredOrgs = orgs.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a1a' }}>
      <Loader2 size={32} className="animate-spin text-[#6366f1]" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0a0a1a' }}>
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{ background: 'rgba(10,10,26,0.95)', borderBottom: '1px solid rgba(99,102,241,0.1)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-display">UEMS Admin</h1>
            <p className="text-xs text-[var(--text-secondary)]">Super Admin Panel</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 btn-secondary py-2 px-3">
          <LogOut size={15} /> Logout
        </button>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={Building2} label="Total Orgs" value={stats?.totalOrgs || 0} color="#6366f1" />
          <StatCard icon={CheckCircle} label="Active" value={stats?.activeOrgs || 0} color="#22c55e" />
          <StatCard icon={AlertTriangle} label="Expired" value={stats?.expiredOrgs || 0} color="#ef4444" />
          <StatCard icon={Inbox} label="Enquiries" value={stats?.totalEnquiries || 0} color="#8b5cf6" />
          <StatCard icon={CreditCard} label="Plans" value={stats?.totalPlans || 0} color="#06b6d4" />
          <StatCard icon={IndianRupee} label="Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} color="#f59e0b" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.1)' }}>
          {['organizations', 'plans'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize"
              style={tab === t ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' } : { color: 'var(--text-secondary)' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Organizations Tab */}
        {tab === 'organizations' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input className="input-field pl-9 text-sm" placeholder="Search organizations..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                    {['Organization', 'Plan', 'Status', 'Expires', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrgs.map((org, i) => (
                    <motion.tr key={org._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/3 transition-colors" style={{ borderBottom: '1px solid rgba(99,102,241,0.05)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {org.logo ? (
                            <img src={org.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                              {org.name?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">{org.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{org.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-[var(--text-secondary)]">{org.currentPlan?.name || 'Free'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge badge-${org.status === 'active' ? 'completed' : org.status === 'expired' ? 'cancelled' : 'new'}`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {org.subscriptionExpiry ? new Date(org.subscriptionExpiry).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOrgStatus(org._id, org.status === 'active' ? 'suspended' : 'active')}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: org.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: org.status === 'active' ? '#f87171' : '#4ade80' }}>
                            {org.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button onClick={() => handleExtendSub(org._id)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(99,102,241,0.1)', color: '#a5bafd' }}>
                            +Days
                          </button>
                          <button onClick={() => handleDeleteOrg(org._id, org.name)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {tab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan, i) => (
              <motion.div key={plan._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5" style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">{plan.description}</p>
                  </div>
                  <span className={`badge ${plan.isActive ? 'badge-completed' : 'badge-cancelled'} text-xs`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Price</span>
                    <span className="text-white font-semibold">
                      {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}/mo`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Branches</span>
                    <span className="text-white font-semibold">
                      {plan.branchLimit === -1 ? '∞ Unlimited' : plan.branchLimit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Duration</span>
                    <span className="text-white font-semibold">{plan.durationDays} days</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
