import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateUser } from '../store/slices/authSlice';
import api from '../services/api';
import { Settings, Mail, Lock, Loader2, Save, Eye, EyeOff, Globe } from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'smtp', label: 'Email / SMTP', icon: Mail },
  { id: 'security', label: 'Security', icon: Lock },
];

function TabPanel({ active, id, children }) {
  if (active !== id) return null;
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>{children}</motion.div>;
}

function SectionCard({ title, desc, children }) {
  return (
    <div className="rounded-2xl p-6 space-y-5"
      style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
      <div style={{ borderBottom: '1px solid rgba(99,102,241,0.08)', paddingBottom: '16px' }}>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {desc && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState({});

  const [org, setOrg] = useState(null);
  const [general, setGeneral] = useState({ name: '', website: '', mobile: '', industryType: '' });
  const [smtp, setSmtp] = useState({ smtpHost: '', smtpPort: 587, smtpEmail: '', smtpPassword: '', smtpSenderName: '', replyToEmail: '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    api.get('/org/profile').then(r => {
      const o = r.data.organization;
      setOrg(o);
      setGeneral({ name: o.name || '', website: o.website || '', mobile: o.mobile || '', industryType: o.industryType || '' });
      setSmtp({
        smtpHost: o.smtpHost || '',
        smtpPort: o.smtpPort || 587,
        smtpEmail: o.smtpEmail || '',
        smtpPassword: o.smtpPassword || '',
        smtpSenderName: o.smtpSenderName || '',
        replyToEmail: o.replyToEmail || '',
      });
    }).catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const saveGeneral = async () => {
    setSaving(true);
    try {
      const res = await api.put('/org/profile', general);
      setOrg(res.data.organization);
      dispatch(updateUser({ name: general.name }));
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const saveSMTP = async () => {
    setSaving(true);
    try {
      await api.put('/org/smtp', smtp);
      toast.success('SMTP settings saved!');
    } catch { toast.error('Failed to save SMTP'); }
    finally { setSaving(false); }
  };


  const savePassword = async () => {
    if (pwd.newPassword !== pwd.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwd.newPassword.length < 8) { toast.error('Min 8 characters'); return; }
    setSaving(true);
    try {
      await api.put('/org/password', pwd);
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const togglePwd = (key) => setShowPwd(p => ({ ...p, [key]: !p[key] }));

  const INDUSTRY_TYPES = ['Education', 'Healthcare', 'Real Estate', 'Technology', 'Finance', 'Retail', 'Manufacturing', 'Hospitality', 'Legal', 'Consulting', 'E-commerce', 'Other'];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-[#6366f1]" /></div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-display">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Manage your organization settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.1)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 justify-center"
            style={activeTab === tab.id ? {
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            } : { color: 'var(--text-secondary)' }}>
            <tab.icon size={15} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* General */}
      <TabPanel active={activeTab} id="general">
        <SectionCard title="Organization Profile" desc="Basic organization information">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Organization Name</label>
              <input className="input-field" value={general.name} onChange={e => setGeneral(g => ({ ...g, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Mobile Number</label>
              <input className="input-field" value={general.mobile} onChange={e => setGeneral(g => ({ ...g, mobile: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Industry</label>
              <select className="input-field" value={general.industryType} onChange={e => setGeneral(g => ({ ...g, industryType: e.target.value }))}
                style={{ background: 'rgba(20,20,46,0.8)' }}>
                <option value="">Select industry</option>
                {INDUSTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Website</label>
              <div className="relative">
                <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input className="input-field pl-9" placeholder="https://yourwebsite.com" value={general.website}
                  onChange={e => setGeneral(g => ({ ...g, website: e.target.value }))} />
              </div>
            </div>
          </div>
          <button onClick={saveGeneral} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Changes
          </button>
        </SectionCard>
      </TabPanel>

      {/* SMTP */}
      <TabPanel active={activeTab} id="smtp">
        <SectionCard title="Email / SMTP Settings" desc="Configure your email server for sending enquiry notifications">
          <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
            <p className="text-[var(--text-secondary)]">
              <span className="text-white font-medium">📧 Custom SMTP: </span>
              When configured, all enquiry emails will be sent from your organization's email address.
              Leave empty to use UEMS platform email.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">SMTP Host</label>
              <input className="input-field" placeholder="smtp.gmail.com" value={smtp.smtpHost}
                onChange={e => setSmtp(s => ({ ...s, smtpHost: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">SMTP Port</label>
              <input className="input-field" type="number" placeholder="587" value={smtp.smtpPort}
                onChange={e => setSmtp(s => ({ ...s, smtpPort: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">SMTP Email</label>
              <input className="input-field" type="email" placeholder="noreply@yourcompany.com" value={smtp.smtpEmail}
                onChange={e => setSmtp(s => ({ ...s, smtpEmail: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">SMTP Password</label>
              <div className="relative">
                <input className="input-field pr-10" type={showPwd.smtp ? 'text' : 'password'} placeholder="App password"
                  value={smtp.smtpPassword} onChange={e => setSmtp(s => ({ ...s, smtpPassword: e.target.value }))} />
                <button type="button" onClick={() => togglePwd('smtp')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                  {showPwd.smtp ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Sender Name</label>
              <input className="input-field" placeholder="Your Company Name" value={smtp.smtpSenderName}
                onChange={e => setSmtp(s => ({ ...s, smtpSenderName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Reply-To Email</label>
              <input className="input-field" type="email" placeholder="reply@yourcompany.com" value={smtp.replyToEmail}
                onChange={e => setSmtp(s => ({ ...s, replyToEmail: e.target.value }))} />
            </div>
          </div>
          <button onClick={saveSMTP} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save SMTP Settings
          </button>
        </SectionCard>
      </TabPanel>


      {/* Security */}
      <TabPanel active={activeTab} id="security">
        <SectionCard title="Change Password" desc="Keep your account secure with a strong password">
          <div className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password', placeholder: 'Your current password' },
              { key: 'newPassword', label: 'New Password', placeholder: 'Min 8 characters' },
              { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    className="input-field pr-10"
                    type={showPwd[field.key] ? 'text' : 'password'}
                    placeholder={field.placeholder}
                    value={pwd[field.key]}
                    onChange={e => setPwd(p => ({ ...p, [field.key]: e.target.value }))}
                  />
                  <button type="button" onClick={() => togglePwd(field.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                    {showPwd[field.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={savePassword} disabled={saving || !pwd.currentPassword || !pwd.newPassword}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />} Change Password
          </button>
        </SectionCard>

        <SectionCard title="Account Info" desc="Your account details">
          <div className="space-y-3">
            {org && [
              { label: 'Email', value: org.email },
              { label: 'Username', value: org.username },
              { label: 'Member Since', value: new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Account Status', value: org.status },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                <span className="text-sm text-white font-medium capitalize">{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </TabPanel>
    </div>
  );
}
