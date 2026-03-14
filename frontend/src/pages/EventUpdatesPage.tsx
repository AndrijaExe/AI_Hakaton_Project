import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { events as eventsApi } from '../services/api';
import type { EventData, Notification } from '../types';
import { ArrowLeft, Bell, Calendar, Loader2, Info, AlertTriangle } from 'lucide-react';

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  alert: AlertTriangle,
};

function formatSentAt(dateStr: string) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `Sent ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Sent ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Sent ${days}d ago`;
  return `Sent on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

function NotificationCard({ item }: { item: Notification }) {
  const Icon = typeIcons[item.type] || Info;
  const isAlert = item.type === 'alert' || item.priority === 'high';
  return (
    <div className={`card border-l-4 ${isAlert ? 'border-l-red-400' : 'border-l-primary-400'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-full shrink-0 ${isAlert ? 'bg-red-900/50 text-red-400' : 'bg-primary-900/50 text-primary-400'}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-100 text-sm">{item.title}</h3>
            <span className="text-xs text-slate-500 shrink-0">{formatSentAt(item.createdAt)}</span>
          </div>
          <p className="text-sm text-slate-300 mt-0.5 whitespace-pre-wrap">{item.content}</p>
        </div>
      </div>
    </div>
  );
}

export default function EventUpdatesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [beforeEvent, setBeforeEvent] = useState<Notification[]>([]);
  const [duringEvent, setDuringEvent] = useState<Notification[]>([]);
  const [afterEvent, setAfterEvent] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setEvent(null);
    try {
      const data = await eventsApi.notifications(Number(id));
      setEvent(data.event);
      setBeforeEvent(data.beforeEvent);
      setDuringEvent(data.duringEvent);
      setAfterEvent(data.afterEvent ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-container">
        <div className="text-center py-20">
          <p className="text-slate-400 mb-4">Event not found</p>
          <button
            onClick={() => navigate('/agenda')}
            className="text-primary-600 font-medium text-sm"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const hasAny = beforeEvent.length > 0 || duringEvent.length > 0 || afterEvent.length > 0;

  return (
    <div className="page-container">
      <button
        onClick={() => navigate(`/events/${id}`)}
        className="flex items-center gap-1 text-primary-600 mb-4 -ml-1"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to event</span>
      </button>

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl">
          <Bell size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Updates</h1>
          <p className="text-xs text-slate-500">{event.name}</p>
        </div>
      </div>

      <div className="card mb-6 p-3 bg-primary-900/30 border-primary-700/50">
        <div className="flex items-center gap-2 text-sm text-primary-200">
          <Calendar size={16} />
          <span>{eventDate}</span>
        </div>
      </div>

      {!hasAny ? (
        <div className="text-center py-16">
          <Bell size={48} className="text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No updates yet for this event</p>
        </div>
      ) : (
        <div className="space-y-8">
          {beforeEvent.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Before the event
              </h2>
              <div className="space-y-2">
                {beforeEvent.map((item) => (
                  <NotificationCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {duringEvent.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                During the event
              </h2>
              <div className="space-y-2">
                {duringEvent.map((item) => (
                  <NotificationCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {afterEvent.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                After the event
              </h2>
              <div className="space-y-2">
                {afterEvent.map((item) => (
                  <NotificationCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
