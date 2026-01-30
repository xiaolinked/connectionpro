# ConnectionPro

A full-stack professional network management application for maintaining meaningful relationships with your professional connections. Available as a **web app** and a native **iOS app**, both powered by the same backend. Track contacts, log interactions, set follow-up reminders, and enrich profiles directly from LinkedIn.

## Features

### Core (Web + iOS)

- **Contact Management** -- Store and organize professional connections with detailed profiles (role, company, industry, location, goals, tags)
- **Interaction Logging** -- Track interaction history with notes and tags for each connection
- **Smart Reminders** -- Set follow-up cadences (monthly, quarterly, custom intervals) and get notified when contacts are overdue
- **Dashboard** -- At-a-glance stats (total connections, upcoming follow-ups, growth moments), smart reminders, and recent activity
- **Passwordless Auth** -- Magic link email authentication (no passwords to remember)
- **Quick Add** -- Rapidly add a connection with just a name and notes
- **User Settings** -- Edit profile name, view account info, logout

### Web Only

- **LinkedIn Enrichment** -- Auto-enrich contact profiles by scraping LinkedIn data via background tasks
- **CSV Import** -- Bulk import connections from LinkedIn data exports
- **Chrome Extension** -- One-click extraction of LinkedIn profile data directly into the app
- **Offline City Autocomplete** -- City suggestions while typing (no API key required)

### iOS Only

- **Contact Import** -- Import connections from your device's phonebook (single-select to pre-fill or bulk import with multi-select)
- **Deep Link Auth** -- Verify magic link tokens via `connectionpro://verify?token=` URL scheme
- **Keychain Storage** -- JWT tokens stored securely in the iOS Keychain
- **Pull-to-Refresh** -- Refresh dashboard and connection list with native swipe gesture
- **Swipe-to-Delete** -- Delete connections with native iOS swipe action

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React SPA  │────>│              │────>│  PostgreSQL  │
│   (Vite)     │     │   FastAPI    │     │              │
│   :5173      │     │   Server     │     │  :5433       │
└──────────────┘     │   :8000      │     └──────────────┘
                     │              │
┌──────────────┐     │              │     ┌──────────────┐
│   iOS App    │────>│              │     │  Redis       │
│   (SwiftUI)  │     └──────┬───────┘     │  :6379       │
└──────────────┘            │             └──────┬───────┘
                     ┌──────┴───────┐            │
┌──────────────┐     │  Celery       │───────────┘
│   Chrome     │     │  Worker       │
│   Extension  │     └──────────────┘
└──────────────┘
```

| Component | Technology |
|-----------|-----------|
| Web Frontend | React 19, React Router 7, Vite 7 |
| iOS App | SwiftUI, iOS 17+, MVVM, async/await |
| Backend | Python, FastAPI, SQLModel (SQLAlchemy + Pydantic) |
| Database | PostgreSQL 15 |
| Task Queue | Celery + Redis 7 |
| Auth | JWT (PyJWT), magic link tokens, Keychain (iOS) |
| Scraping | BeautifulSoup4, Requests |
| Extension | Chrome Manifest V3 |
| Infrastructure | Docker, Docker Compose |

## Project Structure

```
ConnectionPro/
├── client/                     # React web frontend
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
├── ios/                        # Native iOS app (SwiftUI)
│   ├── ConnectionPro/
│   │   ├── App/
│   │   │   └── ConnectionProApp.swift      # @main entry, deep link handler
│   │   ├── Models/
│   │   │   ├── User.swift                  # UserRead, UserCreate, UserUpdate
│   │   │   ├── Connection.swift            # ConnectionRead, ConnectionCreate, ConnectionUpdate
│   │   │   ├── Log.swift                   # LogRead, LogCreate
│   │   │   ├── AuthResponse.swift          # RegisterResponse, VerifyResponse
│   │   │   ├── ConnectionStatus.swift      # Status enum + reminder logic
│   │   │   └── PhonebookContact.swift      # Device contact model
│   │   ├── Networking/
│   │   │   ├── APIClient.swift             # Async/await HTTP client, JWT injection
│   │   │   ├── APIEndpoints.swift          # Type-safe endpoint definitions
│   │   │   └── APIError.swift              # Typed error enum
│   │   ├── Services/
│   │   │   ├── AuthService.swift           # Auth API calls
│   │   │   ├── ConnectionService.swift     # Connection CRUD
│   │   │   ├── LogService.swift            # Log CRUD
│   │   │   ├── KeychainService.swift       # Secure token storage
│   │   │   └── ContactsService.swift       # Device phonebook access
│   │   ├── ViewModels/
│   │   │   ├── AuthViewModel.swift         # Auth state, register flow, deep links
│   │   │   ├── DashboardViewModel.swift    # Dashboard stats + reminders
│   │   │   ├── ConnectionListViewModel.swift   # Search, sort, filter
│   │   │   ├── ConnectionDetailViewModel.swift # Detail + logs + inline log form
│   │   │   ├── ConnectionFormViewModel.swift   # Create + edit form logic
│   │   │   ├── QuickAddViewModel.swift     # Quick add (name + notes)
│   │   │   └── SettingsViewModel.swift     # Profile edit, logout
│   │   ├── Views/
│   │   │   ├── Auth/                       # RegisterView, VerifyView
│   │   │   ├── Navigation/                 # AppRootView, MainTabView
│   │   │   ├── Dashboard/                  # DashboardView, StatCardView, SmartRemindersView
│   │   │   ├── Connections/                # List, Detail, Row, Timeline, LogForm
│   │   │   ├── Forms/                      # New, Edit, QuickAdd, ContactPicker, TagPicker
│   │   │   ├── Settings/                   # SettingsView
│   │   │   └── Shared/                     # AvatarView, StatusBadge, Loading, EmptyState
│   │   ├── Extensions/                     # Date, Color, View extensions
│   │   └── Preview Content/                # Mock data for SwiftUI previews
│   └── ConnectionProTests/                 # Unit tests
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
- (iOS) Xcode 15+ and an iOS 17+ device or simulator

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

### iOS App

```bash
cd ios

# Open in Xcode
open ConnectionPro.xcodeproj
```

1. Open the project in Xcode 15+
2. Select a simulator (iPhone 15 or later recommended) or your device
3. Set the API base URL if needed (defaults to `http://localhost:8000`; override with `CONNECTIONPRO_API_URL` environment variable in the scheme)
4. Build and run (Cmd+R)

**Deep link testing:** To test magic link verification, use the URL scheme `connectionpro://verify?token=YOUR_TOKEN` in Safari or the simulator's terminal.

**Contact import:** The app requests access to your device's Contacts. You can import contacts individually (to pre-fill a form) or in bulk (multi-select or "Import All").

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
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL (web frontend) |
| `CONNECTIONPRO_API_URL` | `http://localhost:8000` | Backend API URL (iOS app) |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register or trigger magic link |
| `GET` | `/auth/check-email?email=` | Check if email exists |
| `POST` | `/auth/verify?token=` | Verify magic link, returns JWT |
| `GET` | `/auth/me` | Get current user (auth required) |
| `PUT` | `/auth/me` | Update current user profile (auth required) |

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

### Web

1. User enters email on the registration page
2. Server generates a magic link token (15-minute expiration)
3. In demo mode, the magic link is displayed on screen (production would send email)
4. User clicks the link, which navigates to `/verify?token=...`
5. Server verifies the token and returns a JWT access token (7-day expiration)
6. The JWT is stored in `localStorage` and sent as a `Bearer` token on all subsequent API requests

### iOS

1. User enters email in the RegisterView
2. If the email exists, a magic link is sent directly; if new, a name step is shown first
3. Server generates a magic link token (15-minute expiration)
4. In demo mode, a "Verify Now" button appears to verify immediately
5. In production, the user taps the magic link which opens the app via the `connectionpro://verify?token=...` deep link
6. Server verifies the token and returns a JWT access token (7-day expiration)
7. The JWT is stored in the iOS Keychain and sent as a `Bearer` token on all subsequent API requests
8. On subsequent app launches, the stored token is used to restore the session automatically

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

### CSV Import (Web)

1. Export your connections from LinkedIn as a CSV file
2. Navigate to the Import page in ConnectionPro
3. Upload the CSV -- the app parses it with PapaParse and shows a preview
4. Confirm to bulk-create connections from the imported data

### Contact Import (iOS)

The iOS app supports importing connections from your device's phonebook in two ways:

**Single import (form pre-fill):**
1. Tap the contact icon in the New Connection form toolbar
2. Search and tap a contact from your phonebook
3. The form auto-fills with name, email, company, and job title

**Bulk import:**
1. Go to My Network tab and tap the **+** button
2. Select **Import from Contacts**
3. Use checkboxes to select individual contacts, or tap **Select All** / **Import All**
4. Tap **Import Selected** -- contacts are created as connections with progress tracking
5. A success screen shows the number of contacts imported

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

### iOS (`ios/`)

```bash
# Open in Xcode
open ios/ConnectionPro.xcodeproj

# Build and run from command line (requires Xcode)
xcodebuild -project ios/ConnectionPro.xcodeproj -scheme ConnectionPro -destination 'platform=iOS Simulator,name=iPhone 16' build

# Run tests
xcodebuild test -project ios/ConnectionPro.xcodeproj -scheme ConnectionPro -destination 'platform=iOS Simulator,name=iPhone 16'
```

## iOS Architecture

The iOS app follows the **MVVM** (Model-View-ViewModel) pattern with SwiftUI and modern Swift concurrency.

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | SwiftUI | Modern, declarative, less boilerplate |
| Min iOS | 17+ | Enables `@Observable` macro, modern SwiftUI APIs |
| State | `@Observable` + `@MainActor` | Granular updates, no `@Published` boilerplate |
| Auth State | `AuthViewModel` via `.environment()` | Single source of truth, accessible everywhere |
| Screen State | Per-screen `@State` ViewModels | Simple, no global mutable store complexity |
| Data Refresh | Fetch on `.task {}` / `.onAppear` | API-first, no local cache to sync |
| Token Storage | Keychain (Security framework) | Encrypted, persists across reinstalls, no 3rd party deps |
| Navigation | `NavigationStack` per tab | Independent nav stacks per tab, standard iOS pattern |
| Networking | `URLSession` async/await | Native, no 3rd party deps |
| Deep Links | Custom URL scheme `connectionpro://` | Simple, works for demo |

### Data Flow

```
View (.task / user action)
  └── ViewModel (async method)
        └── Service (static enum)
              └── APIClient (URLSession + Keychain JWT)
                    └── FastAPI Backend
```

### Tabs

| Tab | View | Description |
|-----|------|-------------|
| Dashboard | `DashboardView` | Stats, smart reminders, recent logs |
| Network | `ConnectionListView` | Searchable/sortable list, swipe-to-delete |
| Add | `QuickAddView` | Fast connection creation (name + notes) |
| Settings | `SettingsView` | Profile editing, logout |
