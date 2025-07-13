import { EmailParams, Sender, Recipient } from 'mailersend';
import { sendEmail } from '../email.ts';

import type { User } from 'generated/prisma/client';
import dbClient from '../db.ts';

import { logAuditEvent, TRACKBEAR_SYSTEM_ID } from '../audit-events.ts';
import { USER_STATE } from '../models/user/consts.ts';

async function handler(task) {
  let user: User;
  try {
    user = await dbClient.user.findUnique({ where: {
      id: task.userId,
      state: USER_STATE.DELETED,
    } });
  } catch {
    throw new Error(`Could not find a deleted user with id ${task.userId}`);
  }

  await sendConfirmationEmail(user);
  await logAuditEvent('email:deleted', TRACKBEAR_SYSTEM_ID, user.id);
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
    .setSubject('Your account has been deleted')
    .setText(`
Hi, ${user.displayName}!

This email is to confirm that your account has been deleted as requested.

If you did not request to delete your account, please contact TrackBear Support at trackbearapp+support@gmail.com.

Beary sincerely,
TrackBear
    `.trim());

  sendEmail(emailParams);
}

const TASK_NAME = 'send-account-deleted-email';
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
