# Personal OS Frontend

Modern React-based frontend for the Personal OS task and reminder management system.

## Quick Start

```bash
npm install
npm run dev
```

The app will open at `http://localhost:3000` with hot module reloading.

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

- `src/pages/` - Page components (Login, Register, Dashboard, Profile)
- `src/components/` - Reusable components (Header, TaskForm, TaskList, TaskCard)
- `src/context/` - React Context for state management (AuthContext)
- `src/hooks/` - Custom React hooks (useAuth)
- `src/api/` - API client functions (authApi)
- `src/styles/` - CSS stylesheets

## Features

- ✅ User authentication (Login/Register)
- 📋 Task management (Create/Read/Update/Delete)
- 🎯 Task prioritization and scoring
- 📅 Due date tracking and escalation
- ⏰ Reminder scheduling
- 🔐 Protected routes with JWT
- 📱 Responsive design
- 🎨 Modern UI with gradient styling

## Environment Configuration

The app automatically proxies API requests from `/api` to `http://localhost:3001` (backend server).

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
