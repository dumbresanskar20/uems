import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchDashboardStats } from '../store/slices/enquirySlice';
import api from '../services/api';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Inbox, TrendingUp, AlertTriangle, CheckCircle, Sparkles, 
  ArrowUpRight, BarChart3, Plus, ArrowRight 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLORS = {
  new: '#3B82F6', contacted: '#F59E0B', in_progress: '#8B5CF6',
  follow_up: '#06B6D4', completed: '#10B981', cancelled: '#EF4444',
};

const StatCard = ({ icon: Icon, label, value, sub, color, delay, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    className="relative overflow-hidden rounded-2xl glass p-6 group card-hover"
  >
    {/* Background Glow */}
    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: color }} />
    
    <div className="relative flex justify-between items-start">
      <div>
        <p className="text-sm text-[#94A3B8] font-medium mb-2">{label}</p>
        <p className="text-4xl font-bold text-white tracking-tight mb-2">{value}</p>
        
        <div className="flex items-center gap-2">
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-md ${trend > 0 ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
              {trend > 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
              {Math.abs(trend)}%
            </div>
          )}
          {sub && <p className="text-xs text-[#94A3B8]">{sub}</p>}
        </div>
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-neon transition-all" style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)`, border: `1px solid ${color}30` }}>
        <Icon size={22} style={{ color }} />
      </div>
    </div>
    
    {/* Mini sparkline placeholder */}
    <div className="mt-6 h-8 w-full opacity-50 group-hover:opacity-100 transition-opacity">
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 30">
        <path d="M0,30 L10,25 L20,28 L30,15 L40,20 L50,10 L60,18 L70,5 L80,12 L90,2 L100,8" fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-4 glass-dark shadow-premium border border-[#8B5CF6]/20">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full shadow-glow" style={{ background: p.color }} />
          <span className="text-[#94A3B8]">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats } = useSelector(s => s.enquiry);
  const { user } = useSelector(s => s.auth);
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const org = user?.organization || user;

  useEffect(() => { dispatch(fetchDashboardStats()); }, [dispatch]);

  useEffect(() => {
    if (!stats) return;
    setInsightsLoading(true);
    setTimeout(() => {
      setAiInsights([
        { title: 'Conversion Opportunity', description: `${stats.byStatus?.follow_up || 0} enquiries in follow-up stage may convert with timely contact.`, actionable: 'Send follow-up emails today' },
        { title: 'Urgent Attention', description: `${stats.urgent || 0} urgent enquiries need immediate response to prevent churn.`, actionable: 'Review urgent enquiries now' },
        { title: 'Peak Performance', description: `This month shows ${stats.thisMonth || 0} new enquiries. Track conversion rate for improvement.`, actionable: 'Analyze monthly trends' },
      ]);
      setInsightsLoading(false);
    }, 1000);
  }, [stats]);

  const monthlyData = stats?.monthlyTrend?.map(d => ({
    name: MONTHS[(d._id.month - 1)],
    Enquiries: d.count,
  })) || [];

  const statusPieData = stats?.byStatus
    ? Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl p-8 lg:p-10 border border-[#8B5CF6]/20 shadow-premium"
      >
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#070B14] to-[#111827] z-0" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20 z-0 mix-blend-overlay" />
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-[100px] z-0" 
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, 50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#3B82F6]/20 rounded-full blur-[100px] z-0" 
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]">{org?.name}</span> 👋
            </h1>
            <p className="text-[#94A3B8] text-lg leading-relaxed mb-6">
              Here is what's happening with your business today. You have <strong className="text-white">{stats?.urgent || 0} urgent</strong> enquiries requiring immediate attention.
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard/enquiries?new=true')}
                className="btn-primary flex items-center gap-2 group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                Create Enquiry
              </button>
              <button 
                onClick={() => navigate('/dashboard/pipeline')}
                className="btn-secondary flex items-center gap-2 group"
              >
                View Pipeline
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          
          <div className="hidden lg:flex p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-xs w-full">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center flex-shrink-0 shadow-glow">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">AI Business Summary</p>
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">Conversion rate is up by 12% this week. Keep up the momentum on follow-ups.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Inbox} label="Total Enquiries" value={stats?.total || 0} sub="All time" color="#8B5CF6" delay={0.1} trend={14} />
        <StatCard icon={TrendingUp} label="Monthly Growth" value={stats?.thisMonth || 0} sub="vs last month" color="#3B82F6" delay={0.2} trend={8} />
        <StatCard icon={AlertTriangle} label="Pending Follow-ups" value={stats?.urgent || 0} sub="Require action" color="#EF4444" delay={0.3} trend={-2} />
        <StatCard icon={CheckCircle} label="Conversion Rate" value={`${stats?.conversionRate || 0}%`} sub="Average" color="#10B981" delay={0.4} trend={5} />
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 rounded-2xl glass p-6 border border-[#8B5CF6]/10 shadow-premium"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Performance Overview</h3>
              <p className="text-sm text-[#94A3B8] mt-1">Enquiries over the last 6 months</p>
            </div>
            <button className="p-2 rounded-lg bg-white/5 text-[#94A3B8] hover:text-white transition-colors">
              <BarChart3 size={20} />
            </button>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnquiries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.2)', strokeWidth: 2 }} />
                <Area 
                  type="monotone" dataKey="Enquiries" stroke="#8B5CF6" strokeWidth={3} 
                  fillOpacity={1} fill="url(#colorEnquiries)" 
                  activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#070B14', strokeWidth: 2 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl bg-gradient-to-b from-[#111827] to-[#070B14] p-6 border border-[#8B5CF6]/20 shadow-premium relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center shadow-glow">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">AI Insights</h3>
              <p className="text-xs text-[#8B5CF6] font-medium uppercase tracking-wider">Predictive Analysis</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {insightsLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl shimmer" />)
            ) : (
              aiInsights.map((insight, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#8B5CF6]/40 hover:bg-white/10 transition-all cursor-default group">
                  <h4 className="text-sm font-bold text-white mb-1 group-hover:text-[#8B5CF6] transition-colors">{insight.title}</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">{insight.description}</p>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#3B82F6]">
                    Action <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row - Source Analytics & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Source Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="rounded-2xl glass p-6 border border-[#8B5CF6]/10 shadow-premium"
        >
          <h3 className="text-lg font-bold text-white tracking-tight mb-6">Status Breakdown</h3>
          <div className="h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} 
                  paddingAngle={5} dataKey="value" stroke="none"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.name] || '#8B5CF6'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
                <p className="text-xs text-[#94A3B8]">Total</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {statusPieData.slice(0, 4).map(entry => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[entry.name] || '#8B5CF6' }} />
                <span className="text-xs text-[#94A3B8] capitalize truncate">{entry.name.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Enquiries List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="lg:col-span-2 rounded-2xl glass p-6 border border-[#8B5CF6]/10 shadow-premium"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Recent Activity</h3>
            <Link to="/dashboard/enquiries" className="text-sm font-medium text-[#8B5CF6] hover:text-[#3B82F6] transition-colors flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="space-y-3">
            {stats?.recentEnquiries?.length ? stats.recentEnquiries.slice(0, 5).map((e, idx) => (
              <div key={e._id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-[#374151] to-[#1F2937] shadow-inner border border-white/10 group-hover:border-[#8B5CF6]/30 transition-colors">
                    {e.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{e.name}</p>
                    <p className="text-xs text-[#94A3B8]">{e.email || e.phone || 'No contact info'}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border`} style={{ color: STATUS_COLORS[e.status], borderColor: `${STATUS_COLORS[e.status]}30`, background: `${STATUS_COLORS[e.status]}10` }}>
                    {e.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">{new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-[#94A3B8] text-sm bg-white/5 rounded-xl border border-dashed border-white/10">
                No recent enquiries found
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
