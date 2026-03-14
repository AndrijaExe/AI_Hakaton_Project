import { Outlet } from 'react-router-dom';
import BottomNav from '../BottomNav/BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-900">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
