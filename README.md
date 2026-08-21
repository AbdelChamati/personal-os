# Personal Reminder OS

A personal operating system for productivity that answers: **"What should I do now?"**

Personal Reminder OS captures obligations, evaluates urgency/importance, selects the next best action, tracks completion, handles deadlines/expiration, and is architected for future integrations with notifications, AI, UiPath, Power Automate, calendar systems, and more.

## Features

### Current MVP
- ✅ Smart task prioritization with deterministic scoring
- ✅ "DO NOW" engine - prominently displays the highest-scoring task
- ✅ Today dashboard with stats and next 4-6 tasks
- ✅ Quick capture interface for fast task creation
- ✅ Task categories: Personal, Professional, Family, Home, Finance, Shopping, Health, Other
- ✅ Priority levels: Low, Medium, High
- ✅ Task management: Create, edit, complete, archive, restore
- ✅ Smart filters: Today, All, Overdue, Completed
- ✅ Automatic escalation for overdue tasks
- ✅ Foundation for recurring tasks
- ✅ Automation framework with provider abstraction
- ✅ Responsive mobile-first design
- ✅ Local-first SQLite database
- ✅ Light and dark themes
- ✅ Natural-language quick capture (date/time, priority, minutes hints)
- ✅ Sticky mobile quick actions
- ✅ Backup export/import (JSON)
- ✅ Export options: Save As, Share, Copy JSON
- ✅ Multilingual UI (EN, DE, IT, FR, ES)
- ✅ Header language switcher with persisted preference

## Architecture

### Backend
- **server.js** - Express server, routes, middleware
- **database.js** - SQLite initialization, schema, seed data
- **routes/** - Task, reminder, automation REST endpoints
- **services/** - Business logic isolation
  - `taskScoring.js` - Deterministic task prioritization algorithm
  - `escalation.js` - Automatic escalation for overdue tasks
  - `recurrence.js` - Recurring task handling
  - `scheduler.js` - Background job scheduling

### Frontend
- **React** - Component-based UI
- **Vite** - Fast dev server and bundler
- **i18next + react-i18next** - UI internationalization
- **src/api/** - Centralized API client
- **src/domain/** - Pure business logic helpers
- **src/components/** - Reusable UI components
- **src/views/** - Page-level components
- **src/i18n/** - Translation setup and locale dictionaries

### Database
- **tasks** - Core task data with scoring factors
- **reminders** - Reminder scheduling and delivery
- **automations** - Automation definitions and metadata
- **automation_runs** - Execution audit trail

## Installation

```bash
# Clone repository
git clone <repo>
cd personal-os

# Install dependencies
npm install

# Start dev server (both frontend and backend)
npm run dev
```

Default ports in this repository:
- Frontend: `http://localhost:5174`
- Backend: `http://localhost:3001`

If `npm run dev` fails with `EADDRINUSE`, another process is already using one of these ports.

## npm Commands

```bash
npm run dev       # Start frontend (Vite) + backend (Express) concurrently
npm run server    # Start only backend
npm run client    # Start only frontend
npm run build     # Build production bundle
npm run preview   # Preview production build
```

## API Reference

### Health
```
GET /api/health
```

### Tasks
```
GET    /api/tasks           - List all tasks
GET    /api/tasks/:id       - Get single task
POST   /api/tasks           - Create task
PATCH  /api/tasks/:id       - Update task
DELETE /api/tasks/:id       - Delete task
GET    /api/tasks/export    - Export backup tasks (JSON)
POST   /api/tasks/import    - Import backup tasks (JSON)
```

### Today
```
GET /api/today              - Get today view (focus + next + stats)
```

### Stats
```
GET /api/stats              - Get task statistics
```

### Reminders
```
GET    /api/reminders
POST   /api/reminders
PATCH  /api/reminders/:id
DELETE /api/reminders/:id
```

### Automations
```
GET    /api/automations
POST   /api/automations
PATCH  /api/automations/:id
DELETE /api/automations/:id
GET    /api/automations/:id/runs
```

## Database Schema

### tasks
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Other',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  estimated_minutes INTEGER,
  due_at TEXT,
  expires_at TEXT,
  recurrence_rule TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  escalation_level INTEGER DEFAULT 0
)
```

### reminders
```sql
CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  sent_at TEXT,
  channel TEXT DEFAULT 'in-app',
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (task_id) REFERENCES tasks(id)
)
```

### automations
```sql
CREATE TABLE automations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  task_id TEXT,
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  configuration TEXT,
  requires_approval INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
)
```

### automation_runs
```sql
CREATE TABLE automation_runs (
  id TEXT PRIMARY KEY,
  automation_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT DEFAULT 'pending',
  result TEXT,
  error TEXT,
  FOREIGN KEY (automation_id) REFERENCES automations(id)
)
```

## Task Scoring Algorithm

The scoring engine in `backend/services/taskScoring.js` uses:

- **Priority**: High (+30), Medium (+15), Low (+5)
- **Due Date**: Overdue (+60), Within 30m (+45), Within 2h (+35), Today (+25), Tomorrow (+12), Later (+5)
- **Expiration**: Today (+25), Within 48h (+15)
- **Escalation**: Level 1 (+10), Level 2 (+20), Level 3 (+35)
- **Age**: Older tasks get slight boost (+1 per day, capped)

The system is deterministic and extensible for future AI-driven scoring.

## Task Categories

- Personal
- Professional
- Family
- Home
- Finance
- Shopping
- Health
- Other

## Task Statuses

- **pending** - Awaiting action
- **completed** - Finished task
- **archived** - Removed from active view

## Future Roadmap

### Phase 2: Advanced Scheduling
- Recurring task engine with full rules support
- Daily capacity planning
- Time blocking
- Automatic rescheduling based on capacity
- Daily and weekly review workflows
- Habit tracking

### Phase 3: Notifications
- Browser notifications
- Push notifications
- Quiet hours configuration
- Smart reminder engine
- Escalation notifications

### Phase 4: AI & Natural Language
- Natural-language task capture
- Automatic date/time extraction
- Automatic categorization
- AI-suggested priorities
- Task splitting suggestions

### Phase 5: PWA & Mobile
- Progressive Web App
- Offline support
- Mobile installation
- Native push notifications
- Installable on home screen

### Phase 6: External Integrations
- Google Calendar sync
- Microsoft Outlook sync
- Email integration
- Power Automate webhooks
- UiPath process integration

### Phase 7: Automation Engine
- Personal automation workflows
- Multi-step automation chains
- Approval workflows
- Audit logging
- AI-assisted scheduling
- Cross-system personal assistant

## Security

Even in local MVP mode:
- ✅ Server-side input validation
- ✅ No arbitrary command execution
- ✅ No credentials stored in database
- ✅ No API keys in source code
- ✅ Automation actions require explicit approval metadata
- ✅ Audit trail for automation execution
- ✅ No automatic sensitive actions

## Development

The application uses ES Modules exclusively (no CommonJS). All imports use `import` syntax.

### Best Practices Used in This Project

- Keep route handlers small and deterministic. Move non-trivial logic to `backend/services`.
- Keep UI text and display formatting out of business logic.
- Validate all API inputs server-side, even if frontend already validates.
- Prefer clear error messages that are actionable for users and developers.
- Keep comments short and meaningful. Explain "why", not obvious "what".
- Add minimal but targeted logs around API boundaries and failures.

### Debugging Checklist

```bash
# Install dependencies
npm install

# Run frontend + backend
npm run dev

# Run frontend only
npm run client

# Run backend only
npm run server

# Build production bundle
npm run build
```

If ports are busy, stop listeners on current defaults (`3001`, `5174`) and restart.

## Internationalization (EN, DE, IT, FR, ES)

### Recommended Approach

Use a structured i18n layer in the frontend instead of hardcoded text literals.

- Library: `i18next` + `react-i18next`
- Message organization: one JSON per locale (`en.json`, `de.json`, `it.json`, `fr.json`, `es.json`)
- Namespace by domain (`header`, `tasks`, `capture`, `backup`, `errors`)
- Persist user language in localStorage
- Lazy-load locale bundles to keep startup fast

### Implemented in This Repository

- i18n bootstrap: `src/i18n/index.js`
- Locale files:
  - `src/i18n/locales/en.json`
  - `src/i18n/locales/de.json`
  - `src/i18n/locales/it.json`
  - `src/i18n/locales/fr.json`
  - `src/i18n/locales/es.json`
- Header language switcher (EN/DE/IT/FR/ES) with localStorage persistence
- Main UI translated for:
  - Header and theme controls
  - Today filters and empty states
  - Backup export/import modal and feedback
  - Quick Capture labels and messages

### Adding New Text Safely

1. Add a key in `src/i18n/locales/en.json`
2. Add equivalent keys in `de.json`, `it.json`, `fr.json`, and `es.json`
3. Use `t('your.key')` in the component
4. Keep stable key names so refactors are easy and debug traces remain clear

### Language Switcher UX

Best practice is a **globe icon + language code** (`EN`, `DE`, `IT`, `FR`, `ES`) in the header.

- Avoid country flags as primary language selectors
- Reason: one language can map to many countries, and flags can be ambiguous
- Good label examples: `EN`, `DE`, `IT`, `FR`, `ES`

Suggested header pattern:

- `🌐 EN` (click/tap opens language list)
- Options: `English`, `Deutsch`, `Italiano`, `Français`, `Español`

### Backend i18n Notes

Backend can remain language-neutral for now (status codes + stable error keys).
Later, expose translated user-facing messages in frontend only, mapped from API error keys.

## License

MIT