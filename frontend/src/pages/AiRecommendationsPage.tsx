import { useState, useEffect } from 'react';
import { events as eventsApi, users as usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AiRecommendation } from '../types';
import { ArrowLeft, Sparkles, Calendar, Users, Loader2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Tab = 'events' | 'people';

export default function AiRecommendationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('events');
  const [eventRecs, setEventRecs] = useState<AiRecommendation[]>([]);
  const [peopleRecs, setPeopleRecs] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const hasInterests = user?.interests && user.interests.length > 0;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [events, similarUsers] = await Promise.all([
          eventsApi.recommended(),
          usersApi.similar(),
        ]);
        setEventRecs(events);
        setPeopleRecs(
          similarUsers.map((u) => ({
            id: u.id,
            fullName: u.fullName,
            reason: u.commonInterests?.length
              ? `Common interests: ${u.commonInterests.join(', ')}`
              : 'People you may know',
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const recs = tab === 'events' ? eventRecs : peopleRecs;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">For You</h1>
          <p className="text-xs text-slate-500">Personalized picks based on your profile</p>
        </div>
      </div>

      <div className="card bg-purple-50/50 border border-purple-100 mt-3 mb-4">
        <p className="text-sm text-slate-300">
          We analyze your interests and profile to suggest the most relevant events and people for networking.
        </p>
        {hasInterests ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {user!.interests.map(i => (
              <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">{i}</span>
            ))}
          </div>
        ) : (
          <button
            onClick={() => navigate('/profile/edit')}
            className="mt-2 flex items-center gap-1.5 text-sm text-purple-600 font-medium hover:underline"
          >
            <Pencil size={14} />
            Add your interests to get better recommendations
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('events')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'events' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-slate-800 text-slate-300 border border-slate-600'
          }`}
        >
          <Calendar size={16} /> Events
        </button>
        <button
          onClick={() => setTab('people')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'people' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-slate-800 text-slate-300 border border-slate-600'
          }`}
        >
          <Users size={16} /> People
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <Loader2 className="animate-spin text-purple-500" size={32} />
          <p className="text-sm text-slate-500">Analyzing your profile...</p>
        </div>
      ) : recs.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles size={32} className="text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500 mb-1">No recommendations yet</p>
          <p className="text-xs text-slate-500">Add interests to your profile to get personalized suggestions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec, idx) => (
            <div
              key={rec.id}
              className="card cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => {
                if (tab === 'events') navigate(`/events/${rec.id}`);
                else navigate(`/people/${rec.id}`);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-100 text-sm">
                    {rec.title || rec.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
