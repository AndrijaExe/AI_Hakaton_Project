import { useState, useEffect } from 'react';
import { admin as adminApi, events as eventsApi } from '../services/api';
import type { EventData } from '../types';
import MarkdownEditor from '../components/MarkdownEditor/MarkdownEditor';
import { ArrowLeft, Mail, FileText, Loader2, Send, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const emailSchema = Yup.object({
  subject: Yup.string().required('Subject is required'),
  message: Yup.string().when('attachPdf', {
    is: false,
    then: (s) => s.required('Message is required when not attaching PDF'),
  }),
  busInfoSentence: Yup.string().when('attachPdf', {
    is: true,
    then: (s) => s.required('Bus info is required when attaching PDF'),
  }),
  attachPdf: Yup.boolean(),
});

export default function AdminCommunicationsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      subject: 'Community Day – Event Reminder',
      message: '',
      busInfoSentence: '',
      attachPdf: false,
      sendNotification: false,
    },
    validationSchema: emailSchema,
    onSubmit: async (values) => {
      if (!selectedEventId) {
        setError('Select an event');
        return;
      }
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await adminApi.sendEventEmail(selectedEventId, {
          subject: values.subject,
          message: values.message.trim() || undefined,
          attachPdf: values.attachPdf,
          busInfoSentence: values.attachPdf ? values.busInfoSentence.trim() : undefined,
          sendNotification: values.sendNotification,
        });
        setSuccess(
          res.notificationCreated
            ? `Email sent to ${res.recipientCount} attendees. Notification posted to Feed.`
            : `Email sent to ${res.recipientCount} attendees`
        );
        formik.setFieldValue('message', '');
      } catch (err: unknown) {
        setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send email');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    eventsApi.list().then(setEvents).catch(console.error);
  }, []);

  const handleDownloadPdf = async () => {
    if (!formik.values.busInfoSentence.trim()) {
      formik.setFieldTouched('busInfoSentence', true);
      setError('Enter bus information');
      return;
    }

    setPdfLoading(true);
    setError(null);
    try {
      const blob = await adminApi.generatePdf(formik.values.busInfoSentence.trim());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'turisticki-vodic.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="page-container">
      <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
          <Mail size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Communications</h1>
          <p className="text-xs text-slate-500">Send email and/or PDF guide to event attendees</p>
        </div>
      </div>

      <div className="card mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">Event</label>
        <select
          value={selectedEventId ?? ''}
          onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
          className="input-field"
        >
          <option value="">-- Select event --</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.attendeeCount ?? 0} attendees)
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="card mb-4">
          <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <Mail size={16} /> Email
          </h3>
          <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
          <input
            type="text"
            className={`input-field mb-3 ${formik.touched.subject && formik.errors.subject ? 'border-red-400' : ''}`}
            placeholder="Email subject"
            {...formik.getFieldProps('subject')}
          />
          {formik.touched.subject && formik.errors.subject && (
            <p className="text-xs text-red-500 -mt-2 mb-2">{formik.errors.subject}</p>
          )}
          <label className="block text-sm font-medium text-slate-300 mb-1">Email Body</label>
          <MarkdownEditor
            value={formik.values.message}
            onChange={(v) => formik.setFieldValue('message', v)}
            placeholder="Dear participant,&#10;&#10;This is a reminder about the upcoming Community Day event..."
            minHeight="140px"
          />
          {formik.touched.message && formik.errors.message && (
            <p className="text-xs text-red-500 mt-1">{formik.errors.message}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Select text and click Bold or Italic to format</p>
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              type="checkbox"
              checked={formik.values.sendNotification}
              onChange={(e) => formik.setFieldValue('sendNotification', e.target.checked)}
              className="rounded border-slate-600"
            />
            <span className="text-sm text-slate-300">Also post in-app notification (appears on Feed)</span>
          </label>
        </div>

        <div className="card mb-4">
          <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <FileText size={16} /> PDF – Tourist Guide (Novi Sad & Belgrade)
          </h3>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Bus information (where and when the bus will pick you up)
          </label>
          <input
            type="text"
            className={`input-field mb-3 ${formik.touched.busInfoSentence && formik.errors.busInfoSentence ? 'border-red-400' : ''}`}
            placeholder="e.g. Bus picks you up on Friday 14.3 at 8:00 in front of building XYZ in Belgrade"
            {...formik.getFieldProps('busInfoSentence')}
          />
          {formik.touched.busInfoSentence && formik.errors.busInfoSentence && (
            <p className="text-xs text-red-500 -mt-2 mb-2">{formik.errors.busInfoSentence}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading || !formik.values.busInfoSentence.trim()}
              className="btn-secondary flex items-center gap-2"
            >
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {pdfLoading ? 'Generating...' : 'Download PDF'}
          </button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formik.values.attachPdf}
              onChange={(e) => formik.setFieldValue('attachPdf', e.target.checked)}
              className="rounded border-slate-600"
            />
            <span className="text-sm text-slate-300">Attach PDF to email</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-xl text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-900/30 text-green-300 rounded-xl text-sm">{success}</div>
      )}

      <button
        type="submit"
        disabled={loading || !selectedEventId}
        className="btn-accent w-full flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {loading ? 'Sending...' : 'Send email to attendees'}
      </button>
      </form>

      {selectedEvent && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          Email will be sent to all {selectedEvent.attendeeCount ?? 0} registered attendees of &quot;{selectedEvent.name}&quot;
        </p>
      )}
    </div>
  );
}
