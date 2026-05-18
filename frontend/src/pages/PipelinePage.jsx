import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Loader2, Sparkles, Phone, Mail, GripVertical, RefreshCw, AlertCircle } from 'lucide-react';

const COLUMNS = [
  { id: 'new', label: 'Lead', color: '#3B82F6', emoji: '🆕' },
  { id: 'contacted', label: 'Contacted', color: '#F59E0B', emoji: '📞' },
  { id: 'in_progress', label: 'Qualified', color: '#8B5CF6', emoji: '⚡' },
  { id: 'completed', label: 'Converted', color: '#10B981', emoji: '✅' },
];

function EnquiryCard({ enquiry, onDragStart }) {
  const priorityColor = { urgent: '#EF4444', high: '#F59E0B', medium: '#8B5CF6', low: '#94A3B8' };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={e => onDragStart(e, enquiry._id)}
      className="rounded-xl p-4 cursor-grab active:cursor-grabbing group bg-[#111827] border border-[#8B5CF6]/10 hover:border-[#8B5CF6]/40 hover:shadow-glow transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gradient-to-br from-[#1F2937] to-[#070B14] shadow-inner group-hover:border-[#8B5CF6]/30 border border-white/5 transition-colors">
            {enquiry.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight group-hover:text-[#8B5CF6] transition-colors">{enquiry.name}</p>
            <span className="text-xs font-mono text-[#94A3B8]">{enquiry.enquiryNumber}</span>
          </div>
        </div>
        <GripVertical size={14} className="text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>

      <div className="space-y-1.5 mb-4">
        {enquiry.email && (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <Mail size={12} className="text-[#8B5CF6]" /><span className="truncate">{enquiry.email}</span>
          </div>
        )}
        {enquiry.mobile && (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <Phone size={12} className="text-[#3B82F6]" /><span>{enquiry.mobile}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#8B5CF6]/10 pt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full shadow-glow" style={{ background: priorityColor[enquiry.priority] }} />
          <span className="text-xs font-bold capitalize text-white">{enquiry.priority}</span>
        </div>
        {enquiry.aiAnalyzed ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
            <Sparkles size={12} className="text-[#10B981]" />
            <span className="text-xs font-bold text-[#10B981]">{enquiry.aiPriorityScore}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5">
            <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">Unscored</span>
          </div>
        )}
      </div>
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

    let sourceStatus = null;
    let enquiry = null;
    for (const [status, items] of Object.entries(pipeline)) {
      const found = items.find(i => i._id === dragId);
      if (found) { sourceStatus = status; enquiry = found; break; }
    }

    if (!sourceStatus || sourceStatus === targetStatus) { setDragId(null); setDragOver(null); return; }

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
      loadPipeline(); 
    }

    setDragId(null);
    setDragOver(null);
  };

  const total = Object.values(pipeline).reduce((sum, items) => sum + (items?.length || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <Loader2 size={32} className="animate-spin text-[#8B5CF6]" />
    </div>
  );

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pipeline</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#94A3B8]">Drag and drop to manage your {total} active leads</p>
            <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-bold uppercase tracking-widest border border-[#8B5CF6]/20">
              Kanban
            </span>
          </div>
        </div>
        <button onClick={loadPipeline} className="btn-secondary flex items-center gap-2 shadow-sm hover:shadow-neon">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-h-[600px] items-stretch pr-6">
          {COLUMNS.map(col => {
            const items = pipeline[col.id] || [];
            const isDragTarget = dragOver === col.id;
            
            return (
              <div
                key={col.id}
                className="w-80 flex flex-col rounded-3xl glass transition-all duration-300 relative overflow-hidden"
                style={{
                  background: isDragTarget ? `${col.color}08` : 'rgba(17, 24, 39, 0.4)',
                  borderColor: isDragTarget ? `${col.color}40` : 'rgba(139, 92, 246, 0.15)',
                  boxShadow: isDragTarget ? `0 0 40px ${col.color}20` : '0 10px 40px rgba(0, 0, 0, 0.35)',
                }}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, col.id)}
              >
                {/* Column Header Glow */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: col.color, opacity: isDragTarget ? 1 : 0.4, boxShadow: `0 0 20px ${col.color}` }} />

                {/* Column Header */}
                <div className="p-5 flex items-center justify-between bg-[#111827]/50 backdrop-blur-md border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${col.color}20` }}>
                      {col.emoji}
                    </div>
                    <span className="font-bold text-white tracking-wide">{col.label}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold text-white border" style={{ background: `${col.color}20`, borderColor: `${col.color}30` }}>
                    {items.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar relative z-10">
                  <AnimatePresence>
                    {items.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${isDragTarget ? 'border-opacity-60 bg-white/5' : 'border-opacity-20 bg-transparent'}`}
                        style={{ borderColor: col.color, color: isDragTarget ? col.color : '#94A3B8' }}
                      >
                        {isDragTarget ? (
                          <p className="font-bold tracking-wider uppercase text-sm">Drop here</p>
                        ) : (
                          <div className="flex flex-col items-center opacity-50">
                            <AlertCircle size={20} className="mb-2" />
                            <p className="text-xs font-medium">Empty Stage</p>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      items.map(e => (
                        <EnquiryCard key={e._id} enquiry={e} onDragStart={handleDragStart} />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
