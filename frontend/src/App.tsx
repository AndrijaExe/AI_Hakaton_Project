import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import AgendaPage from './pages/AgendaPage';
import SessionDetailPage from './pages/SessionDetailPage';
import MySchedulePage from './pages/MySchedulePage';
import PeoplePage from './pages/PeoplePage';
import PersonDetailPage from './pages/PersonDetailPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import AiRecommendationsPage from './pages/AiRecommendationsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventUpdatesPage from './pages/EventUpdatesPage';
import AdminSessionsPage from './pages/AdminSessionsPage';
import AdminAttendeesPage from './pages/AdminAttendeesPage';
import AdminCateringPage from './pages/AdminCateringPage';
import AdminCommunicationsPage from './pages/AdminCommunicationsPage';
import AdminSendNotificationsPage from './pages/AdminSendNotificationsPage';
import AdminEventsPage from './pages/AdminEventsPage';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestOrAuthRoute({ children }: { children: ReactNode }) {
  const { token, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/agenda" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { token, isGuest } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/agenda" replace /> : <LoginPage />} />

      {/* Guest-accessible routes (agenda + session detail, read-only) */}
      <Route
        element={
          <GuestOrAuthRoute>
            <Layout />
          </GuestOrAuthRoute>
        }
      >
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/events/:id/updates" element={<EventUpdatesPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />
      </Route>

      {/* Auth-only routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/schedule" element={<MySchedulePage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/people/:id" element={<PersonDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/ai" element={<AiRecommendationsPage />} />
        <Route path="/admin/sessions" element={<AdminRoute><AdminSessionsPage /></AdminRoute>} />
        <Route path="/admin/attendees" element={<AdminRoute><AdminAttendeesPage /></AdminRoute>} />
        <Route path="/admin/catering" element={<AdminRoute><AdminCateringPage /></AdminRoute>} />
        <Route path="/admin/communications" element={<AdminRoute><AdminCommunicationsPage /></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><AdminSendNotificationsPage /></AdminRoute>} />
        <Route path="/admin/events" element={<AdminRoute><AdminEventsPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
