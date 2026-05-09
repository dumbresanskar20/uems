import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createEnquiry, updateEnquiry } from '../../store/slices/enquirySlice';
import { X, Loader2, Sparkles } from 'lucide-react';

const PRIORITIES = ['low','medium','high','urgent'];
const STATUSES = ['new','contacted','in_progress','follow_up','completed','cancelled'];

export default function EnquiryModal({ enquiry, formFields = [], onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: enquiry?.name || '',
    email: enquiry?.email || '',
    mobile: enquiry?.mobile || '',
    priority: enquiry?.priority || 'medium',
    status: enquiry?.status || 'new',
    source: enquiry?.source || 'manual',
    dynamicFields: enquiry?.dynamicFields || {},
  });

  const customFields = formFields.filter(f => !f.isDefault && f.isActive);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      let res;
      if (enquiry) {
        res = await dispatch(updateEnquiry({ id: enquiry._id, data: form }));
      } else {
        res = await dispatch(createEnquiry(form));
      }
      if (res.meta.requestStatus === 'fulfilled') {
        toast.success(enquiry ? 'Enquiry updated!' : 'Enquiry created!');
        onSuccess?.();
      } else {
        toast.error(res.payload?.message || 'Failed');
      }
    } finally { setLoading(false); }
  };

  const renderField = (field) => {
    const val = form.dynamicFields[field.id] || '';
    const onChange = (v) => setForm(f => ({ ...f, dynamicFields: { ...f.dynamicFields, [field.id]: v } }));

    if (field.fieldType === 'select') {
      return (
        <select value={val} onChange={e => onChange(e.target.value)}
          className="input-field text-sm" style={{ background: 'rgba(20,20,46,0.8)' }}>
          <option value="">Select {field.label}</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (field.fieldType === 'textarea') {
      return <textarea value={val} onChange={e => onChange(e.target.value)}
        className="input-field text-sm resize-none" rows={3} placeholder={field.placeholder || `Enter ${field.label}`} />;
    }
    if (field.fieldType === 'checkbox') {
      return (
        <div className="flex flex-wrap gap-2">
          {field.options?.map(o => (
            <label key={o} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(val || []).includes(o)}
                onChange={e => {
                  const arr = Array.isArray(val) ? [...val] : [];
                  onChange(e.target.checked ? [...arr, o] : arr.filter(x => x !== o));
                }}
                className="rounded" />
              <span className="text-sm text-white">{o}</span>
            </label>
          ))}
        </div>
      );
    }
    if (field.fieldType === 'radio') {
      return (
        <div className="flex flex-wrap gap-3">
          {field.options?.map(o => (
            <label key={o} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={field.id} value={o} checked={val === o}
                onChange={() => onChange(o)} />
              <span className="text-sm text-white">{o}</span>
            </label>
          ))}
        </div>
      );
    }
    return (
      <input
        type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
        value={val} onChange={e => onChange(e.target.value)}
        className="input-field text-sm" placeholder={field.placeholder || `Enter ${field.label}`}
        required={field.isRequired}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'rgba(15,15,35,0.98)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div>
            <h2 className="text-lg font-bold text-white font-display">
              {enquiry ? 'Edit Enquiry' : 'New Enquiry'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
              <Sparkles size={10} /> AI analysis will run automatically
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Default Fields */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Full Name *</label>
            <input className="input-field" placeholder="John Doe" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label>
              <input className="input-field text-sm" type="email" placeholder="john@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Mobile</label>
              <input className="input-field text-sm" placeholder="+91 9876543210"
                value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Priority</label>
              <select className="input-field text-sm" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                style={{ background: 'rgba(20,20,46,0.8)' }}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Status</label>
              <select className="input-field text-sm" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ background: 'rgba(20,20,46,0.8)' }}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Source</label>
            <select className="input-field text-sm" value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              style={{ background: 'rgba(20,20,46,0.8)' }}>
              {['manual','website','phone','email','walk-in','referral','social','other'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Fields */}
          {customFields.map(field => (
            <div key={field.id}>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                {field.label}{field.isRequired && ' *'}
              </label>
              {renderField(field)}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : enquiry ? 'Update' : 'Create Enquiry'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
