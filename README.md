# Community Day Companion

PWA event companion app for the Fiscal Solutions Community Day conference.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Symfony 7 (PHP 8.2) with DDD architecture
- **Database**: PostgreSQL 15
- **Auth**: JWT (lexik/jwt-authentication-bundle)
- **Containerization**: Docker Compose

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Backend (Docker)

```bash
# Build and start everything
make init

# Or step by step:
make build
make up
make jwt-keys
make migrate
make seed
```

Backend API runs at: http://localhost:8000

**Mailpit** (email testing): http://localhost:8025 – svi poslati emailovi se hvataju ovde umesto slanja.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

### Demo Credentials

- **Email**: marko@example.com
- **Password**: community2026
- **Admin**: admin@community.day / community2026

## Import Users from CSV

```bash
make import-users file=/path/to/users.csv
```

CSV format: `email,firstName,lastName,company,position,country,interests,bio,phone,linkedin,password,role`

Interests should be separated by semicolons.

## Project Structure

### Backend (DDD Architecture)

```
backend/src/
├── Model/          # Domain entities & value objects
├── Application/    # Use cases (currently in controllers for hackathon speed)
└── Adapter/        # Infrastructure
    ├── In/Http/    # Controllers (REST API)
    ├── Out/        # Persistence (Doctrine), AI (OpenAI)
    └── Security/   # JWT Authentication
```

### Frontend

```
frontend/src/
├── components/     # Reusable UI components
├── pages/          # Route pages
├── context/        # React context (Auth)
├── services/       # API client
└── types/          # TypeScript interfaces
```

## Features

1. **Agenda** - Browse all sessions with category filters and search
2. **My Schedule** - Bookmark sessions to build a personal schedule
3. **People** - Browse attendees, find people with similar interests
4. **Networking** - Send/accept connection requests
5. **AI Recommendations** - AI-powered session and people suggestions
6. **Live Feed** - Real-time notifications from organizers
7. **PWA** - Installable on mobile devices

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | JWT login |
| GET | /api/auth/me | Current user |
| GET | /api/sessions | List sessions |
| GET | /api/sessions/:id | Session detail |
| POST | /api/schedule/bookmark | Bookmark session |
| DELETE | /api/schedule/bookmark/:id | Remove bookmark |
| GET | /api/schedule/my | My schedule |
| GET | /api/users | List attendees |
| GET | /api/users/similar | Similar people |
| GET | /api/users/:id | User profile |
| POST | /api/connections/request | Send connection request |
| PUT | /api/connections/:id/accept | Accept connection |
| GET | /api/connections/my | My connections |
| GET | /api/notifications | Live feed |
| GET | /api/ai/recommend-events | AI event recommendations (For You) |
| GET | /api/ai/recommend-people | AI people recommendations |
| GET | /api/events | List events |
| GET | /api/events/:id | Event detail with sessions |
| POST | /api/events/:id/register | Register for event |
| GET | /api/admin/catering-plan | AI catering menu (admin) |

## AI Features

### API Keys

- **Groq** (prioritet): `GROQ_API_KEY` in `backend/.env` – brzi AI (llama-3.1-8b-instant)
- **OpenAI**: `OPENAI_API_KEY` in `backend/.env`
- Ako nijedan nije postavljen, AI koristi tag-based fallback

### Catering Menu (Admin)

- **Endpoint**: `GET /api/admin/catering-plan`
- **Flow**: AdminController → OpenAiAdapter::recommendCateringMenu()
- **Input**: Dietary preferences and allergies from registered users
- **With API key**: Calls OpenAI gpt-3.5-turbo to generate buffet stations and dishes
- **Without API key**: Returns hardcoded fallback menu (stations for main dishes, vegetarian, halal/kosher, salads, desserts)

### Event Recommendations (For You)

- **Endpoint**: `GET /api/ai/recommend-events`
- **Flow**: AiController → OpenAiAdapter::recommendEvents()
- **Input**: User profile (interests, position, company) + events with tags (derived from session tags)
- **With API key**: OpenAI suggests top 5 events
- **Without API key**: Tag-based matching (user interests vs event tags)
