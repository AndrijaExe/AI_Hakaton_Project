import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { events as eventsApi, sessions as sessionsSvc, admin as adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { EventData, Session, EventAttendee } from '../types';
import SessionCard from '../components/SessionCard/SessionCard';
import AttendancePieChart from '../components/AttendancePieChart/AttendancePieChart';
import { ArrowLeft, MapPin, CalendarDays, Users, Search, CheckCircle2, Loader2, LogIn, Bell, UserCheck, UserX, Minus } from 'lucide-react';

const categories = ['all', 'presentation', 'workshop', 'discussion', 'networking', 'consultation', 'social'];

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isGuest, isAdmin } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [registering, setRegistering] = useState(false);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await eventsApi.detail(Number(id));
      setEvent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (id && isAdmin && event && (event.status === 'active' || event.status === 'completed')) {
      adminApi.eventAttendees(Number(id)).then(setAttendees).catch(console.error);
    } else {
      setAttendees([]);
    }
  }, [id, isAdmin, event?.status]);

  const handleRegisterEvent = async () => {
    if (!event || isGuest) {
      navigate('/login');
      return;
    }
    setRegistering(true);
    try {
      if (event.isRegistered) {
        await eventsApi.unregister(event.id);
      } else {
        await eventsApi.register(event.id);
      }
      setEvent(prev => prev ? { ...prev, isRegistered: !prev.isRegistered } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };

  const handleSetAttendance = async (userId: number, attended: boolean | null) => {
    if (!event?.id) return;
    setAttendanceLoading(true);
    try {
      await adminApi.setAttendance(event.id, userId, attended);
      setAttendees(prev => prev.map(a =>
        a.user.id === userId ? { ...a, attended } : a
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleToggleCheckIn = async (sessionId: number, isCheckedIn: boolean) => {
    if (isGuest) {
      navigate('/login');
      return;
    }
    try {
      if (isCheckedIn) {
        await sessionsSvc.unregister(sessionId);
      } else {
        await sessionsSvc.register(sessionId);
      }
      setEvent(prev => {
        if (!prev?.sessions) return prev;
        return {
          ...prev,
          sessions: prev.sessions.map(s =>
            s.id === sessionId ? { ...s, isRegistered: !isCheckedIn } : s
          ),
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!event) {
    return <div className="page-container text-center text-slate-400 py-20">Event not found</div>;
  }

  const allSessions = event.sessions || [];

  const filtered = allSessions.filter(
    (s) =>
      (activeCategory === 'all' || s.category === activeCategory) &&
      (!search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.speaker.toLowerCase().includes(search.toLowerCase()))
  );

  const groupByTime = (list: Session[]) =>
    list.reduce<Record<string, Session[]>>((acc, s) => {
      const hour = new Date(s.startsAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(s);
      return acc;
    }, {});

  const sessionsGrouped = groupByTime(filtered);

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="page-container">
      <button onClick={() => navigate('/agenda')} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Events</span>
      </button>

      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-4 mb-4 text-white -mx-1">
        <h1 className="text-xl font-bold">{event.name}</h1>
        <p className="text-sm text-primary-100 mt-1 mb-2">{event.description}</p>
        <div className="flex flex-wrap gap-3 text-sm text-primary-200">
          <span className="flex items-center gap-1"><CalendarDays size={14} /> {eventDate}</span>
          <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>
          {event.attendeeCount > 0 && (
            <span className="flex items-center gap-1"><Users size={14} /> {event.attendeeCount} attendees</span>
          )}
        </div>

        {(event.status === 'active' || event.status === 'completed') ? (
          <div className="mt-3 w-full py-2.5 px-4 bg-white/10 rounded-xl text-sm text-primary-200 text-center">
            Registration closed for {event.status === 'active' ? 'live' : 'past'} events
          </div>
        ) : isGuest ? (
          <button
            onClick={() => navigate('/login')}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
          >
            <LogIn size={16} /> Sign in to register
          </button>
        ) : (
          <button
            onClick={handleRegisterEvent}
            disabled={registering}
            className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              event.isRegistered
                ? 'bg-white/20 hover:bg-white/30'
                : 'bg-white/90 text-primary-900 hover:bg-white'
            }`}
          >
            {registering ? (
              <Loader2 size={16} className="animate-spin" />
            ) : event.isRegistered ? (
              <CheckCircle2 size={16} />
            ) : null}
            {event.isRegistered ? 'Registered' : 'Register for this event'}
          </button>
        )}
      </div>

      <button
        onClick={() => navigate(`/events/${id}/updates`)}
        className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 rounded-xl border border-primary-600/50 text-primary-400 hover:bg-primary-900/30 transition-colors text-sm font-medium"
      >
        <Bell size={16} />
        Event updates
      </button>

      {isAdmin && (event.status === 'active' || event.status === 'completed') && attendees.length > 0 && (
        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <Users size={16} />
            Attendance statistics
          </h3>
          {event.status === 'completed' ? (
            <AttendancePieChart
              attended={attendees.filter(a => a.attended === true).length}
              noShow={attendees.filter(a => a.attended === false).length}
              notMarked={attendees.filter(a => a.attended === null).length}
              size={180}
            />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <AttendancePieChart
                  attended={attendees.filter(a => a.attended === true).length}
                  noShow={attendees.filter(a => a.attended === false).length}
                  notMarked={attendees.filter(a => a.attended === null).length}
                  size={120}
                />
                <p className="text-xs text-slate-500">Mark who attended and who did not</p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto border-t border-slate-600 pt-3">
                {attendees.map((a) => (
                  <div key={a.user.id} className="flex items-center justify-between py-2 border-b border-slate-600 last:border-0">
                    <span className="text-sm font-medium text-slate-100 truncate flex-1">{a.user.fullName}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetAttendance(a.user.id, true); }}
                        disabled={attendanceLoading}
                        className={`p-1.5 rounded-lg transition-colors ${a.attended === true ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-emerald-900/50 hover:text-emerald-300'}`}
                        title="Attended"
                      >
                        <UserCheck size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetAttendance(a.user.id, false); }}
                        disabled={attendanceLoading}
                        className={`p-1.5 rounded-lg transition-colors ${a.attended === false ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-amber-900/50 hover:text-amber-300'}`}
                        title="No-show"
                      >
                        <UserX size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetAttendance(a.user.id, null); }}
                        disabled={attendanceLoading}
                        className={`p-1.5 rounded-lg transition-colors ${a.attended === null ? 'bg-slate-600 text-slate-300' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'}`}
                        title="Not marked"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <h2 className="text-lg font-bold text-slate-100 mb-3">Activities</h2>
      <p className="text-xs text-slate-400 mb-3">Click on an activity to join – it will be added to your schedule automatically</p>

      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search sessions or speakers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-primary-500 text-white'
                : 'bg-slate-700 text-slate-300 border border-slate-600'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {Object.entries(sessionsGrouped).map(([time, sessions]) => (
          <div key={time}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-primary-600">{time}</span>
              <div className="flex-1 h-px bg-slate-600" />
            </div>
            <div className="space-y-2">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onToggleCheckIn={event.isRegistered ? handleToggleCheckIn : undefined}
                  isGuest={isGuest}
                  hideBookmark
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-400 py-8">No sessions found</p>
      )}
    </div>
  );
}
