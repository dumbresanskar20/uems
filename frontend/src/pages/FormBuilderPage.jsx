import { useEffect, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Plus, Trash2, GripVertical, Save, Loader2, Eye, Lock } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📱' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'textarea', label: 'Textarea', icon: '📄' },
  { value: 'select', label: 'Dropdown', icon: '🔽' },
  { value: 'radio', label: 'Radio', icon: '⭕' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'date', label: 'Date', icon: '📅' },
];

function FieldCard({ field, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [optionInput, setOptionInput] = useState('');

  const addOption = () => {
    if (!optionInput.trim()) return;
    onUpdate({ ...field, options: [...(field.options || []), optionInput.trim()] });
    setOptionInput('');
  };
  const removeOption = (i) => onUpdate({ ...field, options: field.options.filter((_, idx) => idx !== i) });

  return (
    <motion.div layout className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(20,20,46,0.8)', border: `1px solid ${expanded ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)'}` }}>
      <div className="flex items-center gap-3 p-4">
        <GripVertical size={16} className="text-[var(--text-secondary)] flex-shrink-0 cursor-grab" />
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="text-lg flex-shrink-0">{FIELD_TYPES.find(t => t.value === field.fieldType)?.icon || '📝'}</span>
          <div className="flex-1 min-w-0">
            <input
              className="bg-transparent border-none outline-none text-sm font-medium text-white w-full"
              value={field.label}
              onChange={e => onUpdate({ ...field, label: e.target.value })}
              placeholder="Field label"
            />
            <p className="text-xs text-[var(--text-secondary)] capitalize">{field.fieldType}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {field.isDefault && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#a5bafd' }}>
              <Lock size={10} /> Default
            </div>
          )}
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={field.isRequired} className="sr-only peer"
              onChange={e => onUpdate({ ...field, isRequired: e.target.checked })}
              disabled={field.isDefault && field.id === 'name'} />
            <div className="w-8 h-4 rounded-full peer transition-colors peer-checked:bg-indigo-500 bg-gray-600" />
            <div className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
          </label>
          <span className="text-xs text-[var(--text-secondary)]">Req</span>

          <button onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors text-xs">
            {expanded ? '▲' : '▼'}
          </button>
          {!field.isDefault && (
            <button onClick={() => onDelete(field.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 pt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Field Type</label>
                  <select
                    value={field.fieldType}
                    onChange={e => onUpdate({ ...field, fieldType: e.target.value })}
                    disabled={field.isDefault}
                    className="input-field text-sm py-2" style={{ background: 'rgba(10,10,26,0.8)' }}
                  >
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Placeholder</label>
                  <input
                    className="input-field text-sm py-2" placeholder="Placeholder text"
                    value={field.placeholder || ''} onChange={e => onUpdate({ ...field, placeholder: e.target.value })}
                  />
                </div>
              </div>

              {['select','radio','checkbox'].includes(field.fieldType) && (
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Options</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(field.options || []).map((opt, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-white"
                        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        {opt}
                        <button onClick={() => removeOption(i)} className="text-red-400 hover:text-red-300 ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="input-field text-sm py-2 flex-1" placeholder="Add option..."
                      value={optionInput} onChange={e => setOptionInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())} />
                    <button onClick={addOption} className="btn-secondary text-sm py-2 px-3">Add</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FormBuilderPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    api.get('/org/form-fields').then(r => {
      setFields(r.data.formFields?.fields?.sort((a,b) => a.order - b.order) || []);
    }).catch(() => toast.error('Failed to load fields'))
    .finally(() => setLoading(false));
  }, []);

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      fieldType: 'text',
      placeholder: '',
      isRequired: false,
      isDefault: false,
      options: [],
      order: fields.length,
      isActive: true,
    };
    setFields(f => [...f, newField]);
  };

  const updateField = (updated) => {
    setFields(f => f.map(field => field.id === updated.id ? updated : field));
  };

  const deleteField = (id) => {
    setFields(f => f.filter(field => field.id !== id));
  };

  const handleSave = async () => {
    const ordered = fields.map((f, i) => ({ ...f, order: i }));
    setSaving(true);
    try {
      await api.put('/org/form-fields', { fields: ordered });
      setFields(ordered);
      toast.success('Form saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 size={32} className="animate-spin text-[#6366f1]" /></div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Form Builder</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Customize enquiry form fields</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(!preview)} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
            <Eye size={15} /> {preview ? 'Edit' : 'Preview'}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
          </button>
        </div>
      </div>

      {preview ? (
        /* Preview Mode */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <h3 className="text-lg font-bold text-white font-display mb-4">Form Preview</h3>
          {fields.filter(f => f.isActive).map(field => (
            <div key={field.id}>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                {field.label}{field.isRequired && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {field.fieldType === 'textarea' ? (
                <textarea className="input-field resize-none text-sm" rows={3} placeholder={field.placeholder} disabled />
              ) : field.fieldType === 'select' ? (
                <select className="input-field text-sm" disabled style={{ background: 'rgba(20,20,46,0.8)' }}>
                  <option>Select {field.label}</option>
                  {field.options?.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input className="input-field text-sm" type={field.fieldType} placeholder={field.placeholder} disabled />
              )}
            </div>
          ))}
          <button className="btn-primary w-full mt-4" disabled>Submit Enquiry</button>
        </motion.div>
      ) : (
        /* Edit Mode */
        <div className="space-y-4">
          <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
            <p className="text-[var(--text-secondary)]">
              <span className="text-white font-medium">Tip: </span>
              Drag to reorder fields. Fields marked as <span className="text-[#a5bafd]">Default</span> cannot be deleted.
              Name, Email, and Mobile are required default fields.
            </p>
          </div>

          <Reorder.Group axis="y" values={fields} onReorder={setFields} className="space-y-3">
            {fields.map(field => (
              <Reorder.Item key={field.id} value={field}>
                <FieldCard field={field} onUpdate={updateField} onDelete={deleteField} />
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <button onClick={addField}
            className="w-full py-3 rounded-xl border-2 border-dashed text-[var(--text-secondary)] hover:text-white hover:border-[#6366f1] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
            <Plus size={16} /> Add Custom Field
          </button>
        </div>
      )}
    </div>
  );
}
