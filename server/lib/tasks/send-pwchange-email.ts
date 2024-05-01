import { EmailParams, Sender, Recipient } from 'mailersend';
import { sendEmail } from '../email.ts';

import type { User } from '@prisma/client';
import dbClient from '../db.ts';

import { logAuditEvent, TRACKBEAR_SYSTEM_ID } from '../audit-events.ts';
import { USER_STATE } from '../models/user.ts';

async function handler(task) {
  let user: User;
  try {
    user = await dbClient.user.findUnique({ where: {
      id: task.userId,
      state: USER_STATE.ACTIVE,
    } });
  } catch(err) {
    throw new Error(`Could not find a user with id ${task.userId}`);
  }

  await sendPasswordChangeEmail(user);
  await logAuditEvent('email:password-change', TRACKBEAR_SYSTEM_ID, user.id);
}

async function sendPasswordChangeEmail(user) {
  const sentFrom = new Sender('no-reply@trackbear.app', 'TrackBear');
  const recipients = [
    new Recipient(user.email, user.displayName),
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('Your password has changed')
    .setText(`
Hi, ${user.displayName}!

This email is to confirm that you recently changed your login password on TrackBear.

If you did not change your TrackBear password recently, please contact TrackBear Support at trackbearapp+support@gmail.com.

Beary sincerely yours,
TrackBear
    `.trim());

  sendEmail(emailParams);
}

const TASK_NAME = 'send-pwchange-email';
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
