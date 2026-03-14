import { useState, useEffect } from 'react';
import { notifications as notificationsApi } from '../services/api';
import type { Notification } from '../types';
import { Bell, AlertTriangle, Info, Loader2 } from 'lucide-react';

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  alert: AlertTriangle,
};

const priorityColors: Record<string, string> = {
  high: 'border-l-4 border-l-red-400',
  normal: 'border-l-4 border-l-primary-400',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.list()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-100">Live Feed</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const Icon = typeIcons[item.type] || Info;
            const borderColor = priorityColors[item.priority || 'normal'] || priorityColors.normal;
            return (
              <div key={item.id} className={`card ${borderColor}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full ${item.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-primary-50 text-primary-600'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-100 text-sm">{item.title}</h3>
                      <span className="text-xs text-slate-500">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-0.5">{item.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
