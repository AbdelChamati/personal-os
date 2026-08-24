import { getDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const AUTOMATION_PROVIDERS = {
  slack: { name: 'Slack', actions: ['send_message', 'create_channel', 'post_thread'] },
  email: { name: 'Email', actions: ['send_email', 'send_digest'] },
  webhook: { name: 'Webhook', actions: ['post_data', 'trigger_workflow'] },
  calendar: { name: 'Calendar', actions: ['create_event', 'update_event', 'send_invitation'] },
};

export function createAutomation(userId, name, taskId, provider, action, configuration, requiresApproval = false) {
  const db = getDatabase();

  if (!AUTOMATION_PROVIDERS[provider]) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  if (taskId) {
    const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
    if (!task) {
      throw new Error('Task not found');
    }
  }

  const automationId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO automations (id, user_id, name, task_id, provider, action, configuration, requires_approval, enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(automationId, userId, name, taskId || null, provider, action, configuration || null, requiresApproval ? 1 : 0, 1, now);

  return db.prepare('SELECT * FROM automations WHERE id = ?').get(automationId);
}

export function triggerAutomation(automationId, context = {}) {
  const db = getDatabase();
  const automation = db.prepare('SELECT * FROM automations WHERE id = ?').get(automationId);

  if (!automation || !automation.enabled) {
    return false;
  }

  const runId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO automation_runs (id, automation_id, started_at, completed_at, status, result) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(runId, automationId, now, null, 'pending', JSON.stringify(context));

  // Execute automation based on provider and action
  executeAutomationAction(automation, context);

  const completedAt = new Date().toISOString();
  db.prepare('UPDATE automation_runs SET completed_at = ?, status = ? WHERE id = ?').run(completedAt, 'completed', runId);

  return true;
}

function executeAutomationAction(automation, context) {
  // This is where integration with external services happens
  // For now, just log
  console.log(`Executing automation: ${automation.name}`);
  console.log(`Provider: ${automation.provider}, Action: ${automation.action}`);
  console.log(`Context:`, context);
}

export function getAutomationRuns(automationId, limit = 50) {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM automation_runs WHERE automation_id = ? ORDER BY started_at DESC LIMIT ?')
    .all(automationId, limit);
}

export function getAvailableAutomations() {
  return AUTOMATION_PROVIDERS;
}
