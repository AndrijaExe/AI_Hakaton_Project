import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { connections as connectionsApi } from '../services/api';
import type { ConnectionRequest } from '../types';
import { useNavigate } from 'react-router-dom';
import { LogOut, Building2, MapPin, Briefcase, Mail, UserPlus, Check, X, Loader2, Pencil, Shield, Calendar, Users, ChefHat, Leaf, Send, Bell } from 'lucide-react';

const avatarColors = [
  'bg-primary-500', 'bg-accent-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500',
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfilePage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [myConnections, setMyConnections] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pending, conns] = await Promise.all([
          connectionsApi.pending(),
          connectionsApi.my(),
        ]);
        setPendingRequests(pending);
        setMyConnections(conns);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAccept = async (id: number) => {
    try {
      const updated = await connectionsApi.accept(id);
      setPendingRequests(prev => prev.filter(p => p.id !== id));
      setMyConnections(prev => [updated, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (id: number) => {
    try {
      await connectionsApi.decline(id);
      setPendingRequests(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  const colorIdx = (user.id ?? 0) % avatarColors.length;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Profile</h1>
        <button onClick={logout} className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${avatarColors[colorIdx]} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
            {getInitials(user.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-100">{user.fullName}</h2>
            <p className="text-sm text-slate-400 flex items-center gap-1">
              <Briefcase size={13} /> {user.position}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              {user.company && (
                <span className="flex items-center gap-1"><Building2 size={11} /> {user.company}</span>
              )}
              {user.country && (
                <span className="flex items-center gap-1"><MapPin size={11} /> {user.country}</span>
              )}
            </div>
          </div>
        </div>
        {user.bio && <p className="text-sm text-slate-300 mt-3">{user.bio}</p>}
        <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-2">
          <Mail size={13} /> {user.email}
        </div>
        <button
          onClick={() => navigate('/profile/edit')}
          className="btn-secondary w-full mt-3 flex items-center justify-center gap-1.5 text-sm"
        >
          <Pencil size={15} /> Edit Profile
        </button>
      </div>

      {user.interests.length > 0 && (
        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">My Interests</h3>
          <div className="flex flex-wrap gap-1.5">
            {user.interests.map(i => (
              <span key={i} className="badge bg-primary-900/50 text-primary-300">{i}</span>
            ))}
          </div>
        </div>
      )}

      {(user.dietaryPreference || user.allergies.length > 0) && (
        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
            <Leaf size={14} /> Dietary Info
          </h3>
          {user.dietaryPreference && (
            <p className="text-sm text-slate-300 mb-1">
              Diet: <span className="font-medium">{user.dietaryPreference}</span>
            </p>
          )}
          {user.allergies.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {user.allergies.map(a => (
                <span key={a} className="badge bg-red-50 text-red-600">{a}</span>
              ))}
            </div>
          )}
          {user.dietaryNotes && (
            <p className="text-xs text-slate-500 italic">{user.dietaryNotes}</p>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="card mb-4 border-2 border-amber-200 bg-amber-50/50">
          <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
            <Shield size={15} /> Admin Panel
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/events')}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-700 rounded-xl border border-slate-600 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              <Calendar size={16} className="text-amber-600" /> Manage Events
            </button>
            <button
              onClick={() => navigate('/admin/sessions')}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-700 rounded-xl border border-slate-600 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              <Calendar size={16} className="text-amber-600" /> Manage Sessions
            </button>
            <button
              onClick={() => navigate('/admin/attendees')}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-700 rounded-xl border border-slate-600 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              <Users size={16} className="text-amber-600" /> Attendees Overview
            </button>
            <button
              onClick={() => navigate('/admin/catering')}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-700 rounded-xl border border-slate-600 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              <ChefHat size={16} className="text-amber-600" /> AI Catering Planner
            </button>
            <button
              onClick={() => navigate('/admin/communications')}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-700 rounded-xl border border-slate-600 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              <Send size={16} className="text-amber-600" /> Email & PDF to attendees
            </button>
            <button
              onClick={() => navigate('/admin/notifications')}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-700 rounded-xl border border-slate-600 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              <Bell size={16} className="text-amber-600" /> Send notifications
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-primary-600" size={24} />
        </div>
      ) : (
        <>
          {pendingRequests.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <UserPlus size={15} />
                Pending Requests ({pendingRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-100 text-sm">{req.sender.fullName}</p>
                        <p className="text-xs text-slate-400">{req.sender.company}</p>
                        {req.message && <p className="text-xs text-slate-500 mt-1 italic">"{req.message}"</p>}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleAccept(req.id)} className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100">
                          <Check size={16} />
                        </button>
                        <button onClick={() => handleDecline(req.id)} className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-2">
              My Connections ({myConnections.length})
            </h3>
            {myConnections.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No connections yet</p>
            ) : (
              <div className="space-y-2">
                {myConnections.map(conn => {
                  const other = conn.sender.id === user.id ? conn.receiver : conn.sender;
                  const otherColor = (other.id ?? 0) % avatarColors.length;
                  return (
                    <div key={conn.id} className="card flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${avatarColors[otherColor]} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
                        {getInitials(other.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-100 text-sm truncate">{other.fullName}</p>
                        <p className="text-xs text-slate-400">{other.position} @ {other.company}</p>
                      </div>
                      <a href={`mailto:${other.email}`} className="text-primary-400 hover:text-primary-300">
                        <Mail size={16} />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
