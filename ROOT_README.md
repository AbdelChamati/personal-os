# 📋 Personal OS - Task & Reminder Management System

> A complete full-stack application for managing tasks, reminders, and automations with authentication and user data isolation.

![Status](https://img.shields.io/badge/status-complete-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-16+-green)
![React](https://img.shields.io/badge/react-18+-blue)

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication (24-hour tokens)
- Password hashing with bcryptjs
- Password reset functionality
- Profile management
- Account deletion

### ✅ Task Management
- Create, read, update, delete tasks
- 8 task categories (Personal, Professional, Family, Home, Finance, Shopping, Health, Other)
- Priority levels (Low, Medium, High)
- Due date tracking
- Estimated time tracking
- Task completion and archiving
- Task export/import

### 🎯 Advanced Features
- **Smart Scoring**: Algorithm-based task prioritization
- **Escalation**: Automatic escalation for overdue tasks
- **Recurring**: Daily, weekly, biweekly, monthly, yearly patterns
- **Reminders**: Multi-channel notifications (in-app, email, SMS)
- **Automations**: Workflow automation with multiple providers (Slack, Email, Webhook, Calendar)
- **Backup/Restore**: User data backup and recovery
- **Dashboard**: Real-time statistics and task overview

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Backend Setup

```bash
# Clone and navigate
git clone https://github.com/AbdelChamati/personal-os.git
cd personal-os

# Install dependencies
cd backend
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

Backend runs at `http://localhost:3001`

### Frontend Setup

```bash
# In root directory
npm install

# Start development server
npm run dev
```

Frontend runs at `http://localhost:3000`

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Complete implementation details
- **[README.md](README.md)** - Project overview
- **[FRONTEND_README.md](FRONTEND_README.md)** - Frontend documentation

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│   React Frontend (3000)         │
│ - Dashboard, Auth, Task Mgmt    │
└────────────┬────────────────────┘
             │ REST API
┌────────────▼────────────────────┐
│  Express Backend (3001)         │
│ - Routes, Services, Middleware  │
└────────────┬────────────────────┘
             │ SQL
┌────────────▼────────────────────┐
│   SQLite Database               │
│ - Users, Tasks, Reminders, etc  │
└─────────────────────────────────┘
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  email_verified INTEGER,
  last_login TEXT,
  reset_token TEXT,
  reset_token_expires TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  estimated_minutes INTEGER,
  due_at TEXT,
  expires_at TEXT,
  recurrence_rule TEXT,
  escalation_level INTEGER,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Reminders & Automations Tables
- Reminders for scheduled notifications
- Automations for workflow triggers
- Automation_runs for execution history

## 🔌 API Endpoints

### Authentication (7 endpoints)
```
POST   /api/auth/register           - Create account
POST   /api/auth/login              - Sign in
POST   /api/auth/logout             - Sign out
GET    /api/auth/me                 - Get current user
PATCH  /api/auth/profile            - Update profile
POST   /api/auth/change-password    - Change password
DELETE /api/auth/account            - Delete account
```

### Tasks (8 endpoints)
```
GET    /api/tasks                   - Get all tasks
GET    /api/tasks/:id               - Get single task
POST   /api/tasks                   - Create task
PATCH  /api/tasks/:id               - Update task
DELETE /api/tasks/:id               - Delete task
GET    /api/tasks/export            - Export tasks
POST   /api/tasks/import            - Import tasks
GET    /api/today                   - Today's focus
GET    /api/stats                   - Statistics
```

### Reminders & Automations
```
GET    /api/reminders               - Get reminders
POST   /api/reminders               - Create reminder
GET    /api/automations             - Get automations
POST   /api/automations             - Create automation
```

## 🛡️ Security Features

- JWT tokens with 24-hour expiration
- Password hashing with bcryptjs (10 rounds)
- SQL injection prevention (parameterized queries)
- CORS enabled with sensible defaults
- User data isolation at database level
- Password reset tokens expire after 30 minutes
- Protected API routes with middleware
- Environment variables for sensitive data

## 📦 Technology Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **SQLite** - Database (better-sqlite3)
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

### Frontend
- **React 18+** - UI library
- **React Router v6** - Navigation
- **Vite** - Build tool
- **CSS3** - Styling (no frameworks)
- **Fetch API** - HTTP requests

## 📁 Project Structure

```
project/
├── backend/
│   ├── database.js              # Database initialization
│   ├── server.js                # Express server
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── tasks.js             # Task endpoints
│   │   ├── reminders.js         # Reminder endpoints
│   │   └── automations.js       # Automation endpoints
│   ├── services/
│   │   ├── tokenService.js      # JWT operations
│   │   ├── passwordService.js   # Password hashing
│   │   ├── taskScoring.js       # Scoring algorithm
│   │   ├── recurrence.js        # Recurring tasks
│   │   ├── escalation.js        # Escalation logic
│   │   ├── reminderService.js   # Reminders
│   │   ├── automationService.js # Automations
│   │   └── backupService.js     # Backup/restore
│   └── package.json
├── src/
│   ├── App.jsx                  # Main app
│   ├── main.jsx                 # Entry point
│   ├── pages/
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration
│   │   ├── Dashboard.jsx        # Main dashboard
│   │   └── Profile.jsx          # Profile settings
│   ├── components/
│   │   ├── Header.jsx           # Navigation
│   │   ├── TaskForm.jsx         # Task creation
│   │   ├── TaskList.jsx         # Task listing
│   │   ├── TaskCard.jsx         # Individual task
│   │   └── ProtectedRoute.jsx   # Route protection
│   ├── context/
│   │   └── AuthContext.jsx      # Auth state
│   ├── hooks/
│   │   └── useAuth.js           # useAuth hook
│   ├── api/
│   │   └── authApi.js           # API client
│   ├── utils/
│   │   ├── dateUtils.js         # Date utilities
│   │   ├── validators.js        # Validators
│   │   ├── stringUtils.js       # String utilities
│   │   └── exportUtils.js       # Export utilities
│   ├── data/
│   │   └── samples.js           # Sample data
│   ├── config/
│   │   └── constants.js         # Constants
│   ├── styles/
│   │   ├── auth.css             # Auth styles
│   │   ├── dashboard.css        # Dashboard styles
│   │   ├── header.css           # Header styles
│   │   ├── task-form.css        # Form styles
│   │   ├── task-list.css        # List styles
│   │   └── task-card.css        # Card styles
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── package.json                 # Frontend deps
├── vite.config.js               # Vite config
├── tsconfig.json                # TypeScript config
├── README.md                    # Main README
├── QUICKSTART.md                # Quick start
├── IMPLEMENTATION_GUIDE.md      # Implementation
└── FRONTEND_README.md           # Frontend docs
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
DATABASE_PATH=./backend/personal-os.db
```

## 🧪 Testing

### Manual Testing Flow

1. **Register Account**
   ```bash
   POST http://localhost:3001/api/auth/register
   {
     "email": "test@example.com",
     "password": "TestPassword123!",
     "confirmPassword": "TestPassword123!",
     "name": "Test User"
   }
   ```

2. **Login**
   ```bash
   POST http://localhost:3001/api/auth/login
   {
     "email": "test@example.com",
     "password": "TestPassword123!"
   }
   ```

3. **Create Task**
   ```bash
   POST http://localhost:3001/api/tasks
   Headers: Authorization: Bearer <token>
   {
     "title": "Learn React",
     "category": "Professional",
     "priority": "high",
     "estimated_minutes": 120
   }
   ```

## 📈 Performance Optimization

- Database indexes on frequently queried columns
- Lazy-loaded React components
- Efficient state management
- Optimized SQL queries
- Minified production builds
- CORS pre-flight caching

## 🚢 Deployment

### Backend Deployment (Heroku)

```bash
heroku create your-app-name
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set NODE_ENV="production"
git push heroku main
```

### Frontend Deployment (Vercel)

```bash
npm run build
# Deploy dist/ folder to Vercel
```

## 🗺️ Roadmap

- [ ] Email notifications
- [ ] SMS notifications
- [ ] Slack integration
- [ ] Google Calendar sync
- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Team collaboration
- [ ] Advanced analytics
- [ ] AI task suggestions
- [ ] Browser extension
- [ ] Real-time sync (WebSocket)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - See LICENSE file for details

## 💬 Support

For issues or questions:

1. Check existing documentation
2. Review code comments
3. Check browser console for errors
4. Verify environment configuration
5. Open an issue on GitHub

## 👨‍💻 Author

**Abdel Chamati** - [GitHub](https://github.com/AbdelChamati)

## 🙏 Acknowledgments

- Express.js community
- React community
- SQLite documentation
- JWT best practices

---

**Made with ❤️ for task management**

⭐ Star us on GitHub!
