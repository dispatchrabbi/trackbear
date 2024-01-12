import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

import type { User } from '@prisma/client';
import dbClient from '../db.ts';

import { getNormalizedEnv } from '../env.ts';
import { logAuditEvent, TRACKBEAR_SYSTEM_ID } from '../audit-events.ts';

async function handler(task) {
  let user: User;
  try {
    user = await dbClient.user.findUnique({ where: {
      id: task.userId,
      state: 'active',
    } });
  } catch(err) {
    throw new Error(`Could not find a user with id ${task.userId}`);
  }

  await sendConfirmationEmail(user);
  await logAuditEvent('email:signup', TRACKBEAR_SYSTEM_ID, user.id);
}

async function sendConfirmationEmail(user) {
  const env = await getNormalizedEnv();

  const mailerSend = new MailerSend({
    apiKey: env.MAILERSEND_API_KEY,
  });

  const sentFrom = new Sender('no-reply@trackbear.dispatchrab.bi', 'TrackBear');
  const recipients = [
    new Recipient(user.email, user.displayName),
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('Welcome to TrackBear!')
    .setText(`
Hi, ${user.displayName}!

Thank you for signing up to TrackBear! We hope that this will be the start of a wonderful new era of writing productivity for you! (But if it isn't, don't worry, we don't judge.)

TrackBear is currently in alpha and I'd love to hear your feedback. You can reach out to me on Discord (@dispatchrabbi) or Github (also dispatchrabbi).

Oh, also — you should receive an email soon that asks you to verify your email. Please make sure you do that within 10 days, or your account will be suspended.

Beary sincerely,
TrackBear
    `.trim());

  await mailerSend.email.send(emailParams);
}

const TASK_NAME = 'send-signup-email';
function makeTask(userId: number) {
  return {
    name: TASK_NAME,
    userId,
  };
}

export default {
  TASK_NAME,
  handler,
  makeTask
};
