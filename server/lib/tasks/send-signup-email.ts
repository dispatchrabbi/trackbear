import { EmailParams, Sender, Recipient } from 'mailersend';
import { sendEmail } from '../email.ts';

import type { User } from '@prisma/client';
import dbClient from '../db.ts';

import { logAuditEvent, TRACKBEAR_SYSTEM_ID } from '../audit-events.ts';
import { USER_STATE } from '../models/user/consts.ts';

async function handler(task) {
  let user: User;
  try {
    user = await dbClient.user.findUnique({ where: {
      id: task.userId,
      state: USER_STATE.ACTIVE,
    } });
  } catch {
    throw new Error(`Could not find a user with id ${task.userId}`);
  }

  await sendConfirmationEmail(user);
  await logAuditEvent('email:signup', TRACKBEAR_SYSTEM_ID, user.id);
}

async function sendConfirmationEmail(user) {
  const sentFrom = new Sender('no-reply@trackbear.app', 'TrackBear');
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

Oh, also — you should receive an email soon that asks you to verify your email. Please make sure you do that within 10 days, or your account will be suspended.

Beary sincerely,
TrackBear
    `.trim());

  sendEmail(emailParams);
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
  makeTask,
};
