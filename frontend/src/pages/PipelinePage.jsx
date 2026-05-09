import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Loader2, Sparkles, Phone, Mail, GripVertical } from 'lucide-react';

const COLUMNS = [
  { id: 'new', label: 'New', color: '#3b82f6', emoji: '🆕' },
  { id: 'contacted', label: 'Contacted', color: '#f59e0b', emoji: '📞' },
  { id: 'in_progress', label: 'In Progress', color: '#8b5cf6', emoji: '⚡' },
  { id: 'follow_up', label: 'Follow Up', color: '#06b6d4', emoji: '🔄' },
  { id: 'completed', label: 'Completed', color: '#22c55e', emoji: '✅' },
  { id: 'cancelled', label: 'Cancelled', color: '#ef4444', emoji: '❌' },
];

function EnquiryCard({ enquiry, onDragStart }) {
  const priorityColor = { urgent: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#6b7280' };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      draggable
      onDragStart={e => onDragStart(e, enquiry._id)}
      className="rounded-xl p-4 cursor-grab active:cursor-grabbing group transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: 'rgba(20,20,46,0.9)',
        border: '1px solid rgba(99,102,241,0.12)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {enquiry.name[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-white leading-tight">{enquiry.name}</p>
            <span className="text-xs font-mono text-[var(--text-secondary)]">{enquiry.enquiryNumber}</span>
          </div>
        </div>
        <GripVertical size={14} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
      </div>

      <div className="space-y-1 mb-3">
        {enquiry.email && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Mail size={10} /><span className="truncate">{enquiry.email}</span>
          </div>
        )}
        {enquiry.mobile && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Phone size={10} /><span>{enquiry.mobile}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: priorityColor[enquiry.priority] }} />
          <span className="text-xs capitalize" style={{ color: priorityColor[enquiry.priority] }}>{enquiry.priority}</span>
        </div>
        {enquiry.aiAnalyzed && (
          <div className="flex items-center gap-1 text-xs text-[#a5bafd]">
            <Sparkles size={10} />{enquiry.aiPriorityScore}%
          </div>
        )}
      </div>

      {enquiry.aiSummary && (
        <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed border-t pt-2"
          style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
          {enquiry.aiSummary}
        </p>
      )}
    </motion.div>
  );
}

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const loadPipeline = async () => {
    try {
      const res = await api.get('/enquiries/pipeline');
      setPipeline(res.data.pipeline);
    } catch { toast.error('Failed to load pipeline'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPipeline(); }, []);

  const handleDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!dragId) return;

    // Find source column
    let sourceStatus = null;
    let enquiry = null;
    for (const [status, items] of Object.entries(pipeline)) {
      const found = items.find(i => i._id === dragId);
      if (found) { sourceStatus = status; enquiry = found; break; }
    }

    if (!sourceStatus || sourceStatus === targetStatus) { setDragId(null); setDragOver(null); return; }

    // Optimistic update
    setPipeline(prev => {
      const next = { ...prev };
      next[sourceStatus] = next[sourceStatus].filter(i => i._id !== dragId);
      next[targetStatus] = [{ ...enquiry, status: targetStatus }, ...(next[targetStatus] || [])];
      return next;
    });

    try {
      await api.put(`/enquiries/${dragId}`, { status: targetStatus });
      toast.success(`Moved to ${targetStatus.replace('_', ' ')}`);
    } catch {
      toast.error('Failed to update status');
      loadPipeline(); // revert
    }

    setDragId(null);
    setDragOver(null);
  };

  const total = Object.values(pipeline).reduce((sum, items) => sum + (items?.length || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 size={32} className="animate-spin text-[#6366f1]" />
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Pipeline</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{total} enquiries across all stages</p>
        </div>
        <button onClick={loadPipeline} className="btn-secondary text-sm py-2 px-4">Refresh</button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {COLUMNS.map(col => {
          const items = pipeline[col.id] || [];
          const isDragTarget = dragOver === col.id;
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 flex flex-col rounded-2xl transition-all duration-200"
              style={{
                background: isDragTarget ? `${col.color}10` : 'rgba(15,15,35,0.6)',
                border: `1px solid ${isDragTarget ? col.color + '40' : 'rgba(99,102,241,0.1)'}`,
                minHeight: 400,
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 pb-3" style={{ borderBottom: `1px solid rgba(99,102,241,0.08)` }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.emoji}</span>
                  <span className="text-sm font-semibold text-white">{col.label}</span>
                </div>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: col.color + '30', color: col.color }}>
                  {items.length}
                </span>
              </div>

              {/* Color bar */}
              <div className="h-0.5 mx-4 rounded-full" style={{ background: col.color + '40' }} />

              {/* Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {items.length === 0 ? (
                  <div className={`h-24 rounded-xl border-2 border-dashed flex items-center justify-center text-xs transition-colors ${isDragTarget ? 'border-opacity-60' : 'border-opacity-20'}`}
                    style={{ borderColor: col.color + (isDragTarget ? '60' : '20'), color: isDragTarget ? col.color : 'var(--text-secondary)' }}>
                    {isDragTarget ? 'Drop here' : 'Empty'}
                  </div>
                ) : (
                  items.map(e => (
                    <EnquiryCard
                      key={e._id}
                      enquiry={e}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
