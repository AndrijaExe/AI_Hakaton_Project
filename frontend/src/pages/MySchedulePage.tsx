import { useState, useEffect, useCallback } from 'react';
import { schedule as scheduleApi } from '../services/api';
import type { ScheduleEvent } from '../types';
import SessionCard from '../components/SessionCard/SessionCard';
import { CalendarClock, Calendar, MapPin, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function MySchedulePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await scheduleApi.my();
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

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-100">My Schedule</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={48} className="text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No events in your schedule</p>
          <p className="text-slate-500 text-sm mt-1">
            Register for events on the Agenda to add them here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => {
            const eventDate = new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });
            const grouped = event.sessions.reduce<Record<string, typeof event.sessions>>((acc, s) => {
              const hour = formatTime(s.startsAt);
              if (!acc[hour]) acc[hour] = [];
              acc[hour].push(s);
              return acc;
            }, {});

            return (
              <div key={event.id} className="card">
                <button
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="text-left w-full"
                >
                  <h2 className="text-lg font-bold text-slate-100 hover:text-primary-600 transition-colors">
                    {event.name}
                  </h2>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={14} /> {eventDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {event.location}
                    </span>
                  </div>
                </button>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Your program</h3>
                  <div className="space-y-4">
                    {Object.entries(grouped).map(([time, sessions]) => (
                      <div key={time}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-primary-600">{time}</span>
                          <div className="flex-1 h-px bg-slate-600" />
                        </div>
                        <div className="space-y-2">
                          {sessions.map((session) => (
                            <SessionCard
                              key={session.id}
                              session={{
                                ...session,
                                isBookmarked: false,
                                isRegistered: session.isRegistered ?? false,
                              }}
                              nonClickable
                              hideBookmark
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
