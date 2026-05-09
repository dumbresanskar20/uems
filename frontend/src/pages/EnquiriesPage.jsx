import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { fetchEnquiries, deleteEnquiry, updateEnquiry, setSelectedEnquiry } from '../store/slices/enquirySlice';
import api from '../services/api';
import {
  Plus, Search, Filter, Download, Trash2, Edit2, Eye, X, Loader2,
  ChevronLeft, ChevronRight, Sparkles, Phone, Mail, Calendar, AlertCircle, Inbox
} from 'lucide-react';
import EnquiryModal from '../components/enquiry/EnquiryModal';
import EnquiryDetailModal from '../components/enquiry/EnquiryDetailModal';

const STATUSES = ['new','contacted','in_progress','follow_up','completed','cancelled'];
const PRIORITIES = ['low','medium','high','urgent'];

export default function EnquiriesPage() {
  const dispatch = useDispatch();
  const { enquiries, pagination, loading } = useSelector(s => s.enquiry);
  const { user } = useSelector(s => s.auth);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailEnquiry, setDetailEnquiry] = useState(null);
  const [editEnquiry, setEditEnquiry] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    api.get('/org/form-fields').then(r => setFormFields(r.data.formFields?.fields || [])).catch(() => {});
  }, []);

  const loadEnquiries = useCallback(() => {
    dispatch(fetchEnquiries({ page, limit: 15, search, status: statusFilter, priority: priorityFilter }));
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => { loadEnquiries(); }, [loadEnquiries]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(loadEnquiries, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this enquiry?')) return;
    const res = await dispatch(deleteEnquiry(id));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Enquiry deleted');
    else toast.error('Failed to delete');
  };

  const handleStatusChange = async (id, status) => {
    const res = await dispatch(updateEnquiry({ id, data: { status } }));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Status updated');
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const res = await api.get(`/enquiries/export?format=${format}&status=${statusFilter}`, {
        responseType: format === 'csv' ? 'text' : 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `enquiries.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
    finally { setExportLoading(false); }
  };

  const priorityDot = { urgent: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#6b7280' };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Enquiries</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {pagination?.total || 0} total enquiries
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Enquiry
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            className="input-field pl-9 text-sm" placeholder="Search name, email, mobile..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input-field w-auto min-w-32 text-sm"
          style={{ background: 'rgba(20,20,46,0.8)' }}
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select
          className="input-field w-auto min-w-32 text-sm"
          style={{ background: 'rgba(20,20,46,0.8)' }}
          value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} disabled={exportLoading}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exportLoading}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-[#6366f1]" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Inbox size={28} className="text-[#6366f1]" />
            </div>
            <p className="text-white font-medium">No enquiries found</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Create your first enquiry to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                    {['Enquiry #','Name','Contact','Status','Priority','AI','Date','Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((e, i) => (
                    <motion.tr
                      key={e._id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="group transition-colors hover:bg-white/3"
                      style={{ borderBottom: '1px solid rgba(99,102,241,0.05)' }}
                    >
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono text-[#a5bafd]">{e.enquiryNumber}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                            {e.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{e.name}</p>
                            {e.branch && <p className="text-xs text-[var(--text-secondary)]">{e.branch.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          {e.email && <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Mail size={10} />{e.email}</p>}
                          {e.mobile && <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Phone size={10} />{e.mobile}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={e.status}
                          onChange={ev => handleStatusChange(e._id, ev.target.value)}
                          className={`badge badge-${e.status} cursor-pointer outline-none`}
                          style={{ background: 'transparent', border: 'none' }}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: priorityDot[e.priority] }} />
                          <span className={`badge badge-${e.priority} text-xs capitalize`}>{e.priority}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {e.aiAnalyzed ? (
                          <div className="flex items-center gap-1 text-xs text-[#a5bafd]">
                            <Sparkles size={12} />
                            <span>{e.aiPriorityScore}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)]">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {new Date(e.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDetailEnquiry(e)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-indigo-500/20 text-[#a5bafd] transition-colors">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => setEditEnquiry(e)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-500/20 text-blue-400 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(e._id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
              {enquiries.map(e => (
                <div key={e._id} className="p-4 space-y-3" onClick={() => setDetailEnquiry(e)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-[#a5bafd]">{e.enquiryNumber}</span>
                      <p className="text-sm font-medium text-white mt-0.5">{e.name}</p>
                    </div>
                    <span className={`badge badge-${e.status}`}>{e.status.replace('_',' ')}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-[var(--text-secondary)]">
                    {e.email && <span>{e.email}</span>}
                    {e.mobile && <span>·</span>}
                    {e.mobile && <span>{e.mobile}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-secondary)]">
            Page {pagination.page} of {pagination.pages} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="btn-secondary py-2 px-3 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
              className="btn-secondary py-2 px-3 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <EnquiryModal
            formFields={formFields}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => { setShowCreateModal(false); loadEnquiries(); }}
          />
        )}
        {detailEnquiry && (
          <EnquiryDetailModal
            enquiry={detailEnquiry}
            onClose={() => setDetailEnquiry(null)}
            onUpdate={loadEnquiries}
          />
        )}
        {editEnquiry && (
          <EnquiryModal
            enquiry={editEnquiry}
            formFields={formFields}
            onClose={() => setEditEnquiry(null)}
            onSuccess={() => { setEditEnquiry(null); loadEnquiries(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
