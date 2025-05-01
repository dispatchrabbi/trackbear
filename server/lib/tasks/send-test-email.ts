import { EmailParams, Sender, Recipient } from 'mailersend';
import { sendEmail } from '../email.ts';

// use the queue log to log info about the queue
import winston from 'winston';

const TASK_NAME = 'send-test-email';

async function handler(task) {
  // const taskLogger = winston.loggers.get('queue').child({ service: TASK_NAME });
  const taskLogger = winston;
  taskLogger.info('Starting task...');

  taskLogger.info(`Sending test email to ${task.email}`);
  const result = await sendTestEmail(task.email, task.message || '(no message included)');
  taskLogger.info(`Test email send result was ${result.statusCode}: ${JSON.stringify(result.body)}`);

  taskLogger.info(`Task has been finished`);
}

export async function sendTestEmail(email: string, message: string) {
  const sentFrom = new Sender('no-reply@trackbear.app', 'TrackBear');
  const recipients = [
    new Recipient(email),
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('Testing email polarity...')
    .setText(`
Hello!

This is a test email from TrackBear. We're doing some debugging and need to make sure the email system works. If you don't know what this is about, please disregard it.

This is a custom message we were asked to send: ${message}

Beary sincerely yours,
TrackBear
    `.trim());

  return sendEmail(emailParams);
}

function makeTask(email: string, message?: string) {
  return {
    name: TASK_NAME,
    email,
    message,
  };
}

export default {
  TASK_NAME,
  handler,
  makeTask,
};
