import { Building2, MapPin, Briefcase } from 'lucide-react';
import type { User } from '../../types';
import { useNavigate } from 'react-router-dom';

interface Props {
  user: User;
  commonInterests?: string[];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  'bg-primary-500', 'bg-accent-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500',
];

export default function PersonCard({ user, commonInterests }: Props) {
  const navigate = useNavigate();
  const colorIdx = (user.id ?? 0) % avatarColors.length;

  return (
    <div
      className="card cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/people/${user.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full ${avatarColors[colorIdx]} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
          {getInitials(user.fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 truncate">{user.fullName}</h3>
          <div className="flex items-center gap-1 text-sm text-slate-400">
            {user.position && (
              <span className="flex items-center gap-1 truncate">
                <Briefcase size={12} />
                {user.position}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
            {user.company && (
              <span className="flex items-center gap-1">
                <Building2 size={11} />
                {user.company}
              </span>
            )}
            {user.country && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {user.country}
              </span>
            )}
          </div>
        </div>
      </div>
      {commonInterests && commonInterests.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {commonInterests.map((interest) => (
            <span key={interest} className="badge bg-primary-900/50 text-primary-300">
              {interest}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
