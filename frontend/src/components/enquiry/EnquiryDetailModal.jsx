import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { updateEnquiry } from '../../store/slices/enquirySlice';
import api from '../../services/api';
import { X, Sparkles, Phone, Mail, Calendar, MessageSquare, Send, Loader2, Bot } from 'lucide-react';

const STATUSES = ['new','contacted','in_progress','follow_up','completed','cancelled'];

export default function EnquiryDetailModal({ enquiry: initial, onClose, onUpdate }) {
  const dispatch = useDispatch();
  const [enquiry, setEnquiry] = useState(initial);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const handleStatusChange = async (status) => {
    const res = await dispatch(updateEnquiry({ id: enquiry._id, data: { status } }));
    if (res.meta.requestStatus === 'fulfilled') {
      setEnquiry(e => ({ ...e, status }));
      toast.success('Status updated');
      onUpdate?.();
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await api.post(`/enquiries/${enquiry._id}/notes`, { text: noteText });
      setEnquiry(res.data.enquiry);
      setNoteText('');
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
    finally { setAddingNote(false); }
  };

  const priorityColor = { urgent: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#6b7280' };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: 'rgba(15,15,35,0.98)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-[#a5bafd]">{enquiry.enquiryNumber}</span>
              <span className={`badge badge-${enquiry.status}`}>{enquiry.status.replace('_',' ')}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${priorityColor[enquiry.priority]}20`, color: priorityColor[enquiry.priority] }}>
                {enquiry.priority}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white font-display">{enquiry.name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Contact info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {enquiry.email && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                <Mail size={14} className="text-[#6366f1]" />
                <span className="text-sm text-white truncate">{enquiry.email}</span>
              </div>
            )}
            {enquiry.mobile && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                <Phone size={14} className="text-[#6366f1]" />
                <span className="text-sm text-white">{enquiry.mobile}</span>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
              <Calendar size={14} className="text-[#6366f1]" />
              <span className="text-sm text-white">{new Date(enquiry.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Status change */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Update Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${enquiry.status === s ? `badge badge-${s}` : 'text-[var(--text-secondary)] hover:text-white'}`}
                  style={enquiry.status !== s ? { background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' } : {}}>
                  {s.replace('_',' ')}
                </button>
              ))}
            </div>
          </div>

          {/* AI Analysis */}
          {enquiry.aiAnalyzed && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <Bot size={14} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-white">AI Analysis</span>
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#a5bafd' }}>
                  <Sparkles size={10} />
                  Score: {enquiry.aiPriorityScore}%
                </div>
              </div>
              {enquiry.aiSummary && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{enquiry.aiSummary}</p>
              )}
              {enquiry.aiSuggestedActions?.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Suggested Actions</p>
                  <div className="space-y-1">
                    {enquiry.aiSuggestedActions.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-white">
                        <span className="text-[#6366f1] mt-0.5">→</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dynamic fields */}
          {enquiry.dynamicFields && Object.keys(enquiry.dynamicFields).length > 0 && (
            <div>
              <p className="text-sm font-medium text-white mb-2">Additional Information</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(enquiry.dynamicFields).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)' }}>
                    <p className="text-xs text-[var(--text-secondary)] capitalize">{k.replace('_',' ')}</p>
                    <p className="text-sm text-white mt-0.5">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={15} className="text-[#6366f1]" />
              <p className="text-sm font-semibold text-white">Notes ({enquiry.notes?.length || 0})</p>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                className="input-field flex-1 text-sm" placeholder="Add a note..."
                value={noteText} onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              />
              <button onClick={handleAddNote} disabled={!noteText.trim() || addingNote}
                className="btn-primary px-4 py-2 flex items-center gap-1.5 text-sm disabled:opacity-50">
                {addingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {enquiry.notes?.length ? enquiry.notes.slice().reverse().map((note, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.08)' }}>
                  <p className="text-sm text-white">{note.text}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-[var(--text-secondary)]">{note.addedBy}</span>
                    <span className="text-xs text-[var(--text-secondary)]">·</span>
                    <span className="text-xs text-[var(--text-secondary)]">{new Date(note.addedAt).toLocaleString()}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">No notes yet</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
