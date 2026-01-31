# AGENT.md

## Project Overview
ConnectionPro is a full-stack professional network management application with a React web frontend, FastAPI backend, and native iOS app.

## Technology Stack

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

## Architecture

### System Diagram
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React SPA  │────>│              │────>│  PostgreSQL  │
│   (Vite)     │     │   FastAPI    │     │              │
│   :5173      │     │   Server     │     │  :5433       │
│   └──────────────┘     │   :8000      │     └──────────────┘
│                      │              │
┌──────────────┐     │              │     ┌──────────────┐
│   iOS App    │────>│              │     │  Redis       │
│   (SwiftUI)  │     └──────┬───────┘     │  :6379       │
│   └──────────────┘            │             └──────┬───────┘
│                      ┌──────┴───────┐            │
┌──────────────┐     │  Celery       │───────────┘
│   Chrome     │     │  Worker       │
│   Extension  │     └──────────────┘
│   └──────────────┘
```

### iOS Architecture
The iOS app follows the **MVVM** (Model-View-ViewModel) pattern with SwiftUI and modern Swift concurrency.

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

#### Data Flow
```
View (.task / user action)
  └── ViewModel (async method)
        └── Service (static enum)
              └── APIClient (URLSession + Keychain JWT)
                    └── FastAPI Backend
```

## Development Commands

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

### Docker
```bash
# Start all services
docker compose up --build
```
Services: `client` (:5173), `server` (:8000), `db` (:5433), `redis` (:6379), `worker`.

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register or trigger magic link |
| `GET` | `/auth/check-email?email=` | Check if email exists |
| `POST` | `/auth/verify?token=` | Verify magic link, returns JWT |
| `GET` | `/auth/me` | Get current user (auth required) |
| `PUT` | `/auth/me` | Update current user profile (auth required) |

### Connections
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/connections` | Create a connection |
| `GET` | `/connections` | List all connections |
| `GET` | `/connections/{id}` | Get a single connection |
| `PUT` | `/connections/{id}` | Update a connection |
| `DELETE` | `/connections/{id}` | Delete a connection |

### Interaction Logs
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

## Database Schema

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

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///database.db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis broker URL |
| `SECRET_KEY` | `super-secret-key-change-it-in-prod` | JWT signing secret |
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL (web frontend) |
| `CONNECTIONPRO_API_URL` | `http://localhost:8000` | Backend API URL (iOS app) |

## Workflows

### Authentication Flow

#### Web
1. User enters email on the registration page
2. Server generates a magic link token (15-minute expiration)
3. In demo mode, the magic link is displayed on screen
4. User clicks the link -> `/verify?token=...`
5. Server verifies and returns JWT (7-day expiration)
6. JWT stored in `localStorage`

#### iOS
1. User enters email in RegisterView
2. Server generates a magic link token
3. User taps magic link -> `connectionpro://verify?token=...`
4. Apps verifies token, returns JWT
5. JWT stored in Keychain

### LinkedIn Enrichment
1. User provides LinkedIn URL
2. Frontend `POST /enrich?linkedin_url=...`
3. Backend schedules Celery task
4. Frontend polls `GET /tasks/{task_id}`
5. Enriched data fills form

### Chrome Extension Flow
1. Navigate to LinkedIn profile
2. Click extension icon "Extract Profile Data"
3. Click "Send to ConnectionPro"
4. Opens `localhost:5173/connections/new` with URL params

### Data Import
- **Web CSV**: Upload LinkedIn export CSV, parsed by PapaParse, bulk create.
- **iOS Contacts**: Access device contacts, single or bulk import to connections.

### Important Notes
- **It is good to ask**: when making refactoring and architecturing decisions, it is always good to ask me for confirmation first. 
- **Testing**: always make sure to test your code changes in multiple environments (e.g. web, iOS, backend) to ensure compatibility and functionality. always update test when making code function changes