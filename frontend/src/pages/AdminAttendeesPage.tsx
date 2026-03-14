import { useState, useEffect } from 'react';
import { admin as adminApi, events as eventsApi, users as usersApi } from '../services/api';
import type { User, AttendeesStats, EventData, EventAttendee } from '../types';
import AttendancePieChart from '../components/AttendancePieChart/AttendancePieChart';
import { ArrowLeft, Loader2, MapPin, Building2, Leaf, UserCheck, UserX, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const dietColors: Record<string, string> = {
  none: 'bg-slate-700 text-slate-300',
  vegetarian: 'bg-green-900/50 text-green-300',
  vegan: 'bg-emerald-900/50 text-emerald-300',
  halal: 'bg-blue-900/50 text-blue-300',
  kosher: 'bg-purple-900/50 text-purple-300',
  other: 'bg-amber-900/50 text-amber-300',
};

export default function AdminAttendeesPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [stats, setStats] = useState<AttendeesStats | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[] | User[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const canTrackAttendance = selectedEventId && selectedEvent && (selectedEvent.status === 'active' || selectedEvent.status === 'completed');

  const handleSetAttendance = async (userId: number, attended: boolean | null) => {
    if (!selectedEventId) return;
    setAttendanceLoading(true);
    try {
      await adminApi.setAttendance(selectedEventId, userId, attended);
      setAttendees(prev => prev.map(a =>
        'user' in a && a.user.id === userId ? { ...a, attended } : a
      ) as EventAttendee[] | User[]);
    } catch (err) {
      console.error(err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    eventsApi.list().then(setEvents).catch(console.error);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, a] = await Promise.all([
          adminApi.attendeesStats(selectedEventId ?? undefined),
          selectedEventId ? adminApi.eventAttendees(selectedEventId) : usersApi.list().then(users => users as User[]),
        ]);
        setStats(s);
        setAttendees(a);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedEventId]);

  if (loading && !selectedEventId) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;
  }

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
          <option value="">-- All attendees (global) --</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      <h1 className="text-2xl font-bold text-slate-100 mb-4">
        Attendees Overview {selectedEventId ? `– ${events.find(e => e.id === selectedEventId)?.name}` : '(all)'}
      </h1>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <>
          {stats && (
            <>
              <div className={`grid gap-2 mb-4 ${canTrackAttendance ? 'grid-cols-4' : 'grid-cols-2'}`}>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
                  <p className="text-xs text-slate-500">Total Registered</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-emerald-600">{Object.keys(stats.countryBreakdown).length}</p>
                  <p className="text-xs text-slate-500">Countries</p>
                </div>
                {canTrackAttendance && (
                  <>
                    <div className="card text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {(attendees as EventAttendee[]).filter(a => 'attended' in a && a.attended === true).length}
                      </p>
                      <p className="text-xs text-slate-500">Attended</p>
                    </div>
                    <div className="card text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {(attendees as EventAttendee[]).filter(a => 'attended' in a && a.attended === false).length}
                      </p>
                      <p className="text-xs text-slate-500">No-show</p>
                    </div>
                  </>
                )}
              </div>
              {canTrackAttendance && Array.isArray(attendees) && attendees.length > 0 && attendees.some(a => 'attended' in a) && (
                <div className="card mb-4">
                  <h3 className="text-sm font-semibold text-slate-100 mb-3">Attendance overview</h3>
                  <AttendancePieChart
                    attended={(attendees as EventAttendee[]).filter(a => a.attended === true).length}
                    noShow={(attendees as EventAttendee[]).filter(a => a.attended === false).length}
                    notMarked={(attendees as EventAttendee[]).filter(a => a.attended === null).length}
                    size={180}
                  />
                </div>
              )}
            </>
          )}

          {stats && stats.total > 0 && (
            <>
              <div className="card mb-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Dietary Breakdown</h3>
                <div className="space-y-1.5">
                  {Object.entries(stats.dietaryBreakdown).map(([pref, count]) => (
                    <div key={pref} className="flex items-center gap-2">
                      <span className={`badge ${dietColors[pref] || dietColors.other}`}>{pref.charAt(0).toUpperCase() + pref.slice(1)}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-400 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(stats.allergyBreakdown).length > 0 && (
                <div className="card mb-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Allergies</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.allergyBreakdown).map(([allergy, count]) => (
                      <span key={allergy} className="badge bg-red-50 text-red-600">{allergy} ({count})</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="card mb-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">By Country</h3>
                <div className="space-y-1">
                  {Object.entries(stats.countryBreakdown).map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-slate-400"><MapPin size={12} /> {country}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <h2 className="text-lg font-bold text-slate-100 mb-2">Attendees ({attendees.length})</h2>
          <div className="space-y-2">
            {attendees.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No attendees to display</p>
            ) : (
              attendees.map((item) => {
                const u = 'user' in item ? item.user : item;
                const att = 'attended' in item ? item.attended : undefined;
                return (
                  <div key={u.id} className="card cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate(`/people/${u.id}`)}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 text-sm truncate">{u.fullName}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {u.company && <span className="flex items-center gap-0.5"><Building2 size={10} /> {u.company}</span>}
                          {u.country && <span className="flex items-center gap-0.5"><MapPin size={10} /> {u.country}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {att !== undefined && canTrackAttendance && (
                          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleSetAttendance(u.id, true)}
                              disabled={attendanceLoading}
                              className={`p-1 rounded ${att === true ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-emerald-900/50'}`}
                              title="Attended"
                            >
                              <UserCheck size={16} />
                            </button>
                            <button
                              onClick={() => handleSetAttendance(u.id, false)}
                              disabled={attendanceLoading}
                              className={`p-1 rounded ${att === false ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-amber-900/50'}`}
                              title="No-show"
                            >
                              <UserX size={16} />
                            </button>
                            <button
                              onClick={() => handleSetAttendance(u.id, null)}
                              disabled={attendanceLoading}
                              className={`p-1 rounded ${att === null ? 'bg-slate-600' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                              title="Not marked"
                            >
                              <Minus size={16} />
                            </button>
                          </div>
                        )}
                        {att !== undefined && selectedEventId && !canTrackAttendance && (
                          <span className={`badge text-[10px] ${
                            att === true ? 'bg-emerald-100 text-emerald-700' :
                            att === false ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-700 text-slate-500'
                          }`}>
                            {att === true ? 'Attended' : att === false ? 'No-show' : '—'}
                          </span>
                        )}
                        {u.dietaryPreference && u.dietaryPreference !== 'none' && (
                          <span className={`badge text-[10px] ${dietColors[u.dietaryPreference] || dietColors.other}`}>
                            <Leaf size={10} className="mr-0.5" />{u.dietaryPreference}
                          </span>
                        )}
                        {u.allergies.length > 0 && (
                          <span className="badge text-[10px] bg-red-50 text-red-600">{u.allergies.length} allergies</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
