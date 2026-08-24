import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../personal-os.db');

let db = null;

export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');

      // Create tables
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          email_verified INTEGER DEFAULT 0,
          last_login TEXT,
          reset_token TEXT,
          reset_token_expires TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
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
          escalation_level INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_status (user_id, status),
          INDEX idx_due_at (due_at)
        );

        CREATE TABLE IF NOT EXISTS reminders (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          task_id TEXT NOT NULL,
          scheduled_at TEXT NOT NULL,
          sent_at TEXT,
          channel TEXT DEFAULT 'in-app',
          status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          INDEX idx_user_scheduled (user_id, scheduled_at),
          INDEX idx_status (status)
        );

        CREATE TABLE IF NOT EXISTS automations (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          task_id TEXT,
          provider TEXT NOT NULL,
          action TEXT NOT NULL,
          configuration TEXT,
          requires_approval INTEGER DEFAULT 0,
          enabled INTEGER DEFAULT 1,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
          INDEX idx_user_enabled (user_id, enabled)
        );

        CREATE TABLE IF NOT EXISTS automation_runs (
          id TEXT PRIMARY KEY,
          automation_id TEXT NOT NULL,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          status TEXT DEFAULT 'pending',
          result TEXT,
          FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE,
          INDEX idx_automation_started (automation_id, started_at)
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at);
      `);

      console.log(`Database initialized at ${dbPath}`);
      resolve();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      reject(error);
    }
  });
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
