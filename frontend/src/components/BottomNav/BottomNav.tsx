import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, User, Bell, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const allNavItems = [
  { to: '/agenda', icon: Calendar, label: 'Agenda', guestAllowed: true },
  { to: '/schedule', icon: Clock, label: 'My Day', guestAllowed: false },
  { to: '/people', icon: Users, label: 'People', guestAllowed: false },
  { to: '/notifications', icon: Bell, label: 'Feed', guestAllowed: false },
  { to: '/profile', icon: User, label: 'Profile', guestAllowed: false },
];

const guestNavItems = [
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/login', icon: LogIn, label: 'Sign In' },
];

export default function BottomNav() {
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const items = isGuest ? guestNavItems : allNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 border-t border-slate-700 backdrop-blur-md z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map(({ to, icon: Icon, label }) => {
          if (isGuest && to === '/login') {
            return (
              <button
                key={to}
                onClick={() => navigate('/login')}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Icon size={22} strokeWidth={1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
