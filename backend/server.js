import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initializeDatabase, getDatabase } from './database.js';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import remindersRouter from './routes/reminders.js';
import automationsRouter from './routes/automations.js';
import { authMiddleware } from './middleware/auth.js';
import { runEscalationCheck } from './services/escalation.js';
import { calculateTaskScore } from './services/taskScoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();
    
    // Public routes
    app.use('/api/auth', authRouter);

    // Health check (public)
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Protected routes
    app.use('/api/tasks', authMiddleware, tasksRouter);
    app.use('/api/reminders', authMiddleware, remindersRouter);
    app.use('/api/automations', authMiddleware, automationsRouter);

    // Today endpoint (protected)
    app.get('/api/today', authMiddleware, (req, res) => {
      try {
        const db = getDatabase();
        
        const tasks = db.prepare(`
          SELECT * FROM tasks
          WHERE user_id = ? AND status = 'pending'
          ORDER BY created_at DESC
        `).all(req.user.id);
        
        const tasksWithScores = tasks.map(task => ({
          ...task,
          score: calculateTaskScore(task),
        }));
        
        tasksWithScores.sort((a, b) => b.score - a.score);
        
        const focus = tasksWithScores[0] || null;
        const next = tasksWithScores.slice(1, 7);
        
        const stats = db.prepare(`
          SELECT
            (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'pending') as pending,
            (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'completed') as completed,
            (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'pending' AND due_at < datetime('now')) as overdue,
            (SELECT COALESCE(SUM(estimated_minutes), 0) FROM tasks WHERE user_id = ? AND status = 'pending') as planned_minutes
        `).get(req.user.id, req.user.id, req.user.id, req.user.id);
        
        res.json({ focus, next, stats });
      } catch (error) {
        console.error('Error fetching today view:', error);
        res.status(500).json({ error: 'Failed to fetch today view' });
      }
    });

    // Stats endpoint (protected)
    app.get('/api/stats', authMiddleware, (req, res) => {
      try {
        const db = getDatabase();
        
        const stats = db.prepare(`
          SELECT
            (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'pending') as pending,
            (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'completed') as completed,
            (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'pending' AND due_at < datetime('now')) as overdue,
            (SELECT COALESCE(SUM(estimated_minutes), 0) FROM tasks WHERE user_id = ? AND status = 'pending') as planned_minutes
        `).get(req.user.id, req.user.id, req.user.id, req.user.id);
        
        res.json(stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
      }
    });

    // Error handling
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Personal Reminder OS backend listening on http://localhost:${PORT}`);
      console.log(`📚 API available at http://localhost:${PORT}/api`);
      console.log(`🔐 Auth endpoints at http://localhost:${PORT}/api/auth`);
      console.log(`✅ Health check at http://localhost:${PORT}/api/health`);
      
      // Start escalation check every minute
      setInterval(runEscalationCheck, 60000);
      console.log('⚡ Escalation check running every minute\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
