import { useState, useEffect, useCallback } from 'react';
import { events as eventsApi, admin as adminApi } from '../services/api';
import type { EventData } from '../types';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const eventSchema = Yup.object({
  name: Yup.string().required('Name is required').min(1, 'Name is required'),
  description: Yup.string(),
  date: Yup.string().required('Date is required'),
  location: Yup.string().required('Location is required'),
});

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const formik = useFormik({
    initialValues: { name: '', description: '', date: '', location: '' },
    validationSchema: eventSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const payload = { ...values, status: 'upcoming' };
        if (editingId) {
          await adminApi.updateEvent(editingId, payload);
        } else {
          await adminApi.createEvent(payload);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventsApi.list();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (e: EventData) => {
    setEditingId(e.id);
    setShowCreate(false);
    formik.setValues({
      name: e.name,
      description: e.description || '',
      date: e.date || '',
      location: e.location || '',
    });
    formik.setTouched({});
    formik.setErrors({});
  };

  const openCreate = () => {
    setEditingId(null);
    setShowCreate(true);
    formik.setValues({ name: '', description: '', date: '', location: '' });
    formik.setTouched({});
    formik.setErrors({});
  };

  const cancel = () => {
    setEditingId(null);
    setShowCreate(false);
  };

  const fieldError = (name: keyof typeof formik.values) =>
    formik.touched[name] && formik.errors[name] ? formik.errors[name] : null;

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event? All sessions will be removed.')) return;
    try {
      await adminApi.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} /><span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-100">Manage Events</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1 text-sm"><Plus size={16} /> Add Event</button>
      </div>

      {showCreate && (
        <form onSubmit={formik.handleSubmit} className="card mb-4 border-2 border-primary-200">
          <h3 className="font-semibold text-slate-100 mb-3">New Event</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Name *</label>
              <input
                className={`input-field ${fieldError('name') ? 'border-red-400' : ''}`}
                placeholder="e.g. Community Day 2026"
                {...formik.getFieldProps('name')}
              />
              {fieldError('name') && <p className="text-xs text-red-500 mt-1">{fieldError('name')}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Description</label>
              <textarea className="input-field resize-none h-20" placeholder="Event description..." {...formik.getFieldProps('description')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Date *</label>
                <input
                  type="date"
                  className={`input-field ${fieldError('date') ? 'border-red-400' : ''}`}
                  {...formik.getFieldProps('date')}
                />
                {fieldError('date') && <p className="text-xs text-red-500 mt-1">{fieldError('date')}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Location *</label>
                <input
                  className={`input-field ${fieldError('location') ? 'border-red-400' : ''}`}
                  placeholder="e.g. Belgrade"
                  {...formik.getFieldProps('location')}
                />
                {fieldError('location') && <p className="text-xs text-red-500 mt-1">{fieldError('location')}</p>}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={cancel} className="btn-secondary flex-1 flex items-center justify-center gap-1"><X size={16} /> Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="space-y-2">
          {events.map(e => (
            <div key={e.id}>
              {editingId === e.id ? (
                <form onSubmit={formik.handleSubmit} className="card mb-4 border-2 border-primary-200">
                  <h3 className="font-semibold text-slate-100 mb-3">Edit Event</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1 block">Name *</label>
                      <input
                        className={`input-field ${fieldError('name') ? 'border-red-400' : ''}`}
                        {...formik.getFieldProps('name')}
                      />
                      {fieldError('name') && <p className="text-xs text-red-500 mt-1">{fieldError('name')}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1 block">Description</label>
                      <textarea className="input-field resize-none h-20" {...formik.getFieldProps('description')} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 block">Date *</label>
                        <input
                          type="date"
                          className={`input-field ${fieldError('date') ? 'border-red-400' : ''}`}
                          {...formik.getFieldProps('date')}
                        />
                        {fieldError('date') && <p className="text-xs text-red-500 mt-1">{fieldError('date')}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 block">Location *</label>
                        <input
                          className={`input-field ${fieldError('location') ? 'border-red-400' : ''}`}
                          {...formik.getFieldProps('location')}
                        />
                        {fieldError('location') && <p className="text-xs text-red-500 mt-1">{fieldError('location')}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={cancel} className="btn-secondary flex-1 flex items-center justify-center gap-1"><X size={16} /> Cancel</button>
                      <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-100">{e.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{e.date} • {e.location}</p>
                      {e.attendeeCount !== undefined && (
                        <p className="text-xs text-slate-500">{e.attendeeCount} attendees</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(e)} className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-full hover:bg-red-900/30 text-red-400"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
