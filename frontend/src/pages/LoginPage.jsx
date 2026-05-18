import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { loginOrg, loginAdmin } from '../store/slices/authSlice';
import api from '../services/api';
import { 
  Eye, EyeOff, ChevronDown, Building2, GitBranch, ArrowRight, Loader2, 
  Sparkles, Zap, ShieldCheck, BarChart3, Inbox, AlertCircle
} from 'lucide-react';

const OrgDropdown = ({ orgs, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 bg-[#1F2937]/50 border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30"
      >
        {selected ? (
          <>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] shadow-glow">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-white font-bold flex-1">{selected.name}</span>
          </>
        ) : (
          <span className="text-[#94A3B8] flex-1">Select your organization</span>
        )}
        <ChevronDown size={18} className={`text-[#94A3B8] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl overflow-hidden glass shadow-premium border border-[#8B5CF6]/20"
          >
            <div className="p-3 border-b border-[#8B5CF6]/10 bg-[#111827]/80">
              <input
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-[#94A3B8] bg-[#070B14] border border-[#8B5CF6]/10 outline-none focus:border-[#8B5CF6]/40 transition-colors"
                placeholder="Search organizations..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 overflow-y-auto custom-scrollbar bg-[#070B14]/60">
              {filtered.map(org => (
                <button
                  key={org._id} type="button"
                  onClick={() => { onSelect(org); setOpen(false); setSearch(''); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors border-b border-[#8B5CF6]/5"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 text-[#8B5CF6]">
                    <Building2 size={16} />
                  </div>
                  <span className="text-white text-sm font-bold">{org.name}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-[#94A3B8] text-sm">No organizations found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector(s => s.auth);

  const [mode, setMode] = useState('org');
  const [step, setStep] = useState(1);
  const [orgs, setOrgs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '', adminEmail: '', adminPassword: '' });

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'superadmin' ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    api.get('/auth/organizations').then(r => setOrgs(r.data.organizations)).catch(() => {});
  }, []);

  const handleOrgSelect = async (org) => {
    setSelectedOrg(org);
    setSelectedBranch(null);
    try {
      const r = await api.get(`/auth/organizations/${org._id}/branches`);
      setBranches(r.data.branches || []);
      setStep(r.data.branches?.length > 0 ? 2 : 3);
    } catch {
      setStep(3);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedOrg && mode === 'org') {
      toast.error('Please select an organization'); return;
    }

    if (mode === 'admin') {
      const result = await dispatch(loginAdmin({ email: form.adminEmail, password: form.adminPassword }));
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Welcome, Super Admin!');
        navigate('/admin/dashboard');
      } else {
        toast.error(result.payload?.message || 'Login failed');
      }
      return;
    }

    const loginData = {
      identifier: form.identifier,
      password: form.password,
      orgId: selectedOrg._id,
      ...(selectedBranch && { branchId: selectedBranch._id }),
    };

    const result = await dispatch(loginOrg(loginData));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(`Welcome back!`);
      navigate('/dashboard');
    } else {
      toast.error(result.payload?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#070B14] overflow-hidden noise">
      {/* Left Side - Marketing & AI Illustration */}
      <div className="hidden lg:flex flex-col w-1/2 relative bg-[#111827] border-r border-[#8B5CF6]/10 p-12 xl:p-20 justify-between">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20" />
        
        {/* Animated Gradient Blobs */}
        <motion.div animate={{ x: [0, 50, 0], y: [0, -50, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-[120px] pointer-events-none" />
        <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3B82F6]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center shadow-glow">
            <Sparkles size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">UEMS</span>
        </div>

        <div className="relative z-10 my-auto max-w-xl">
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight mb-6">
            The intelligent way to manage <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]">enquiries</span>
          </h1>
          <p className="text-[#94A3B8] text-lg leading-relaxed mb-12">
            Accelerate your sales pipeline with AI-driven insights, automated workflows, and world-class enterprise performance.
          </p>

          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#8B5CF6]">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Lightning Fast Workflows</h3>
                <p className="text-[#94A3B8] text-sm">Drag and drop Kanban boards and real-time synchronization.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#3B82F6]">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">AI-Powered Analytics</h3>
                <p className="text-[#94A3B8] text-sm">Predictive scoring and deep insights to close deals faster.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm font-medium text-[#94A3B8] flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#10B981]" />
          Enterprise-grade security & compliance
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 bg-[#070B14] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="glass rounded-3xl p-8 sm:p-10 border border-[#8B5CF6]/20 shadow-premium relative overflow-hidden">
            {/* Top Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]" />

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">Sign In</h2>
              <p className="text-[#94A3B8]">Welcome back! Please enter your details.</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1 rounded-xl bg-black/40 mb-8 border border-white/5">
              {[['org', 'Organization'], ['admin', 'Super Admin']].map(([m, label]) => (
                <button
                  key={m} type="button"
                  onClick={() => { setMode(m); setStep(1); setSelectedOrg(null); setForm({ identifier: '', password: '', adminEmail: '', adminPassword: '' }); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${mode === m ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-glow' : 'text-[#94A3B8] hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {mode === 'admin' ? (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Admin Email</label>
                    <input
                      type="email" className="w-full px-4 py-3.5 rounded-xl bg-[#1F2937]/50 border border-[#8B5CF6]/20 text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all" placeholder="admin@uems.io"
                      value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'} className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-[#1F2937]/50 border border-[#8B5CF6]/20 text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all" placeholder="••••••••"
                        value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} required
                      />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Organization</label>
                    <OrgDropdown orgs={orgs} selected={selectedOrg} onSelect={handleOrgSelect} />
                  </div>

                  <AnimatePresence>
                    {selectedOrg && branches.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <label className="block text-sm font-bold text-[#94A3B8] uppercase tracking-wider mt-5 mb-2">Branch Selection <span className="text-xs text-[#94A3B8]/60 font-normal normal-case">(optional)</span></label>
                        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          <button
                            type="button"
                            onClick={() => { setSelectedBranch(null); setStep(3); }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all duration-200 border ${!selectedBranch ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-glow text-white' : 'border-white/10 bg-[#1F2937]/50 text-[#94A3B8] hover:bg-white/5'}`}
                          >
                            <Building2 size={18} className={!selectedBranch ? "text-[#8B5CF6]" : ""} />
                            <span className="font-bold">Main Organization</span>
                          </button>
                          {branches.map(branch => (
                            <button
                              key={branch._id} type="button"
                              onClick={() => { setSelectedBranch(branch); setStep(3); }}
                              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all duration-200 border ${selectedBranch?._id === branch._id ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-glow' : 'border-white/10 bg-[#1F2937]/50 hover:bg-white/5'}`}
                            >
                              <GitBranch size={18} className={selectedBranch?._id === branch._id ? "text-[#8B5CF6]" : "text-[#94A3B8]"} />
                              <div className="flex-1 text-left flex flex-col">
                                <span className={`font-bold ${selectedBranch?._id === branch._id ? 'text-white' : 'text-[#94A3B8]'}`}>{branch.name}</span>
                                <span className="text-[#94A3B8] text-xs mt-0.5">{branch.code}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {selectedOrg && (step === 3 || branches.length === 0) && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pt-2">
                        <div>
                          <label className="block text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Username or Email</label>
                          <input
                            className="w-full px-4 py-3.5 rounded-xl bg-[#1F2937]/50 border border-[#8B5CF6]/20 text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all" placeholder="name@company.com"
                            value={form.identifier} onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))} required
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-[#94A3B8] uppercase tracking-wider">Password</label>
                            <a href="#" className="text-xs font-bold text-[#8B5CF6] hover:text-[#3B82F6] transition-colors">Forgot password?</a>
                          </div>
                          <div className="relative">
                            <input
                              type={showPwd ? 'text' : 'password'} className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-[#1F2937]/50 border border-[#8B5CF6]/20 text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all" placeholder="••••••••"
                              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                            />
                            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white" onClick={() => setShowPwd(!showPwd)}>
                              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm font-medium flex items-center justify-center gap-2">
                  <AlertCircle size={16} /> {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'org' && !selectedOrg)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold text-lg shadow-glow hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (
                  <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-[#94A3B8]">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#8B5CF6] font-bold hover:text-white transition-colors underline underline-offset-4">
                  Request Access
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
