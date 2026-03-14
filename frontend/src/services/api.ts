import axios from 'axios';
import type { Session, User, ConnectionRequest, Notification, AiRecommendation, ScheduleEvent, AttendeesStats, CateringPlan, EventData, EventAttendee } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<{ token: string }>('/auth/login', { email, password });
    return data;
  },
  me: async () => {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },
};

export const events = {
  list: async () => {
    const { data } = await api.get<{ events: EventData[] }>('/events');
    return data.events;
  },
  recommended: async () => {
    const { data } = await api.get<{ recommendations: AiRecommendation[] }>('/events/recommended');
    return data.recommendations;
  },
  detail: async (id: number) => {
    const { data } = await api.get<{ event: EventData }>(`/events/${id}`);
    return data.event;
  },
  notifications: async (id: number) => {
    const { data } = await api.get<{
      event: EventData;
      beforeEvent: Notification[];
      duringEvent: Notification[];
      afterEvent: Notification[];
    }>(`/events/${id}/notifications`);
    return data;
  },
  register: async (id: number) => {
    await api.post(`/events/${id}/register`);
  },
  unregister: async (id: number) => {
    await api.delete(`/events/${id}/unregister`);
  },
};

export const sessions = {
  list: async (category?: string) => {
    const params = category ? { category } : {};
    const { data } = await api.get<{ sessions: Session[] }>('/sessions', { params });
    return data.sessions;
  },
  detail: async (id: number) => {
    const { data } = await api.get<{ session: Session }>(`/sessions/${id}`);
    return data.session;
  },
  register: async (id: number) => {
    await api.post(`/sessions/${id}/register`);
  },
  unregister: async (id: number) => {
    await api.delete(`/sessions/${id}/register`);
  },
};

export const schedule = {
  my: async () => {
    const { data } = await api.get<{ schedule: ScheduleEvent[] }>('/schedule/my');
    return data.schedule;
  },
  bookmark: async (sessionId: number) => {
    await api.post('/schedule/bookmark', { sessionId });
  },
  unbookmark: async (sessionId: number) => {
    await api.delete(`/schedule/bookmark/${sessionId}`);
  },
};

export const users = {
  list: async (q?: string) => {
    const params = q ? { q } : {};
    const { data } = await api.get<{ users: User[] }>('/users', { params });
    return data.users;
  },
  detail: async (id: number) => {
    const { data } = await api.get<{ user: User }>(`/users/${id}`);
    return data.user;
  },
  similar: async () => {
    const { data } = await api.get<{ users: (User & { commonInterests: string[] })[] }>('/users/similar');
    return data.users;
  },
  updateProfile: async (profileData: Partial<User>) => {
    const { data } = await api.put<{ user: User }>('/users/profile', profileData);
    return data.user;
  },
};

export const connections = {
  my: async () => {
    const { data } = await api.get<{ connections: ConnectionRequest[] }>('/connections/my');
    return data.connections;
  },
  pending: async () => {
    const { data } = await api.get<{ pending: ConnectionRequest[] }>('/connections/pending');
    return data.pending;
  },
  all: async () => {
    const { data } = await api.get<{ connections: ConnectionRequest[] }>('/connections/all');
    return data.connections;
  },
  send: async (receiverId: number, message?: string) => {
    const { data } = await api.post<{ connection: ConnectionRequest }>('/connections/request', { receiverId, message });
    return data.connection;
  },
  accept: async (id: number) => {
    const { data } = await api.put<{ connection: ConnectionRequest }>(`/connections/${id}/accept`);
    return data.connection;
  },
  decline: async (id: number) => {
    await api.put(`/connections/${id}/decline`);
  },
};

export const notifications = {
  list: async () => {
    const { data } = await api.get<{ notifications: Notification[] }>('/notifications');
    return data.notifications;
  },
};

export const ai = {
  recommendEvents: async () => {
    const { data } = await api.get<{ recommendations: AiRecommendation[] }>('/ai/recommend-events');
    return data.recommendations;
  },
  recommendSessions: async () => {
    const { data } = await api.get<{ recommendations: AiRecommendation[] }>('/ai/recommend-sessions');
    return data.recommendations;
  },
  recommendPeople: async () => {
    const { data } = await api.get<{ recommendations: AiRecommendation[] }>('/ai/recommend-people');
    return data.recommendations;
  },
};

export const admin = {
  attendeesStats: async (eventId?: number) => {
    const params = eventId ? { eventId } : {};
    const { data } = await api.get<AttendeesStats>('/admin/attendees-stats', { params });
    return data;
  },
  eventAttendees: async (eventId: number) => {
    const { data } = await api.get<{ attendees: EventAttendee[] }>(`/admin/events/${eventId}/attendees`);
    return data.attendees;
  },
  setAttendance: async (eventId: number, userId: number, attended: boolean | null) => {
    const { data } = await api.put<{ attended: boolean | null }>(
      `/admin/events/${eventId}/attendees/${userId}/attendance`,
      { attended }
    );
    return data.attended;
  },
  eventSessions: async (eventId: number) => {
    const { data } = await api.get<{ sessions: Session[] }>(`/admin/events/${eventId}/sessions`);
    return data.sessions;
  },
  createEvent: async (eventData: Partial<EventData>) => {
    const { data } = await api.post<{ event: EventData }>('/admin/events', eventData);
    return data.event;
  },
  updateEvent: async (id: number, eventData: Partial<EventData>) => {
    const { data } = await api.put<{ event: EventData }>(`/admin/events/${id}`, eventData);
    return data.event;
  },
  deleteEvent: async (id: number) => {
    await api.delete(`/admin/events/${id}`);
  },
  cateringPlan: async (eventId?: number) => {
    const params = eventId ? { eventId } : {};
    const { data } = await api.get<CateringPlan>('/admin/catering-plan', { params });
    return data;
  },
  createSession: async (sessionData: Partial<Session> & { eventId?: number }) => {
    const { data } = await api.post<{ session: Session }>('/sessions', sessionData);
    return data.session;
  },
  updateSession: async (id: number, sessionData: Partial<Session>) => {
    const { data } = await api.put<{ session: Session }>(`/sessions/${id}`, sessionData);
    return data.session;
  },
  deleteSession: async (id: number) => {
    await api.delete(`/sessions/${id}`);
  },
  sendEventNotification: async (eventId: number, payload: { title?: string; message: string; type?: string }) => {
    const { data } = await api.post<{ message: string; recipientCount: number }>(
      `/admin/events/${eventId}/send-notification`,
      payload
    );
    return data;
  },
  sendEventEmail: async (
    eventId: number,
    payload: { subject?: string; message?: string; attachPdf?: boolean; busInfoSentence?: string; sendNotification?: boolean }
  ) => {
    const { data } = await api.post<{ message: string; recipientCount: number }>(
      `/admin/events/${eventId}/send-email`,
      payload
    );
    return data;
  },
  generatePdf: async (busInfoSentence: string): Promise<Blob> => {
    try {
      const res = await api.post<Blob>(
        '/admin/pdf/generate',
        { busInfoSentence },
        { responseType: 'blob' }
      );
      return res.data;
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: Blob } };
      if (axErr.response?.data instanceof Blob) {
        const text = await axErr.response.data.text();
        const parsed = JSON.parse(text) as { error?: string };
        throw new Error(parsed.error || 'PDF generation failed');
      }
      throw err;
    }
  },
};

export default api;
