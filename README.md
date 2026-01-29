# ConnectionPro

A full-stack professional network management application for maintaining meaningful relationships with your professional connections. Track contacts, log interactions, set follow-up reminders, and enrich profiles directly from LinkedIn.

## Features

- **Contact Management** -- Store and organize professional connections with detailed profiles (role, company, industry, location, goals, tags)
- **Interaction Logging** -- Track interaction history with notes and tags for each connection
- **Smart Reminders** -- Set follow-up cadences (monthly, quarterly, custom intervals) and get notified when contacts are overdue
- **LinkedIn Enrichment** -- Auto-enrich contact profiles by scraping LinkedIn data via background tasks
- **CSV Import** -- Bulk import connections from LinkedIn data exports
- **Chrome Extension** -- One-click extraction of LinkedIn profile data directly into the app
- **Passwordless Auth** -- Magic link email authentication (no passwords to remember)
- **Offline City Autocomplete** -- City suggestions while typing (no API key required)

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React SPA  │────>│  FastAPI      │────>│  PostgreSQL  │
│   (Vite)     │     │  Server       │     │              │
│   :5173      │     │  :8000        │     │  :5433       │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
┌──────────────┐     ┌──────┴───────┐     ┌──────────────┐
│   Chrome     │     │  Celery       │────>│  Redis       │
│   Extension  │     │  Worker       │     │  :6379       │
└──────────────┘     └──────────────┘     └──────────────┘
```

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, React Router 7, Vite 7 |
| Backend | Python, FastAPI, SQLModel (SQLAlchemy + Pydantic) |
| Database | PostgreSQL 15 |
| Task Queue | Celery + Redis 7 |
| Auth | JWT (PyJWT), magic link tokens |
| Scraping | BeautifulSoup4, Requests |
| Extension | Chrome Manifest V3 |
| Infrastructure | Docker, Docker Compose |

## Project Structure

```
ConnectionPro/
├── client/                     # React frontend
│   ├── src/
│   │   ├── App.jsx             # Root component, routing, auth provider
│   │   ├── main.jsx            # React DOM entry point
│   │   ├── index.css           # Global styles (dark theme)
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.jsx       # Stats, reminders, recent activity
│   │   │   ├── ConnectionList.jsx  # All connections table/grid
│   │   │   ├── ConnectionDetail.jsx# Full profile + interaction history
│   │   │   ├── NewConnection.jsx   # Create connection form + enrichment
│   │   │   ├── EditConnection.jsx  # Update existing connection
│   │   │   ├── ImportData.jsx      # CSV import from LinkedIn exports
│   │   │   ├── Register.jsx        # Email + name registration
│   │   │   ├── VerifyAuth.jsx      # Magic link token verification
│   │   │   └── Settings.jsx        # User preferences
│   │   ├── components/
│   │   │   ├── layout/Layout.jsx       # Main layout with navigation
│   │   │   └── dashboard/
│   │   │       ├── SmartReminders.jsx  # Overdue contacts widget
│   │   │       └── StatCard.jsx        # Dashboard stat card
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Auth state, token management
│   │   │   └── DataContext.jsx     # Connections + logs state
│   │   ├── services/
│   │   │   └── api.js             # HTTP client for all API calls
│   │   └── utils/
│   │       └── reminders.js       # Reminder calculation utilities
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── server/                     # FastAPI backend
│   ├── main.py                 # All API endpoints
│   ├── models.py               # SQLModel database models
│   ├── database.py             # DB connection setup
│   ├── auth_utils.py           # JWT + magic link utilities
│   ├── worker.py               # Celery tasks (LinkedIn scraping)
│   ├── requirements.txt        # Python dependencies
│   ├── start.sh                # Entrypoint: migrations + server
│   ├── alembic.ini             # Migration config
│   ├── migrations/             # Alembic migration files
│   └── Dockerfile
├── extension/                  # Chrome extension
│   ├── manifest.json           # Manifest V3 config
│   ├── popup.html              # Extension popup UI
│   └── popup.js                # Profile extraction logic
└── docker-compose.yml          # Multi-service orchestration
```

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- (Optional) Node.js 20+ and Python 3.11+ for local development without Docker

### Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd ConnectionPro

# Start all services
docker compose up --build
```

This starts five services:

| Service | URL | Description |
|---------|-----|-------------|
| **client** | http://localhost:5173 | React frontend |
| **server** | http://localhost:8000 | FastAPI backend |
| **db** | localhost:5433 | PostgreSQL database |
| **redis** | localhost:6379 | Celery message broker |
| **worker** | -- | Celery background worker |

Open http://localhost:5173 in your browser to use the app.

Notes:
- The `client` container runs `npm ci` on startup to ensure `node_modules` matches `package-lock.json` even when using a persisted Docker volume.

### Local Development (without Docker)

#### Backend

```bash
cd server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/connectionpro
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=your-secret-key

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

In a separate terminal, start the Celery worker:

```bash
cd server
source venv/bin/activate
celery -A worker.celery_app worker --loglevel=info
```

#### Frontend

```bash
cd client

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked** and select the `extension/` directory
4. Navigate to any LinkedIn profile and click the extension icon to extract profile data

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///database.db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis broker URL |
| `SECRET_KEY` | `super-secret-key-change-it-in-prod` | JWT signing secret |
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL (frontend) |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register or trigger magic link |
| `GET` | `/auth/check-email?email=` | Check if email exists |
| `POST` | `/auth/verify?token=` | Verify magic link, returns JWT |
| `GET` | `/auth/me` | Get current user (auth required) |

### Connections (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/connections` | Create a connection |
| `GET` | `/connections` | List all connections |
| `GET` | `/connections/{id}` | Get a single connection |
| `PUT` | `/connections/{id}` | Update a connection |
| `DELETE` | `/connections/{id}` | Delete a connection |

### Interaction Logs (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/logs` | Create an interaction log |
| `GET` | `/logs` | List all logs |
| `DELETE` | `/logs/{id}` | Delete a log |

### LinkedIn Enrichment

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/enrich?linkedin_url=` | Start async enrichment task |
| `GET` | `/tasks/{task_id}` | Poll task status |

## Data Models

### User

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | string | Unique, indexed |
| `name` | string | Display name |
| `is_active` | boolean | Account status |
| `created_at` | datetime | Creation timestamp |

### Connection

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to User |
| `name` | string | Contact name |
| `role` | string | Job title |
| `company` | string | Organization |
| `location` | string | Geographic location |
| `industry` | string | Professional industry |
| `howMet` | string | How you met |
| `frequency` | int | Follow-up cadence in days (default: 90) |
| `lastContact` | datetime | Last interaction date |
| `notes` | string | Free-text notes |
| `linkedin` | string | LinkedIn profile URL |
| `email` | string | Contact email |
| `goals` | string | Relationship goals |
| `tags` | string[] | Categorization tags (stored as JSON) |

### Log

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to User |
| `connection_id` | UUID | Foreign key to Connection (optional) |
| `type` | string | Log type (default: "interaction") |
| `notes` | string | Interaction notes |
| `tags` | string[] | Tags (stored as JSON) |
| `created_at` | datetime | Creation timestamp |

## Authentication Flow

1. User enters email on the registration page
2. Server generates a magic link token (15-minute expiration)
3. In demo mode, the magic link is displayed on screen (production would send email)
4. User clicks the link, which navigates to `/verify?token=...`
5. Server verifies the token and returns a JWT access token (7-day expiration)
6. The JWT is stored in `localStorage` and sent as a `Bearer` token on all subsequent API requests

## Key Workflows

### LinkedIn Enrichment

1. User provides a LinkedIn URL when creating/editing a connection
2. Frontend sends `POST /enrich?linkedin_url=...` to the backend
3. Backend dispatches a Celery task that scrapes the LinkedIn profile (JSON-LD, Open Graph tags, or URL slug fallback)
4. Frontend polls `GET /tasks/{task_id}` every second (up to 15 attempts)
5. Once complete, the enriched data (name, role, company, location, industry) auto-fills the form

### Chrome Extension Flow

1. Navigate to a LinkedIn profile page
2. Click the ConnectionPro extension icon
3. Click "Extract Profile Data" -- extracts name, role, company, location from the page
4. Click "Send to ConnectionPro" -- opens a new tab at `localhost:5173/connections/new` with the data as URL parameters
5. The New Connection form auto-fills with the extracted data

### New Connection Form

- The New Connection page uses **always-visible sections** (no expand/collapse “Add more details” toggle).
- The **City** field includes **offline autocomplete** backed by a local dataset (see `client/src/pages/NewConnection.jsx`).

### CSV Import

1. Export your connections from LinkedIn as a CSV file
2. Navigate to the Import page in ConnectionPro
3. Upload the CSV -- the app parses it with PapaParse and shows a preview
4. Confirm to bulk-create connections from the imported data

## Scripts

### Frontend (`client/`)

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

### Backend (`server/`)

```bash
# API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Celery worker
celery -A worker.celery_app worker --loglevel=info

# Database migrations
alembic upgrade head          # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
```
