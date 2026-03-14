import { useState, useEffect } from 'react';
import { admin as adminApi, events as eventsApi } from '../services/api';
import type { CateringPlan, EventData } from '../types';
import { ArrowLeft, ChefHat, Sparkles, Loader2, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const tagColors: Record<string, string> = {
  vegan: 'bg-emerald-100 text-emerald-700',
  vegetarian: 'bg-green-100 text-green-700',
  halal: 'bg-blue-100 text-blue-700',
  kosher: 'bg-purple-100 text-purple-700',
  'gluten-free': 'bg-amber-100 text-amber-700',
  'nut-free': 'bg-orange-100 text-orange-700',
  'lactose-free': 'bg-cyan-100 text-cyan-700',
};

export default function AdminCateringPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [plan, setPlan] = useState<CateringPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    eventsApi.list().then(setEvents).catch(console.error);
  }, []);

  const handleGenerate = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const data = await adminApi.cateringPlan(selectedEventId);
      setPlan(data);
      setGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} /><span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
          <ChefHat size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">AI Catering Planner</h1>
          <p className="text-xs text-slate-500">Generate menu based on attendee dietary needs</p>
        </div>
      </div>

      {!generated && (
        <div className="text-center py-8">
          <div className="card mb-4 text-left max-w-md mx-auto">
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
          <UtensilsCrossed size={48} className="text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">
            AI will analyze attendees' dietary preferences and allergies for the selected event to suggest an optimal buffet menu.
          </p>
          <button onClick={handleGenerate} disabled={loading || !selectedEventId} className="btn-accent flex items-center justify-center gap-2 mx-auto">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Analyzing dietary data...' : 'Generate Catering Plan'}
          </button>
        </div>
      )}

      {plan && (
        <>
          <div className="grid grid-cols-3 gap-2 my-4">
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-primary-600">{plan.totalAttendees}</p>
              <p className="text-[10px] text-slate-500">Guests</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-emerald-600">{Object.keys(plan.dietaryStats).length}</p>
              <p className="text-[10px] text-slate-500">Diet Types</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-lg font-bold text-accent-600">{plan.menu.length}</p>
              <p className="text-[10px] text-slate-500">Stations</p>
            </div>
          </div>

          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Dietary Summary</h3>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(plan.dietaryStats).map(([pref, count]) => (
                <span key={pref} className="badge bg-slate-700 text-slate-300">{pref}: {count}</span>
              ))}
            </div>
            {Object.keys(plan.allergyStats).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(plan.allergyStats).map(([allergy, count]) => (
                  <span key={allergy} className="badge bg-red-50 text-red-600">{allergy}: {count}</span>
                ))}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-100 mb-3">Menu Stations</h2>
          <div className="space-y-3">
            {plan.menu.map((station, idx) => (
              <div key={idx} className="card border-l-4 border-l-accent-400">
                <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
                  <UtensilsCrossed size={15} className="text-accent-500" />
                  {station.station}
                </h3>
                <p className="text-xs text-slate-500 mb-2">{station.description}</p>
                <div className="space-y-2">
                  {station.dishes.map((dish, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-2">
                      <span className="text-sm text-slate-200 flex-1">{dish.name}</span>
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {dish.tags.map(tag => (
                          <span key={tag} className={`badge text-[9px] ${tagColors[tag] || 'bg-slate-700 text-slate-300'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleGenerate} disabled={loading} className="btn-secondary w-full mt-4 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Regenerate Menu
          </button>
        </>
      )}
    </div>
  );
}
