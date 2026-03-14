import { useState, useEffect } from 'react';
import { events as eventsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { EventData } from '../types';
import { Sparkles, MapPin, CalendarDays, Users, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgendaPage() {
  const [eventsList, setEventsList] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token, isGuest } = useAuth();

  useEffect(() => {
    eventsApi.list()
      .then(setEventsList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Events</h1>
          <p className="text-sm text-slate-400">Browse upcoming events</p>
        </div>
        <div className="flex items-center gap-2">
          {isGuest && (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-600 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-700"
            >
              Sign In
            </button>
          )}
          {token && (
            <button
              onClick={() => navigate('/ai')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium shadow-sm"
            >
              <Sparkles size={16} />
              For You
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : eventsList.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays size={48} className="text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-4">
          {eventsList.map(event => {
            const eventDate = new Date(event.date);
            const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
            const fullDate = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

            return (
              <div
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white cursor-pointer active:scale-[0.98] transition-transform shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.status === 'active' ? 'bg-emerald-400/90 text-white' :
                        event.status === 'completed' ? 'bg-red-500/90 text-white' :
                        'bg-white/20 text-white'
                      }`}>
                        {event.status === 'upcoming' ? 'Upcoming' : event.status === 'active' ? 'Live Now' : 'Closed'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">{event.name}</h2>
                    <p className="text-sm text-primary-100 line-clamp-2 mb-3">{event.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-primary-200">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={15} />
                        {dayName}, {fullDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={15} />
                        {event.location}
                      </span>
                      {event.attendeeCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Users size={15} />
                          {event.attendeeCount} attendees
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-primary-200 shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
