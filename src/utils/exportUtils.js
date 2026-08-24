/**
 * Parse task data and validate format
 */
export function parseTaskData(rawData) {
  if (!rawData) {
    throw new Error('No task data provided');
  }

  try {
    const parsed =
      typeof rawData === 'string'
        ? JSON.parse(rawData)
        : rawData;

    if (!Array.isArray(parsed.tasks)) {
      throw new Error('Invalid task format: tasks must be an array');
    }

    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse task data: ${error.message}`);
  }
}

/**
 * Export tasks as JSON
 */
export function exportTasksAsJSON(tasks) {
  const data = {
    version: 1,
    exported_at: new Date().toISOString(),
    count: tasks.length,
    tasks,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Export tasks as CSV
 */
export function exportTasksAsCSV(tasks) {
  const headers = ['ID', 'Title', 'Description', 'Category', 'Priority', 'Status', 'Due Date', 'Created'];
  const rows = tasks.map((task) => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`,
    `"${(task.description || '').replace(/"/g, '""')}"`,
    task.category,
    task.priority,
    task.status,
    task.due_at ? new Date(task.due_at).toISOString().split('T')[0] : '',
    new Date(task.created_at).toISOString().split('T')[0],
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Download file
 */
export function downloadFile(content, filename, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
