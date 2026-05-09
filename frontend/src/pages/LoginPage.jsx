import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { loginOrg, loginAdmin } from '../store/slices/authSlice';
import api from '../services/api';
import { Eye, EyeOff, ChevronDown, Building2, GitBranch, ArrowRight, Loader2, Shield } from 'lucide-react';

const OrgDropdown = ({ orgs, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
        style={{ background: 'rgba(20,20,46,0.8)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        {selected ? (
          <>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-white font-medium flex-1">{selected.name}</span>
          </>
        ) : (
          <span className="text-[var(--text-secondary)] flex-1">Select Organization</span>
        )}
        <ChevronDown size={16} className={`text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl overflow-hidden"
            style={{ background: 'rgba(15,15,35,0.98)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
          >
            <div className="p-2 border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(20,20,46,0.8)' }}
                placeholder="Search organizations..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map(org => (
                <button
                  key={org._id} type="button"
                  onClick={() => { onSelect(org); setOpen(false); setSearch(''); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    <Building2 size={16} className="text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">{org.name}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-[var(--text-secondary)] text-sm">No organizations found</div>
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

  const [mode, setMode] = useState('org'); // 'org' | 'admin'
  const [step, setStep] = useState(1); // 1: select org, 2: select branch, 3: credentials
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

  // Background orbs
  const orbs = [
    { x: '10%', y: '20%', color: '#6366f1', size: 300, delay: 0 },
    { x: '80%', y: '60%', color: '#8b5cf6', size: 250, delay: 1 },
    { x: '50%', y: '80%', color: '#06b6d4', size: 200, delay: 2 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0a1a' }}>
      {/* Animated background */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: orb.x, top: orb.y,
            width: orb.size, height: orb.size,
            background: `radial-gradient(circle, ${orb.color}20 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, delay: orb.delay }}
        />
      ))}

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(15,15,35,0.9)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
        }}>
          {/* Header */}
          <div className="p-8 pb-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)' }}>
            {selectedOrg ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <Building2 size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white font-display">{selectedOrg.name}</h1>
                  <p className="text-sm text-[var(--text-secondary)]">Sign in to your account</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
                  <Building2 size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white font-display">Welcome to UEMS</h1>
                <p className="text-[var(--text-secondary)] mt-1 text-sm">Universal Enquiry Management System</p>
              </div>
            )}

            {/* Mode tabs */}
            <div className="flex gap-2 mt-6 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {[['org', 'Organization'], ['admin', 'Super Admin']].map(([m, label]) => (
                <button
                  key={m} type="button"
                  onClick={() => { setMode(m); setStep(1); setSelectedOrg(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m ? 'text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  style={mode === m ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-8 pt-6 space-y-4">
            {mode === 'admin' ? (
              <>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Admin Email</label>
                  <input
                    type="email" className="input-field" placeholder="admin@uems.io"
                    value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'} className="input-field pr-12" placeholder="••••••••"
                      value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                      required
                    />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Step 1: Select Organization */}
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Organization</label>
                  <OrgDropdown orgs={orgs} selected={selectedOrg} onSelect={handleOrgSelect} />
                </div>

                {/* Step 2: Select Branch (if exists) */}
                <AnimatePresence>
                  {selectedOrg && branches.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">Branch <span className="text-xs text-gray-500">(optional)</span></label>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedBranch(null); setStep(3); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${!selectedBranch ? 'border-2 border-[#6366f1]' : ''}`}
                          style={{ background: 'rgba(20,20,46,0.8)', border: selectedBranch ? '1px solid rgba(99,102,241,0.2)' : '2px solid #6366f1' }}
                        >
                          <Building2 size={16} className="text-[#6366f1]" />
                          <span className={!selectedBranch ? 'text-white font-medium' : 'text-[var(--text-secondary)]'}>Main Organization</span>
                        </button>
                        {branches.map(branch => (
                          <button
                            key={branch._id} type="button"
                            onClick={() => { setSelectedBranch(branch); setStep(3); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200"
                            style={{ background: 'rgba(20,20,46,0.8)', border: selectedBranch?._id === branch._id ? '2px solid #6366f1' : '1px solid rgba(99,102,241,0.2)' }}
                          >
                            <GitBranch size={16} className="text-purple-400" />
                            <div className="flex-1 text-left">
                              <span className="text-white font-medium">{branch.name}</span>
                              <span className="text-[var(--text-secondary)] ml-2 text-xs">{branch.code}</span>
                            </div>
                            {branch.location && <span className="text-xs text-[var(--text-secondary)]">{branch.location}</span>}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 3: Credentials */}
                <AnimatePresence>
                  {selectedOrg && (step === 3 || branches.length === 0) && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Username / Email</label>
                        <input
                          className="input-field" placeholder="Enter username or email"
                          value={form.identifier} onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Password</label>
                        <div className="relative">
                          <input
                            type={showPwd ? 'text' : 'password'} className="input-field pr-12" placeholder="••••••••"
                            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            required
                          />
                          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" onClick={() => setShowPwd(!showPwd)}>
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="px-4 py-3 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'org' && !selectedOrg)}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="px-8 pb-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#a5bafd] hover:text-white font-medium transition-colors">
                Create Organization
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
          Powered by UEMS · Universal Enquiry Management System
        </p>
      </motion.div>
    </div>
  );
}
