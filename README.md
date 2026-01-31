# ConnectionPro

A full-stack professional network management application for maintaining meaningful relationships with your professional connections. Available as a **web app** and a native **iOS app**, both powered by the same backend. Track contacts, log interactions, set follow-up reminders, and enrich profiles directly from LinkedIn.

**For technical documentation, architecture details, and contributor guides, please see [AGENT.md](./AGENT.md).**

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

## Architecture Overview

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

The application uses **React 19** for the web frontend, **SwiftUI** for the iOS app, and **FastAPI** (Python 3.11+) for the backend. Data is stored in **PostgreSQL**, with background tasks handled by **Celery** and **Redis**.

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

### Local Development (without Docker)

See [AGENT.md](./AGENT.md#development-commands) for detailed local development instructions.

#### Frontend
```bash
cd client
npm install
npm run dev
```

#### Backend
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# ... (see AGENT.md for env vars and migration commands)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### iOS App

```bash
cd ios
open ConnectionPro.xcodeproj
```

1. Open the project in Xcode 15+
2. Select a simulator (iPhone 15 or later recommended) or your device
3. Build and run (Cmd+R)

**Deep link testing:** `connectionpro://verify?token=YOUR_TOKEN`

### Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` directory

## User Workflows

### LinkedIn Enrichment
1. User provides a LinkedIn URL when creating/editing a connection
2. Frontend requests enrichment -> Backend schedules task -> Frontend polls for status
3. Form auto-fills with scraped data

### CSV Import (Web)
1. Export connections from LinkedIn as CSV
2. Upload CSV in ConnectionPro -> Bulk create connections

### Contact Import (iOS)
- **Single:** Tap contact icon in form -> Search & Select -> Auto-fill
- **Bulk:** "My Network" tab -> "+" -> "Import from Contacts" -> Multi-select -> Import
