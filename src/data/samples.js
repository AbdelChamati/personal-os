/**
 * Sample task data for testing
 */
export const SAMPLE_TASKS = [
  {
    id: '1',
    title: 'Complete project proposal',
    description: 'Write and submit the Q4 project proposal',
    category: 'Professional',
    priority: 'high',
    status: 'pending',
    estimated_minutes: 120,
    due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    escalation_level: 0,
  },
  {
    id: '2',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, vegetables',
    category: 'Shopping',
    priority: 'medium',
    status: 'pending',
    estimated_minutes: 30,
    due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    escalation_level: 0,
  },
  {
    id: '3',
    title: 'Schedule dentist appointment',
    description: 'Annual checkup',
    category: 'Health',
    priority: 'low',
    status: 'pending',
    estimated_minutes: 15,
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    escalation_level: 0,
  },
];

/**
 * Sample automation data
 */
export const SAMPLE_AUTOMATIONS = [
  {
    name: 'Slack notification on task completion',
    provider: 'slack',
    action: 'send_message',
    description: 'Send a Slack message when a task is completed',
  },
  {
    name: 'Email digest',
    provider: 'email',
    action: 'send_digest',
    description: 'Send daily email digest of pending tasks',
  },
  {
    name: 'Calendar event',
    provider: 'calendar',
    action: 'create_event',
    description: 'Create calendar event for due dates',
  },
];
