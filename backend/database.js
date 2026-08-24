import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../personal-os.db');

let db = null;

function addColumnIfMissing(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((existingColumn) => existingColumn.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

function migrateDatabase(database) {
  addColumnIfMissing(database, 'users', 'avatar_url', 'avatar_url TEXT');
  addColumnIfMissing(database, 'users', 'phone_number', 'phone_number TEXT');
  addColumnIfMissing(database, 'users', 'oauth_provider', 'oauth_provider TEXT');
  addColumnIfMissing(database, 'users', 'oauth_provider_id', 'oauth_provider_id TEXT');
  addColumnIfMissing(database, 'tasks', 'user_id', 'user_id TEXT');
  addColumnIfMissing(database, 'reminders', 'user_id', 'user_id TEXT');
  addColumnIfMissing(database, 'reminders', 'created_at', 'created_at TEXT');
  addColumnIfMissing(database, 'reminders', 'error_message', 'error_message TEXT');
  addColumnIfMissing(database, 'reminders', 'attempts', 'attempts INTEGER DEFAULT 0');
  addColumnIfMissing(database, 'automations', 'user_id', 'user_id TEXT');
}

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
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
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
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS automation_runs (
          id TEXT PRIMARY KEY,
          automation_id TEXT NOT NULL,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          status TEXT DEFAULT 'pending',
          result TEXT,
          FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
        );

      `);

      migrateDatabase(db);

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_identity ON users(oauth_provider, oauth_provider_id);
        CREATE INDEX IF NOT EXISTS idx_user_status ON tasks(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_due_at ON tasks(due_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_user_scheduled ON reminders(user_id, scheduled_at);
        CREATE INDEX IF NOT EXISTS idx_status ON reminders(status);
        CREATE INDEX IF NOT EXISTS idx_user_enabled ON automations(user_id, enabled);
        CREATE INDEX IF NOT EXISTS idx_automation_started ON automation_runs(automation_id, started_at);
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
