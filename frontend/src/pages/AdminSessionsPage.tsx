import { useState, useEffect, useCallback } from 'react';
import { events as eventsApi, admin as adminApi } from '../services/api';
import type { EventData, Session } from '../types';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const sessionSchema = Yup.object({
  title: Yup.string().required('Title is required').min(1, 'Title is required'),
  description: Yup.string(),
  speaker: Yup.string(),
  location: Yup.string(),
  category: Yup.string().required('Category is required'),
  startsAt: Yup.string().required('Start time is required'),
  endsAt: Yup.string().required('End time is required'),
  tagsInput: Yup.string(),
});

export default function AdminSessionsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const formik = useFormik({
    initialValues: {
      title: '', description: '', speaker: '', location: '', category: 'presentation',
      startsAt: '', endsAt: '', tagsInput: '',
    },
    validationSchema: sessionSchema,
    onSubmit: async (values) => {
      setSaving(true);
      const payload = {
        title: values.title,
        description: values.description,
        speaker: values.speaker,
        location: values.location,
        category: values.category,
        startsAt: values.startsAt,
        endsAt: values.endsAt,
        tags: values.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        capacity: null,
        isOptional: true,
        eventId: selectedEventId ?? undefined,
      };
      try {
        if (editingId) {
          await adminApi.updateSession(editingId, payload);
        } else {
          await adminApi.createSession(payload);
        }
        cancel();
        await load();
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    eventsApi.list().then(setEvents).catch(console.error);
  }, []);

  const load = useCallback(async () => {
    if (!selectedEventId) {
      setSessionsList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await adminApi.eventSessions(selectedEventId);
      setSessionsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (s: Session) => {
    setEditingId(s.id);
    setShowCreate(false);
    formik.setValues({
      title: s.title, description: s.description || '', speaker: s.speaker || '',
      location: s.location || '', category: s.category,
      startsAt: s.startsAt?.replace(' ', 'T')?.slice(0, 16) || '', endsAt: s.endsAt?.replace(' ', 'T')?.slice(0, 16) || '',
      tagsInput: s.tags?.join(', ') || '',
    });
    formik.setTouched({});
    formik.setErrors({});
  };

  const openCreate = () => {
    setEditingId(null);
    setShowCreate(true);
    formik.setValues({
      title: '', description: '', speaker: '', location: '', category: 'presentation',
      startsAt: '', endsAt: '', tagsInput: '',
    });
    formik.setTouched({});
    formik.setErrors({});
  };

  const cancel = () => {
    setEditingId(null);
    setShowCreate(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this session?')) return;
    try {
      await adminApi.deleteSession(id);
      setSessionsList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (d: string) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

  const fieldError = (name: keyof typeof formik.values) =>
    formik.touched[name] && formik.errors[name] ? formik.errors[name] : null;

  const renderForm = () => (
    <form onSubmit={formik.handleSubmit} className="card mb-4 border-2 border-primary-200">
      <h3 className="font-semibold text-slate-100 mb-3">{editingId ? 'Edit Session' : 'New Session'}</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1 block">Title *</label>
          <input
            className={`input-field ${fieldError('title') ? 'border-red-400' : ''}`}
            placeholder="e.g. Opening Keynote"
            {...formik.getFieldProps('title')}
          />
          {fieldError('title') && <p className="text-xs text-red-500 mt-1">{fieldError('title')}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1 block">Description</label>
          <textarea
            className="input-field resize-none h-20"
            placeholder="Describe this session..."
            {...formik.getFieldProps('description')}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Speaker</label>
            <input className="input-field" placeholder="e.g. John Smith" {...formik.getFieldProps('speaker')} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Location</label>
            <input className="input-field" placeholder="e.g. Main Hall" {...formik.getFieldProps('location')} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1 block">Category</label>
          <select className="input-field" {...formik.getFieldProps('category')}>
            {['presentation', 'workshop', 'discussion', 'networking', 'consultation', 'social'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Starts At *</label>
            <input
              type="datetime-local"
              className={`input-field ${fieldError('startsAt') ? 'border-red-400' : ''}`}
              {...formik.getFieldProps('startsAt')}
            />
            {fieldError('startsAt') && <p className="text-xs text-red-500 mt-1">{fieldError('startsAt')}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Ends At *</label>
            <input
              type="datetime-local"
              className={`input-field ${fieldError('endsAt') ? 'border-red-400' : ''}`}
              {...formik.getFieldProps('endsAt')}
            />
            {fieldError('endsAt') && <p className="text-xs text-red-500 mt-1">{fieldError('endsAt')}</p>}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1 block">Tags</label>
          <input className="input-field" placeholder="e.g. cloud, pos, api (comma separated)" {...formik.getFieldProps('tagsInput')} />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={cancel} className="btn-secondary flex-1 flex items-center justify-center gap-1"><X size={16} /> Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
        </div>
      </div>
    </form>
  );

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const canEditSessions = selectedEvent && selectedEvent.status !== 'active';

  return (
    <div className="page-container">
      <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} /><span className="text-sm font-medium">Back</span>
      </button>

      <div className="card mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">Select event</label>
        <select
          value={selectedEventId ?? ''}
          onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
          className="input-field"
        >
          <option value="">-- Select event --</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {!selectedEventId ? (
        <p className="text-center text-slate-500 py-12">Select an event to manage its sessions</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-100">Manage Sessions – {selectedEvent?.name}</h1>
            {canEditSessions && (
              <button onClick={openCreate} className="btn-primary flex items-center gap-1 text-sm"><Plus size={16} /> Add</button>
            )}
          </div>
          {selectedEvent?.status === 'active' && (
            <p className="text-sm text-amber-400 mb-4">Sessions cannot be edited during a live event.</p>
          )}

          {showCreate && canEditSessions && renderForm()}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
          ) : (
            <div className="space-y-2">
              {sessionsList.map(s => (
                <div key={s.id}>
                  {editingId === s.id && canEditSessions ? renderForm() : (
                    <div className="card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="badge bg-slate-700 text-slate-300">{s.category}</span>
                          </div>
                          <h3 className="font-semibold text-slate-100 text-sm">{s.title}</h3>
                          <p className="text-xs text-slate-500">{formatTime(s.startsAt)} – {formatTime(s.endsAt)} | {s.location}</p>
                          {s.speaker && <p className="text-xs text-slate-500">{s.speaker}</p>}
                        </div>
                        {canEditSessions && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEdit(s)} className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400"><Pencil size={15} /></button>
                            <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-full hover:bg-red-900/30 text-red-400"><Trash2 size={15} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
