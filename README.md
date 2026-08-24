# Personal OS - Task & Reminder Management System

A full-stack application for managing tasks, reminders, and automations with authentication and user-specific data isolation.

## Features

- ✅ User authentication (register, login, password reset)
- 📝 Create, read, update, delete tasks
- 📌 Task categorization and priority levels
- 📅 Due dates with escalation levels
- 🔁 Recurring tasks (daily, weekly, monthly, etc.)
- ⏰ Reminders with multiple channels
- 🤖 Automation workflows
- 📊 Task scoring and prioritization
- 💾 Backup and restore functionality
- 🎨 Modern responsive UI

## Tech Stack

### Backend
- Node.js + Express
- SQLite with better-sqlite3
- JWT authentication
- bcrypt password hashing

### Frontend
- React 18+
- React Router
- CSS3 with modern styling
- REST API integration

## Installation

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
PORT=3001
JWT_SECRET=your-secret-key-here
NODE_ENV=development
DATABASE_PATH=./backend/personal-os.db
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `DELETE /api/auth/account` - Delete account

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/export` - Export tasks
- `POST /api/tasks/import` - Import tasks
- `GET /api/today` - Get today's focus tasks
- `GET /api/stats` - Get statistics

### Reminders
- `GET /api/reminders` - Get all reminders
- `GET /api/reminders/task/:taskId` - Get task reminders
- `POST /api/reminders` - Create reminder
- `PATCH /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

### Automations
- `GET /api/automations` - Get all automations
- `GET /api/automations/:id` - Get automation
- `GET /api/automations/:id/runs` - Get automation runs
- `POST /api/automations` - Create automation
- `PATCH /api/automations/:id` - Update automation
- `DELETE /api/automations/:id` - Delete automation

## Project Structure

```
backend/
├── database.js              # Database initialization and schema
├── server.js                # Express server setup
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── tasks.js             # Task CRUD routes
│   ├── reminders.js         # Reminder routes
│   └── automations.js       # Automation routes
├── services/
│   ├── tokenService.js      # JWT token generation/verification
│   ├── passwordService.js   # Password hashing and validation
│   ├── taskScoring.js       # Task priority scoring
│   ├── recurrence.js        # Recurring task logic
│   ├── escalation.js        # Task escalation levels
│   ├── reminderService.js   # Reminder management
│   ├── automationService.js # Automation execution
│   └── backupService.js     # Backup/restore functionality
└── .env.example             # Environment configuration template

src/
├── App.jsx                  # Main React app
├── pages/
│   ├── Login.jsx            # Login page
│   ├── Register.jsx         # Registration page
│   ├── Dashboard.jsx        # Main dashboard
│   └── Profile.jsx          # User profile settings
├── components/
│   ├── Header.jsx           # Navigation header
│   ├── TaskForm.jsx         # Task creation form
│   ├── TaskList.jsx         # Task list display
│   ├── TaskCard.jsx         # Individual task card
│   └── ProtectedRoute.jsx   # Route protection HOC
├── context/
│   └── AuthContext.jsx      # Authentication context
├── hooks/
│   └── useAuth.js           # useAuth hook
├── api/
│   └── authApi.js           # API client
└── styles/
    ├── auth.css             # Auth page styles
    ├── dashboard.css        # Dashboard styles
    ├── header.css           # Header styles
    ├── task-form.css        # Form styles
    ├── task-list.css        # List styles
    └── task-card.css        # Card styles
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

## Security Features

- JWT tokens with 24-hour expiration
- Password hashing with bcrypt (10 rounds)
- SQL injection prevention with parameterized queries
- CORS enabled with sensible defaults
- User data isolation at database level
- Reset tokens expire after 30 minutes

## Future Enhancements

- [ ] Email notifications for reminders
- [ ] SMS notifications
- [ ] Slack integration
- [ ] Google Calendar sync
- [ ] Mobile app
- [ ] Dark mode
- [ ] Team collaboration
- [ ] Advanced reporting
- [ ] AI-powered task suggestions

## License

MIT
