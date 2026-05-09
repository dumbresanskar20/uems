import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateUser, setToken } from '../store/slices/authSlice';
import api from '../services/api';
import { Building2, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, CheckCircle, RefreshCw } from 'lucide-react';

// OTP Input Component
const OTPInput = ({ value, onChange, length = 6 }) => {
  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    const arr = value.split('');
    if (val) {
      arr[idx] = val[val.length - 1];
      onChange(arr.join(''));
      // Auto-focus next
      const next = document.getElementById(`otp-${idx + 1}`);
      if (next) next.focus();
    }
  };
  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      const arr = value.split('');
      arr[idx] = '';
      onChange(arr.join(''));
      if (idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    document.getElementById(`otp-${Math.min(pasted.length, length - 1)}`)?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <motion.input
          key={i} id={`otp-${i}`} type="text" inputMode="numeric"
          maxLength={1} value={value[i] || ''}
          onChange={e => handleChange(e, i)} onKeyDown={e => handleKeyDown(e, i)} onPaste={handlePaste}
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all duration-200"
          style={{
            background: 'rgba(20,20,46,0.8)',
            border: value[i] ? '2px solid #6366f1' : '1px solid rgba(99,102,241,0.3)',
            color: '#fff',
            boxShadow: value[i] ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
          }}
        />
      ))}
    </div>
  );
};

// Countdown timer
const useCountdown = (initial) => {
  const [count, setCount] = useState(initial);
  const [active, setActive] = useState(false);
  const start = () => {
    setCount(initial);
    setActive(true);
  };
  useState(() => {
    if (!active) return;
    if (count <= 0) { setActive(false); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  });
  return { count, active, start };
};

const TRIAL_OPTIONS = [
  { label: '1 Day', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '15 Days', value: 15 },
  { label: '1 Month', value: 30 },
];

const INDUSTRY_TYPES = [
  'Education', 'Healthcare', 'Real Estate', 'Technology', 'Finance', 'Retail',
  'Manufacturing', 'Hospitality', 'Legal', 'Consulting', 'E-commerce', 'Other',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'success'
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', confirmPassword: '',
    website: '', mobile: '', industryType: '', trialDuration: 7,
  });

  const startCountdown = () => {
    setCountdown(600); // 10 min
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register/initiate', form);
      setPendingEmail(form.email);
      startCountdown();
      setStep('otp');
      toast.success(`Verification code sent to ${form.email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register/verify', { email: pendingEmail, otp: otpValue });
      const { token, refreshToken, organization } = res.data;

      localStorage.setItem('uems_token', token);
      if (refreshToken) localStorage.setItem('uems_refresh_token', refreshToken);

      localStorage.setItem('uems_user', JSON.stringify(organization));
      dispatch(setToken(token));
      dispatch(updateUser(organization));
      setStep('success');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setOtpValue('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendCount >= 3) return;
    try {
      await api.post('/auth/otp/resend', { email: pendingEmail, type: 'organization_registration' });
      startCountdown();
      setResendCount(c => c + 1);
      setOtpValue('');
      toast.success('New verification code sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const orbs = [
    { x: '5%', y: '10%', color: '#6366f1', size: 400 },
    { x: '75%', y: '70%', color: '#8b5cf6', size: 300 },
    { x: '45%', y: '85%', color: '#06b6d4', size: 250 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12" style={{ background: '#0a0a1a' }}>
      {orbs.map((orb, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left: orb.x, top: orb.y, width: orb.size, height: orb.size, background: `radial-gradient(circle, ${orb.color}15 0%, transparent 70%)`, filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity }}
        />
      ))}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg mx-4"
      >
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(15,15,35,0.92)', backdropFilter: 'blur(30px)',
          border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        }}>
          <AnimatePresence mode="wait">

            {/* ── REGISTRATION FORM ── */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="p-8 pb-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
                      <Building2 size={24} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white font-display">Create Organization</h1>
                      <p className="text-sm text-[var(--text-secondary)]">Get started with UEMS</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Organization Name *</label>
                      <input className="input-field" placeholder="Acme Corporation" value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Username *</label>
                      <input className="input-field" placeholder="acmecorp" value={form.username}
                        onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))} required />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Mobile Number *</label>
                      <input className="input-field" placeholder="+91 9876543210" value={form.mobile}
                        onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} required />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email Address *</label>
                      <input className="input-field" type="email" placeholder="admin@acme.com" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Password *</label>
                      <div className="relative">
                        <input className="input-field pr-10" type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars" value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" onClick={() => setShowPwd(!showPwd)}>
                          {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Confirm Password *</label>
                      <input className="input-field" type="password" placeholder="Repeat password" value={form.confirmPassword}
                        onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Website</label>
                      <input className="input-field" placeholder="https://acme.com" value={form.website}
                        onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Industry</label>
                      <select className="input-field" value={form.industryType}
                        onChange={e => setForm(f => ({ ...f, industryType: e.target.value }))}
                        style={{ background: 'rgba(20,20,46,0.8)' }}>
                        <option value="">Select industry</option>
                        {INDUSTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Free Trial Duration</label>
                      <div className="grid grid-cols-4 gap-2">
                        {TRIAL_OPTIONS.map(opt => (
                          <button key={opt.value} type="button"
                            onClick={() => setForm(f => ({ ...f, trialDuration: opt.value }))}
                            className="py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{
                              background: form.trialDuration === opt.value ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(20,20,46,0.8)',
                              border: form.trialDuration === opt.value ? '1px solid #6366f1' : '1px solid rgba(99,102,241,0.2)',
                              color: form.trialDuration === opt.value ? '#fff' : 'var(--text-secondary)',
                              boxShadow: form.trialDuration === opt.value ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                            }}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Send Verification Code</span><ArrowRight size={16} /></>}
                  </button>

                  <p className="text-center text-sm text-[var(--text-secondary)]">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#a5bafd] hover:text-white font-medium">Sign in</Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ── OTP VERIFICATION ── */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="p-8 pb-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)' }}>
                  <motion.div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.5)' }}
                    animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-3xl">📧</span>
                  </motion.div>
                  <h2 className="text-xl font-bold text-white font-display">Verify Your Email</h2>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">Code sent to <span className="text-white font-medium">{pendingEmail}</span></p>
                </div>

                <form onSubmit={handleVerifyOTP} className="p-8 pt-6 space-y-6">
                  <OTPInput value={otpValue} onChange={setOtpValue} length={6} />

                  {countdown > 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#6366f1] animate-pulse" />
                      <span className="text-sm text-[var(--text-secondary)]">
                        Code expires in <span className="text-white font-mono font-bold">{formatTime(countdown)}</span>
                      </span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || otpValue.length !== 6}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Verify & Create Account</span><ArrowRight size={16} /></>}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => setStep('form')}
                      className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-white transition-colors">
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button type="button" onClick={handleResend}
                      disabled={countdown > 0 || resendCount >= 3}
                      className="flex items-center gap-1 text-[#a5bafd] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <RefreshCw size={14} className={countdown > 0 ? 'animate-spin' : ''} />
                      {resendCount >= 3 ? 'Max resends reached' : countdown > 0 ? 'Resend OTP' : 'Resend Code'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 0 40px rgba(34,197,94,0.5)' }}
                >
                  <CheckCircle size={48} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white font-display mb-2">Account Created!</h2>
                <p className="text-[var(--text-secondary)]">Your organization has been registered successfully.</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#86efac]">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Redirecting to dashboard...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
