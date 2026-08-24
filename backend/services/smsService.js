export function isSmsConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

export async function sendReminderSms({ to, task }) {
  if (!isSmsConfigured()) {
    throw new Error('SMS delivery is not configured');
  }
  if (!/^\+[1-9]\d{7,14}$/.test(to || '')) {
    throw new Error('A valid E.164 phone number is required for SMS reminders');
  }

  const body = `Personal OS reminder: ${task.title}${task.due_at ? ` (due ${new Date(task.due_at).toLocaleString()})` : ''}`;
  const accountId = process.env.TWILIO_ACCOUNT_SID;
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountId}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountId}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: process.env.TWILIO_FROM_NUMBER,
      Body: body,
    }),
  });

  if (!response.ok) {
    throw new Error('SMS provider rejected the reminder');
  }
}