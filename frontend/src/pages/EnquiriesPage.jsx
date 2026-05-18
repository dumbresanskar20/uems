import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { fetchEnquiries, deleteEnquiry, updateEnquiry } from '../store/slices/enquirySlice';
import api from '../services/api';
import {
  Plus, Search, Download, Trash2, Edit2, Eye, Loader2,
  ChevronLeft, ChevronRight, Sparkles, Phone, Mail, Inbox, CheckSquare, Square
} from 'lucide-react';
import EnquiryModal from '../components/enquiry/EnquiryModal';
import EnquiryDetailModal from '../components/enquiry/EnquiryDetailModal';

const STATUSES = ['new','contacted','in_progress','follow_up','completed','cancelled'];
const PRIORITIES = ['low','medium','high','urgent'];
const STATUS_COLORS = {
  new: '#3B82F6', contacted: '#F59E0B', in_progress: '#8B5CF6',
  follow_up: '#06B6D4', completed: '#10B981', cancelled: '#EF4444',
};

export default function EnquiriesPage() {
  const dispatch = useDispatch();
  const { enquiries, pagination, loading } = useSelector(s => s.enquiry);
  const { user } = useSelector(s => s.auth);

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailEnquiry, setDetailEnquiry] = useState(null);
  const [editEnquiry, setEditEnquiry] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    api.get('/org/form-fields').then(r => setFormFields(r.data.formFields?.fields || [])).catch(() => {});
  }, []);

  const loadEnquiries = useCallback(() => {
    dispatch(fetchEnquiries({ page, limit: 15, search, status: statusFilter, priority: priorityFilter }));
  }, [page, search, statusFilter, priorityFilter, dispatch]);

  useEffect(() => { loadEnquiries(); }, [loadEnquiries]);

  useEffect(() => {
    const t = setTimeout(loadEnquiries, 400);
    return () => clearTimeout(t);
  }, [search, loadEnquiries]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
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

  const toggleSelectAll = () => {
    if (selectedIds.length === enquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(enquiries.map(e => e._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const priorityDot = { urgent: '#EF4444', high: '#F59E0B', medium: '#8B5CF6', low: '#94A3B8' };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Enquiries</h1>
          <p className="text-[#94A3B8] mt-1">
            Manage and track all your {pagination?.total || 0} incoming leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleExport('csv')} disabled={exportLoading} className="btn-secondary hidden sm:flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 shadow-glow">
            <Plus size={18} /> New Enquiry
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass p-2 rounded-2xl border border-[#8B5CF6]/20 flex flex-wrap gap-2 shadow-premium relative z-20">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            className="w-full bg-transparent border-none outline-none text-white placeholder-[#94A3B8] pl-11 pr-4 py-3 text-sm focus:ring-0"
            placeholder="Search name, email, phone..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-px bg-[#8B5CF6]/20 my-2 hidden sm:block" />
        <select
          className="bg-transparent text-sm text-white px-4 py-3 outline-none border-none cursor-pointer appearance-none min-w-[140px] hover:bg-white/5 rounded-xl transition-colors"
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="" className="bg-[#111827]">Status: All</option>
          {STATUSES.map(s => <option key={s} value={s} className="bg-[#111827]">{s.replace('_', ' ')}</option>)}
        </select>
        <div className="w-px bg-[#8B5CF6]/20 my-2 hidden sm:block" />
        <select
          className="bg-transparent text-sm text-white px-4 py-3 outline-none border-none cursor-pointer appearance-none min-w-[140px] hover:bg-white/5 rounded-xl transition-colors"
          value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
        >
          <option value="" className="bg-[#111827]">Priority: All</option>
          {PRIORITIES.map(p => <option key={p} value={p} className="bg-[#111827] capitalize">{p}</option>)}
        </select>
      </div>

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between px-6 py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6]/20 to-[#3B82F6]/20 border border-[#8B5CF6]/30 shadow-neon"
          >
            <span className="text-sm font-medium text-white">{selectedIds.length} selected</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                Assign To
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] text-xs font-medium transition-colors">
                Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-2xl glass border border-[#8B5CF6]/20 shadow-premium overflow-hidden relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 size={32} className="animate-spin text-[#8B5CF6]" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="relative mb-6 group">
              <div className="absolute inset-0 bg-[#8B5CF6] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#111827] to-[#070B14] border border-[#8B5CF6]/20 flex items-center justify-center relative z-10 shadow-glow">
                <Inbox size={32} className="text-[#8B5CF6]" />
              </div>
            </div>
            <p className="text-xl font-bold text-white mb-2">No enquiries found</p>
            <p className="text-[#94A3B8] max-w-sm mb-6">You're all caught up! When new leads arrive, they will show up here.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Create Enquiry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#8B5CF6]/10 bg-[#111827]/50">
                  <th className="p-4 w-12 text-center">
                    <button onClick={toggleSelectAll} className="text-[#94A3B8] hover:text-white transition-colors">
                      {selectedIds.length === enquiries.length ? <CheckSquare size={18} className="text-[#8B5CF6]" /> : <Square size={18} />}
                    </button>
                  </th>
                  <th className="p-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Lead</th>
                  <th className="p-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Priority</th>
                  <th className="p-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">AI Score</th>
                  <th className="p-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8B5CF6]/5">
                {enquiries.map((e, i) => {
                  const isSelected = selectedIds.includes(e._id);
                  return (
                    <motion.tr
                      key={e._id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={`group hover:bg-white/5 transition-colors ${isSelected ? 'bg-[#8B5CF6]/5' : ''}`}
                    >
                      <td className="p-4 text-center">
                        <button onClick={() => toggleSelect(e._id)} className="text-[#94A3B8] group-hover:text-white transition-colors">
                          {isSelected ? <CheckSquare size={18} className="text-[#8B5CF6]" /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#111827] to-[#1F2937] border border-[#8B5CF6]/20 flex items-center justify-center text-white font-bold shadow-inner flex-shrink-0 group-hover:border-[#8B5CF6]/50 transition-colors">
                            {e.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-[#8B5CF6] transition-colors">{e.name}</p>
                            <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{e.enquiryNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {e.email && <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]"><Mail size={12} className="text-[#8B5CF6]" />{e.email}</div>}
                          {e.mobile && <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]"><Phone size={12} className="text-[#3B82F6]" />{e.mobile}</div>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="relative group/select">
                          <select
                            value={e.status}
                            onChange={ev => handleStatusChange(e._id, ev.target.value)}
                            className="appearance-none bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider cursor-pointer pl-3 pr-8 py-1.5 rounded-md transition-colors w-full focus:ring-0"
                            style={{ 
                              color: STATUS_COLORS[e.status] || '#8B5CF6',
                              backgroundColor: `${STATUS_COLORS[e.status] || '#8B5CF6'}15`,
                              boxShadow: `inset 0 0 0 1px ${STATUS_COLORS[e.status] || '#8B5CF6'}30`
                            }}
                          >
                            {STATUSES.map(s => <option key={s} value={s} className="bg-[#111827] text-white">{s.replace('_',' ')}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shadow-glow" style={{ background: priorityDot[e.priority] }} />
                          <span className="text-xs font-semibold capitalize text-white">{e.priority}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {e.aiAnalyzed ? (
                          <div className="flex items-center gap-1.5">
                            <Sparkles size={14} className="text-[#10B981]" />
                            <div className="w-16 h-1.5 bg-[#111827] rounded-full overflow-hidden border border-white/5">
                              <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399]" style={{ width: `${e.aiPriorityScore}%` }} />
                            </div>
                            <span className="text-xs font-bold text-white">{e.aiPriorityScore}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#94A3B8] italic">Pending</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-[#94A3B8] font-medium">
                          {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDetailEnquiry(e)} className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors" title="View Details">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => setEditEnquiry(e)} className="p-2 rounded-lg text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(e._id)} className="p-2 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-[#94A3B8] font-medium">
            Showing page <span className="text-white font-bold">{pagination.page}</span> of <span className="text-white font-bold">{pagination.pages}</span>
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-xl glass border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
              className="p-2 rounded-xl glass border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 transition-colors"
            >
              <ChevronRight size={18} />
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
