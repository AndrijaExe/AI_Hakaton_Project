import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { users as usersApi, connections as connectionsApi } from '../services/api';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Building2, MapPin, Briefcase, Mail, Phone, Linkedin, Loader2, UserPlus, Check, MessageCircle } from 'lucide-react';

const avatarColors = [
  'bg-primary-500', 'bg-accent-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500',
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [person, setPerson] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectMsg, setConnectMsg] = useState('');
  const [showConnect, setShowConnect] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    usersApi.detail(Number(id)).then(setPerson).finally(() => setLoading(false));
  }, [id]);

  const handleConnect = async () => {
    if (!person) return;
    setSending(true);
    try {
      await connectionsApi.send(person.id, connectMsg || undefined);
      setSent(true);
      setShowConnect(false);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setSent(true);
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!person) {
    return <div className="page-container text-center text-slate-500 py-20">Person not found</div>;
  }

  const colorIdx = (person.id ?? 0) % avatarColors.length;
  const isMe = currentUser?.id === person.id;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-600 mb-4 -ml-1">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="text-center mb-6">
        <div className={`w-20 h-20 rounded-full ${avatarColors[colorIdx]} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3`}>
          {getInitials(person.fullName)}
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{person.fullName}</h1>
        {person.position && (
          <p className="text-slate-500 flex items-center justify-center gap-1 mt-1">
            <Briefcase size={14} /> {person.position}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 text-sm text-slate-500 mt-1">
          {person.company && (
            <span className="flex items-center gap-1"><Building2 size={13} /> {person.company}</span>
          )}
          {person.country && (
            <span className="flex items-center gap-1"><MapPin size={13} /> {person.country}</span>
          )}
        </div>
      </div>

      {person.bio && (
        <div className="card mb-3">
          <p className="text-slate-300 text-sm leading-relaxed">{person.bio}</p>
        </div>
      )}

      {person.interests.length > 0 && (
        <div className="card mb-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Interests</h3>
          <div className="flex flex-wrap gap-1.5">
            {person.interests.map((interest) => (
              <span key={interest} className="badge bg-primary-50 text-primary-600">{interest}</span>
            ))}
          </div>
        </div>
      )}

      {(person.email || person.phone || person.linkedin) && (
        <div className="card mb-3 space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">Contact</h3>
          {person.email && (
            <a href={`mailto:${person.email}`} className="flex items-center gap-2 text-sm text-slate-400">
              <Mail size={15} className="text-slate-500" /> {person.email}
            </a>
          )}
          {person.phone && (
            <a href={`tel:${person.phone}`} className="flex items-center gap-2 text-sm text-slate-400">
              <Phone size={15} className="text-slate-500" /> {person.phone}
            </a>
          )}
          {person.linkedin && (
            <a href={person.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-400">
              <Linkedin size={15} className="text-slate-500" /> LinkedIn Profile
            </a>
          )}
        </div>
      )}

      {!isMe && !sent && (
        <>
          {showConnect ? (
            <div className="card">
              <textarea
                placeholder="Add a message (optional)..."
                value={connectMsg}
                onChange={(e) => setConnectMsg(e.target.value)}
                className="input-field mb-3 h-20 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowConnect(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleConnect} disabled={sending} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Send
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowConnect(true)} className="btn-primary w-full flex items-center justify-center gap-2">
              <MessageCircle size={18} />
              Connect
            </button>
          )}
        </>
      )}

      {sent && (
        <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-600 rounded-xl font-medium">
          <Check size={18} />
          Connection request sent!
        </div>
      )}
    </div>
  );
}
