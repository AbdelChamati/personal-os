import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'personal-os.db');
let db;
let SQL;

export async function initializeDatabase() {
  SQL = await initSqlJs();
  
  // Try to load existing database
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Check if tables exist
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'");
  
  if (tables.length === 0) {
    createTables();
    seedData();
  }
  
  saveDatabase();
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
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
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      sent_at TEXT,
      channel TEXT DEFAULT 'in-app',
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      task_id TEXT,
      provider TEXT NOT NULL,
      action TEXT NOT NULL,
      configuration TEXT,
      requires_approval INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS automation_runs (
      id TEXT PRIMARY KEY,
      automation_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      error TEXT,
      FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
    )
  `);
  
  console.log('Database tables created');
}

function seedData() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const inThirtyMin = new Date(now.getTime() + 30 * 60 * 1000);
  
  const tasks = [
    {
      id: uuidv4(),
      title: 'Study UiPath',
      description: 'Complete UiPath automation fundamentals course',
      category: 'Professional',
      priority: 'high',
      status: 'pending',
      estimated_minutes: 45,
      due_at: inThirtyMin.toISOString(),
      expires_at: tomorrow.toISOString(),
      recurrence_rule: null,
      created_at: now.toISOString(),
      completed_at: null,
      escalation_level: 0,
    },
    {
      id: uuidv4(),
      title: 'Buy groceries',
      description: 'Milk, eggs, bread, and vegetables',
      category: 'Shopping',
      priority: 'medium',
      status: 'pending',
      estimated_minutes: 30,
      due_at: new Date(today.getTime() + 18 * 60 * 60 * 1000).toISOString(),
      expires_at: tomorrow.toISOString(),
      recurrence_rule: null,
      created_at: now.toISOString(),
      completed_at: null,
      escalation_level: 0,
    },
    {
      id: uuidv4(),
      title: 'Plan tomorrow',
      description: 'Review calendar and plan daily tasks',
      category: 'Personal',
      priority: 'medium',
      status: 'pending',
      estimated_minutes: 15,
      due_at: tomorrow.toISOString(),
      expires_at: null,
      recurrence_rule: 'daily',
      created_at: now.toISOString(),
      completed_at: null,
      escalation_level: 0,
    },
    {
      id: uuidv4(),
      title: 'Call dentist for appointment',
      description: 'Schedule routine checkup',
      category: 'Health',
      priority: 'medium',
      status: 'pending',
      estimated_minutes: 10,
      due_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: null,
      recurrence_rule: null,
      created_at: now.toISOString(),
      completed_at: null,
      escalation_level: 0,
    },
    {
      id: uuidv4(),
      title: 'Review budget',
      description: 'Check monthly spending and adjust categories',
      category: 'Finance',
      priority: 'low',
      status: 'pending',
      estimated_minutes: 20,
      due_at: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: null,
      recurrence_rule: 'monthly',
      created_at: now.toISOString(),
      completed_at: null,
      escalation_level: 0,
    },
  ];
  
  tasks.forEach(task => {
    db.run(
      `INSERT INTO tasks (id, title, description, category, priority, status, estimated_minutes, due_at, expires_at, recurrence_rule, created_at, completed_at, escalation_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description,
        task.category,
        task.priority,
        task.status,
        task.estimated_minutes,
        task.due_at,
        task.expires_at,
        task.recurrence_rule,
        task.created_at,
        task.completed_at,
        task.escalation_level
      ]
    );
  });
  
  console.log('Sample data seeded');
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export function getDatabase() {
  return {
    prepare: (sql) => ({
      all: (...params) => {
        const stmt = db.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },
      get: (...params) => {
        const stmt = db.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        let result = null;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.free();
        return result;
      },
      run: (...params) => {
        const stmt = db.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        stmt.step();
        stmt.free();
        saveDatabase();
        return { changes: db.getRowsModified() };
      },
    }),
    exec: (sql) => {
      return db.exec(sql);
    },
  };
}