import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessions as sessionsApi, schedule as scheduleApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Session } from '../types';
import { ArrowLeft, Clock, MapPin, User, Tag, Bookmark, BookmarkCheck, Loader2, LogIn, UserPlus, UserMinus } from 'lucide-react';

const categoryColors: Record<string, string> = {
  presentation: 'bg-primary-100 text-primary-700',
  workshop: 'bg-purple-100 text-purple-700',
  discussion: 'bg-amber-100 text-amber-700',
  networking: 'bg-green-100 text-green-700',
  consultation: 'bg-cyan-100 text-cyan-700',
  social: 'bg-rose-100 text-rose-700',
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarking, setBookmarking] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!id) return;
    sessionsApi.detail(Number(id)).then(setSession).finally(() => setLoading(false));
  }, [id]);

  const handleToggleBookmark = async () => {
    if (!session) return;
    setBookmarking(true);
    try {
      if (session.isBookmarked) {
        await scheduleApi.unbookmark(session.id);
      } else {
        await scheduleApi.bookmark(session.id);
      }
      setSession({ ...session, isBookmarked: !session.isBookmarked });
    } catch (err) {
      console.error(err);
    } finally {
      setBookmarking(false);
    }
  };

  const handleToggleRegister = async () => {
    if (!session) return;
    setRegistering(true);
    try {
      if (session.isRegistered) {
        await sessionsApi.unregister(session.id);
      } else {
        await sessionsApi.register(session.id);
      }
      setSession({ ...session, isRegistered: !session.isRegistered });
    } catch (err) {
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!session) {
    return <div className="page-container text-center text-slate-500 py-20">Session not found</div>;
  }

  const colorClass = categoryColors[session.category] || 'bg-slate-700 text-slate-300';

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className={`badge ${colorClass}`}>{session.category}</span>
        {session.isOptional && (
          <span className="badge bg-amber-50 text-amber-600">Optional Activity</span>
        )}
      </div>

      <h1 className="text-2xl font-bold text-slate-100 mb-2">{session.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
        <span className="flex items-center gap-1.5">
          <Clock size={16} />
          {formatTime(session.startsAt)} – {formatTime(session.endsAt)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={16} />
          {session.location}
        </span>
        {session.speaker && (
          <span className="flex items-center gap-1.5">
            <User size={16} />
            {session.speaker}
          </span>
        )}
      </div>

      <div className="card mb-4">
        <p className="text-slate-300 leading-relaxed">{session.description}</p>
      </div>

      {session.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
            <Tag size={14} />
            <span>Tags</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.tags.map((tag) => (
              <span key={tag} className="badge bg-slate-700 text-slate-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {isGuest ? (
        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium btn-secondary"
        >
          <LogIn size={18} />
          Sign in to interact
        </button>
      ) : (
        <div className="space-y-2">
          {session.isOptional && (
            <button
              onClick={handleToggleRegister}
              disabled={registering}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                session.isRegistered
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {registering ? (
                <Loader2 size={18} className="animate-spin" />
              ) : session.isRegistered ? (
                <UserMinus size={18} />
              ) : (
                <UserPlus size={18} />
              )}
              {session.isRegistered ? 'Leave this activity' : 'Join this activity'}
            </button>
          )}
          {!session.isOptional && (
            <button
              onClick={handleToggleBookmark}
              disabled={bookmarking}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                session.isBookmarked
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'btn-primary'
              }`}
            >
              {bookmarking ? (
                <Loader2 size={18} className="animate-spin" />
              ) : session.isBookmarked ? (
                <BookmarkCheck size={18} />
              ) : (
                <Bookmark size={18} />
              )}
              {session.isBookmarked ? 'Remove from My Schedule' : 'Add to My Schedule'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
