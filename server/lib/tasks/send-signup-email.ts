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
  await logAuditEvent('signup:send-email', TRACKBEAR_SYSTEM_ID, user.id);
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
    .setSubject('Please confirm your email address')
    .setText(`
Hi, ${user.displayName}!

There isn't actually anything for you to do, because we don't have email confirmation set up yet. Enjoy this email!

Bearly,
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
