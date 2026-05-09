import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Plus, GitBranch, Edit2, Power, Loader2, X, ArrowRight, RefreshCw, CheckCircle, AlertTriangle, MapPin, Mail, Phone } from 'lucide-react';

// OTP Input
const OTPInput = ({ value, onChange }) => (
  <div className="flex gap-3 justify-center">
    {Array.from({ length: 6 }).map((_, i) => (
      <input key={i} id={`botp-${i}`} type="text" inputMode="numeric" maxLength={1}
        value={value[i] || ''}
        onChange={e => {
          const arr = value.split('');
          arr[i] = e.target.value.replace(/\D/g, '');
          onChange(arr.join(''));
          if (e.target.value && i < 5) document.getElementById(`botp-${i+1}`)?.focus();
        }}
        onKeyDown={e => {
          if (e.key === 'Backspace') {
            const arr = value.split(''); arr[i] = '';
            onChange(arr.join(''));
            if (i > 0) document.getElementById(`botp-${i-1}`)?.focus();
          }
        }}
        className="w-11 h-13 text-center text-lg font-bold rounded-xl outline-none transition-all"
        style={{ background: 'rgba(20,20,46,0.8)', border: value[i] ? '2px solid #6366f1' : '1px solid rgba(99,102,241,0.3)', color: '#fff', height: '52px' }}
      />
    ))}
  </div>
);

function BranchModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('form'); // form | otp | success
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [form, setForm] = useState({ name: '', code: '', email: '', username: '', password: '', confirmPassword: '', location: '', mobile: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/branches/initiate', form);
      setPendingEmail(form.email);
      setStep('otp');
      toast.success('Verification code sent!');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'BRANCH_LIMIT_REACHED') {
        toast.error(`${errData.message}`);
        onClose();
      } else {
        toast.error(errData?.message || 'Failed to create branch');
      }
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter 6-digit code'); return; }
    setLoading(true);
    try {
      await api.post('/branches/verify', { email: pendingEmail, otp });
      setStep('success');
      setTimeout(() => { onClose(); onSuccess(); }, 1800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setOtp('');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'rgba(15,15,35,0.98)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <GitBranch size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">{step === 'otp' ? 'Verify Branch Email' : 'Create New Branch'}</h2>
              <p className="text-xs text-[var(--text-secondary)]">An OTP will be sent to verify the branch email</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Branch Name *</label>
                  <input className="input-field text-sm" placeholder="North Branch" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Branch Code *</label>
                  <input className="input-field text-sm" placeholder="NORTH-01" value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Branch Email *</label>
                  <input className="input-field text-sm" type="email" placeholder="north@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Username *</label>
                  <input className="input-field text-sm" placeholder="north_admin" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))} required />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Mobile</label>
                  <input className="input-field text-sm" placeholder="+91 9876543210" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Password *</label>
                  <input className="input-field text-sm" type="password" placeholder="Min 8 chars" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Confirm Password *</label>
                  <input className="input-field text-sm" type="password" placeholder="Repeat" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Location</label>
                  <input className="input-field text-sm" placeholder="City, State" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Send OTP</span><ArrowRight size={14} /></>}
                </button>
              </div>
            </motion.form>
          )}

          {step === 'otp' && (
            <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleVerify} className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-[var(--text-secondary)] text-sm mb-4">Enter the 6-digit code sent to <span className="text-white font-medium">{pendingEmail}</span></p>
                <OTPInput value={otp} onChange={setOtp} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('form')} className="btn-secondary flex-1">Back</button>
                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify & Create'}
                </button>
              </div>
            </motion.form>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 0 30px rgba(34,197,94,0.4)' }}>
                <CheckCircle size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Branch Created!</h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1">Branch is now active and ready to use.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.branches);
    } catch { toast.error('Failed to load branches'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBranches(); }, []);

  const toggleBranch = async (id, isActive) => {
    try {
      await api.put(`/branches/${id}`, { isActive: !isActive });
      setBranches(b => b.map(br => br._id === id ? { ...br, isActive: !isActive } : br));
      toast.success(isActive ? 'Branch deactivated' : 'Branch activated');
    } catch { toast.error('Failed to update branch'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Branches</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Branch
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-[#6366f1]" /></div>
      ) : branches.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
          style={{ background: 'rgba(15,15,35,0.6)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <GitBranch size={28} className="text-[#6366f1]" />
          </div>
          <p className="text-white font-medium">No branches yet</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">Create your first branch to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">Create Branch</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch, i) => (
            <motion.div key={branch._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card-hover rounded-2xl p-5"
              style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: branch.isActive ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(107,114,128,0.3)' }}>
                    <GitBranch size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{branch.name}</p>
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5bafd' }}>
                      {branch.code}
                    </span>
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full mt-1 ${branch.isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
              </div>

              <div className="space-y-1.5 mb-4">
                {branch.email && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Mail size={11} /><span className="truncate">{branch.email}</span>
                  </div>
                )}
                {branch.mobile && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Phone size={11} /><span>{branch.mobile}</span>
                  </div>
                )}
                {branch.location && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <MapPin size={11} /><span>{branch.location}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                <span className="text-xs text-[var(--text-secondary)] flex-1">
                  Created {new Date(branch.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => toggleBranch(branch._id, branch.isActive)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: branch.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: branch.isActive ? '#f87171' : '#4ade80' }}>
                  <Power size={11} />
                  {branch.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && <BranchModal onClose={() => setShowModal(false)} onSuccess={loadBranches} />}
      </AnimatePresence>
    </div>
  );
}
