import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchDashboardStats } from '../store/slices/enquirySlice';
import api from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Inbox, TrendingUp, AlertTriangle, CheckCircle, Sparkles, ArrowUpRight, Clock, Users, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="card-hover rounded-2xl p-6 relative overflow-hidden"
    style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}
  >
    <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 80% 20%, ${color}15, transparent 60%)` }} />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-sm text-[var(--text-secondary)] mb-1">{label}</p>
        <p className="text-3xl font-bold text-white font-display">{value}</p>
        {sub && <p className="text-xs mt-1.5" style={{ color }}>{sub}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={22} style={{ color }} />
      </div>
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(15,15,35,0.98)', border: '1px solid rgba(99,102,241,0.2)' }}>
      <p className="text-white font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

const STATUS_COLORS = {
  new: '#3b82f6', contacted: '#f59e0b', in_progress: '#8b5cf6',
  follow_up: '#06b6d4', completed: '#22c55e', cancelled: '#ef4444',
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.enquiry);
  const { user } = useSelector(s => s.auth);
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => { dispatch(fetchDashboardStats()); }, []);

  useEffect(() => {
    if (!stats) return;
    setInsightsLoading(true);
    // Generate AI insights via backend — stubbed here for display
    setTimeout(() => {
      setAiInsights([
        { title: 'Conversion Opportunity', description: `${stats.byStatus?.follow_up || 0} enquiries in follow-up stage may convert with timely contact.`, actionable: 'Send follow-up emails today' },
        { title: 'Urgent Attention', description: `${stats.urgent || 0} urgent enquiries need immediate response to prevent churn.`, actionable: 'Review urgent enquiries now' },
        { title: 'Peak Performance', description: `This month shows ${stats.thisMonth || 0} new enquiries. Track conversion rate for improvement.`, actionable: 'Analyze monthly trends' },
      ]);
      setInsightsLoading(false);
    }, 1000);
  }, [stats]);

  // Prepare chart data
  const monthlyData = stats?.monthlyTrend?.map(d => ({
    name: MONTHS[(d._id.month - 1)],
    Enquiries: d.count,
  })) || [];

  const statusPieData = stats?.byStatus
    ? Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  const org = user?.organization || user;
  const daysLeft = org?.subscriptionExpiry
    ? Math.max(0, Math.ceil((new Date(org.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-white font-display">
            Welcome back 👋
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-[var(--text-secondary)] text-sm mt-0.5">
            {org?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </motion.p>
        </div>
        {daysLeft <= 7 && daysLeft > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-amber-400 font-medium">Subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
            <Link to="/dashboard/subscription" className="ml-1 text-white underline text-xs">Renew</Link>
          </motion.div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Inbox} label="Total Enquiries" value={stats?.total || 0} sub="All time" color="#6366f1" delay={0} />
        <StatCard icon={TrendingUp} label="This Month" value={stats?.thisMonth || 0} sub="New enquiries" color="#8b5cf6" delay={0.05} />
        <StatCard icon={AlertTriangle} label="Urgent" value={stats?.urgent || 0} sub="Need attention" color="#ef4444" delay={0.1} />
        <StatCard icon={CheckCircle} label="Completed" value={stats?.completed || 0} sub={`${stats?.conversionRate || 0}% conversion`} color="#22c55e" delay={0.15} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">Enquiry Trend</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Last 6 months</p>
            </div>
            <BarChart3 size={18} className="text-[#6366f1]" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="enquiryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.07)" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Enquiries" stroke="#6366f1" strokeWidth={2.5}
                fill="url(#enquiryGrad)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-6"
          style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <h3 className="font-semibold text-white mb-1">By Status</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">Current distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                dataKey="value" stroke="none">
                {statusPieData.map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusPieData.slice(0, 4).map(entry => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[entry.name] || '#6366f1' }} />
                  <span className="text-[var(--text-secondary)] capitalize">{entry.name.replace('_', ' ')}</span>
                </div>
                <span className="text-white font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Enquiries */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-6"
          style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Enquiries</h3>
            <Link to="/dashboard/enquiries" className="flex items-center gap-1 text-xs text-[#a5bafd] hover:text-white transition-colors">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentEnquiries?.length ? stats.recentEnquiries.map(e => (
              <div key={e._id} className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {e.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{e.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{e.enquiryNumber}</p>
                </div>
                <span className={`badge badge-${e.status} whitespace-nowrap`}>{e.status.replace('_', ' ')}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-[var(--text-secondary)] text-sm">No enquiries yet</div>
            )}
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl p-6"
          style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-[#6366f1]" />
            <h3 className="font-semibold text-white">AI Insights</h3>
            <span className="badge badge-medium text-xs">Beta</span>
          </div>
          {insightsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 rounded-xl shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {aiInsights.map((insight, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.5 }}
                  className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <p className="text-sm font-medium text-white mb-1">{insight.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">{insight.description}</p>
                  <p className="text-xs font-medium" style={{ color: '#a5bafd' }}>→ {insight.actionable}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
