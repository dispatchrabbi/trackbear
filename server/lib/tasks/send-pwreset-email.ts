import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

import type { User, PasswordResetLink } from '@prisma/client';
import dbClient from '../db.ts';
import { PASSWORD_RESET_LINK_STATE } from '../states.ts';

import { getNormalizedEnv } from '../env.ts';
import { logAuditEvent, TRACKBEAR_SYSTEM_ID } from '../audit-events.ts';

async function handler(task) {
  let resetLink: PasswordResetLink & { user: User };
  try {
    resetLink = await dbClient.passwordResetLink.findUnique({
      where: {
        uuid: task.resetUuid,
        state: PASSWORD_RESET_LINK_STATE.ACTIVE,
      },
      include: { user: true }
    });
  } catch(err) {
    throw new Error(`Could not find an active password reset link with uuid ${task.resetUuid}`);
  }

  await sendPasswordResetEmail(resetLink.user, resetLink);
  await logAuditEvent('password:send-reset', TRACKBEAR_SYSTEM_ID, resetLink.user.id);
}

async function sendPasswordResetEmail(user: User, resetLink: PasswordResetLink) {
  const env = await getNormalizedEnv();
  const resetUrl = env.ORIGIN + '/reset-password/' + resetLink.uuid;

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
    .setSubject('Reset Password')
    .setText(`
Hi, ${user.displayName}!

Please click this link to reset your password: ${resetUrl}

This link will stay active for 10 minutes, after which you will have to request a new link.

Beary sincerely yours,
TrackBear
    `.trim());

  await mailerSend.email.send(emailParams);
}

const TASK_NAME = 'send-pwreset-email';
function makeTask(resetUuid: string) {
  return {
    name: TASK_NAME,
    resetUuid,
  };
}

export default {
  TASK_NAME,
  handler,
  makeTask
};