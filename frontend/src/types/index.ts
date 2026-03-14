export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  company: string | null;
  position: string | null;
  country: string | null;
  interests: string[];
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  linkedin: string | null;
  dietaryPreference: string | null;
  allergies: string[];
  dietaryNotes: string | null;
  language: string | null;
  roles: string[];
}

export interface Session {
  id: number;
  title: string;
  description: string;
  speaker: string;
  speakerBio: string | null;
  location: string;
  category: string;
  startsAt: string;
  endsAt: string;
  tags: string[];
  capacity: number | null;
  isBookmarked: boolean;
  isOptional: boolean;
  isRegistered: boolean;
  eventId: number | null;
}

export interface EventData {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  status: string;
  isRegistered: boolean;
  attendeeCount: number;
  tags?: string[];
  sessions?: Session[];
}

export interface ConnectionRequest {
  id: number;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: string;
  createdAt: string;
}

export interface AiRecommendation {
  id: number;
  title?: string;
  fullName?: string;
  reason: string;
}

/** Legacy: used when schedule was session-based */
export interface ScheduleEntry {
  id: number;
  session: Session;
  createdAt: string;
}

/** Event in schedule (from EventRegistration) with its program */
export interface ScheduleEvent {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  status: string;
  sessions: (Session & { isRegistered?: boolean })[];
}

export interface AttendeesStats {
  total: number;
  dietaryBreakdown: Record<string, number>;
  allergyBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
}

export interface EventAttendee {
  user: User;
  registrationId: number;
  attended: boolean | null;
}

export interface CateringDish {
  name: string;
  tags: string[];
}

export interface CateringStation {
  station: string;
  description: string;
  dishes: CateringDish[];
}

export interface CateringPlan {
  totalAttendees: number;
  dietaryStats: Record<string, number>;
  allergyStats: Record<string, number>;
  menu: CateringStation[];
}
