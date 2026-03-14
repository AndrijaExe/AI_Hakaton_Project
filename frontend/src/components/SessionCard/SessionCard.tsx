import { Clock, MapPin, Bookmark, BookmarkCheck, UserPlus, UserMinus } from 'lucide-react';
import type { Session } from '../../types';
import { useNavigate } from 'react-router-dom';

interface Props {
  session: Session;
  onToggleBookmark?: (id: number, bookmarked: boolean) => void;
  onToggleCheckIn?: (id: number, isCheckedIn: boolean) => void;
  isGuest?: boolean;
  /** When true, card is not clickable (mandatory sessions) */
  nonClickable?: boolean;
  /** When true, hide bookmark button */
  hideBookmark?: boolean;
}

const categoryColors: Record<string, string> = {
  presentation: 'bg-primary-900/50 text-primary-300',
  workshop: 'bg-purple-900/50 text-purple-300',
  discussion: 'bg-amber-900/50 text-amber-300',
  networking: 'bg-green-900/50 text-green-300',
  consultation: 'bg-cyan-900/50 text-cyan-300',
  social: 'bg-rose-900/50 text-rose-300',
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function SessionCard({ session, onToggleBookmark, onToggleCheckIn, nonClickable, hideBookmark }: Props) {
  const navigate = useNavigate();
  const colorClass = categoryColors[session.category] || 'bg-slate-700 text-slate-300';
  const clickable = !nonClickable;

  return (
    <div
      className={`card ${clickable ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
      onClick={clickable ? () => navigate(`/sessions/${session.id}`) : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`badge ${colorClass}`}>
              {session.category}
            </span>
          </div>
          <h3 className="font-semibold text-slate-100 leading-tight mb-1">
            {session.title}
          </h3>
          {session.speaker && (
            <p className="text-sm text-slate-400 mb-2">{session.speaker}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {formatTime(session.startsAt)} – {formatTime(session.endsAt)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {session.location}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {onToggleCheckIn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCheckIn(session.id, session.isRegistered);
              }}
              className={`p-2 -mr-1 rounded-full transition-colors ${
                session.isRegistered
                  ? 'bg-green-900/50 hover:bg-green-800/50'
                  : 'hover:bg-slate-700'
              }`}
              title={session.isRegistered ? 'Check out' : 'Check in'}
            >
              {session.isRegistered ? (
                <UserMinus size={20} className="text-green-400" />
              ) : (
                <UserPlus size={20} className="text-slate-500" />
              )}
            </button>
          )}
          {!hideBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark?.(session.id, session.isBookmarked);
              }}
              className="p-2 -mr-1 rounded-full hover:bg-slate-700 transition-colors"
            >
              {session.isBookmarked ? (
                <BookmarkCheck size={22} className="text-primary-600" />
              ) : (
                <Bookmark size={22} className="text-slate-500" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
