import { useState, useEffect } from 'react';
import { admin as adminApi, events as eventsApi } from '../services/api';
import type { EventData } from '../types';
import MarkdownEditor from '../components/MarkdownEditor/MarkdownEditor';
import { ArrowLeft, Bell, Loader2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const schema = Yup.object({
  title: Yup.string().required('Title is required'),
  message: Yup.string().required('Message is required'),
});

export default function AdminSendNotificationsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      title: 'Event update',
      message: '',
      type: 'info',
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      if (!selectedEventId) {
        setError('Select an event');
        return;
      }
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await adminApi.sendEventNotification(selectedEventId, {
          title: values.title.trim(),
          message: values.message.trim(),
          type: values.type,
        });
        setSuccess(`Notification sent to ${res.recipientCount} attendees. They will see it in their Feed.`);
        formik.resetForm({ values: { title: 'Event update', message: '', type: 'info' }, errors: {}, touched: {} });
      } catch (err: unknown) {
        setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send notification');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    eventsApi.list().then(setEvents).catch(console.error);
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="page-container">
      <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
          <Bell size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Send Notifications</h1>
          <p className="text-xs text-slate-400">Post in-app notifications to event attendees (no email)</p>
        </div>
      </div>

      <div className="card mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-1">Event</label>
        <select
          value={selectedEventId ?? ''}
          onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
          className="input-field"
        >
          <option value="">-- Select event --</option>
          {events.filter((e) => e.status !== 'completed').map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.attendeeCount ?? 0} attendees)
            </option>
          ))}
        </select>
        {events.filter((e) => e.status !== 'completed').length === 0 && events.length > 0 && (
          <p className="text-xs text-amber-600 mt-1">No upcoming or active events. Notifications can only be sent for events that haven&apos;t closed yet.</p>
        )}
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="card mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Notification type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="info"
                checked={formik.values.type === 'info'}
                onChange={() => formik.setFieldValue('type', 'info')}
                className="text-primary-600"
              />
              <span className="text-sm">Info</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="alert"
                checked={formik.values.type === 'alert'}
                onChange={() => formik.setFieldValue('type', 'alert')}
                className="text-primary-600"
              />
              <span className="text-sm">Alert</span>
            </label>
          </div>
        </div>
        <div className="card mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
          <input
            type="text"
            className={`input-field mb-3 ${formik.touched.title && formik.errors.title ? 'border-red-400' : ''}`}
            placeholder="e.g. Event update"
            {...formik.getFieldProps('title')}
          />
          {formik.touched.title && formik.errors.title && (
            <p className="text-xs text-red-500 -mt-2 mb-2">{formik.errors.title}</p>
          )}
          <label className="block text-sm font-medium text-slate-300 mb-1">Message (Markdown)</label>
          <MarkdownEditor
            value={formik.values.message}
            onChange={(v) => formik.setFieldValue('message', v)}
            placeholder="Write your notification message..."
            minHeight="140px"
          />
          {formik.touched.message && formik.errors.message && (
            <p className="text-xs text-red-500 mt-1">{formik.errors.message}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Select text and click Bold or Italic to format</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm">{success}</div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedEventId || selectedEvent?.status === 'completed'}
          className="btn-accent w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {loading ? 'Sending...' : 'Send notification to attendees'}
        </button>
      </form>

      {selectedEvent && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          Notification will appear in the Feed for all {selectedEvent.attendeeCount ?? 0} registered attendees of &quot;{selectedEvent.name}&quot;
        </p>
      )}
    </div>
  );
}
