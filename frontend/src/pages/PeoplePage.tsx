import { useState, useEffect } from 'react';
import { users as usersApi } from '../services/api';
import type { User } from '../types';
import PersonCard from '../components/PersonCard/PersonCard';
import { Search, Users, UserCheck } from 'lucide-react';

type Tab = 'all' | 'similar';

export default function PeoplePage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [similarUsers, setSimilarUsers] = useState<(User & { commonInterests: string[] })[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [all, similar] = await Promise.all([usersApi.list(), usersApi.similar()]);
        setAllUsers(all);
        setSimilarUsers(similar);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (tab !== 'all' || !search) return;
    const timer = setTimeout(async () => {
      try {
        const results = await usersApi.list(search);
        setAllUsers(results);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, tab]);

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-slate-100 mb-4">People</h1>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab('all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-600'
          }`}
        >
          <Users size={16} /> All Users
        </button>
        <button
          onClick={() => setTab('similar')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'similar' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-600'
          }`}
        >
          <UserCheck size={16} /> People You May Know
        </button>
      </div>

      {tab === 'all' && (
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {tab === 'all'
            ? allUsers.map((user) => <PersonCard key={user.id} user={user} />)
            : similarUsers.map((user) => (
                <PersonCard key={user.id} user={user} commonInterests={user.commonInterests} />
              ))}
          {((tab === 'all' && allUsers.length === 0) || (tab === 'similar' && similarUsers.length === 0)) && (
            <p className="text-center text-slate-500 py-8">No people found</p>
          )}
        </div>
      )}
    </div>
  );
}
