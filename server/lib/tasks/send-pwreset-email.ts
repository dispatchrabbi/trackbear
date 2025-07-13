import { EmailParams, Sender, Recipient } from 'mailersend';
import { sendEmail } from '../email.ts';

import type { User, PasswordResetLink } from 'generated/prisma/client';
import dbClient from '../db.ts';
import { PASSWORD_RESET_LINK_STATE } from '../models/user/consts.ts';

import { getNormalizedEnv } from '../env.ts';
import { logAuditEvent, TRACKBEAR_SYSTEM_ID } from '../audit-events.ts';
import { USER_STATE } from '../models/user/consts.ts';

async function handler(task) {
  let resetLink: PasswordResetLink & { user: User };
  try {
    resetLink = await dbClient.passwordResetLink.findUnique({
      where: {
        uuid: task.resetUuid,
        state: PASSWORD_RESET_LINK_STATE.ACTIVE,
        user: { state: USER_STATE.ACTIVE },
      },
      include: { user: true },
    });
  } catch {
    throw new Error(`Could not find an active password reset link with uuid ${task.resetUuid}`);
  }

  await sendPasswordResetEmail(resetLink.user, resetLink);
  await logAuditEvent('email:password-reset', TRACKBEAR_SYSTEM_ID, resetLink.user.id);
}

async function sendPasswordResetEmail(user: User, resetLink: PasswordResetLink) {
  const env = await getNormalizedEnv();
  const resetUrl = env.EMAIL_URL_PREFIX + '/reset-password/' + resetLink.uuid;

  const sentFrom = new Sender('no-reply@trackbear.app', 'TrackBear');
  const recipients = [
    new Recipient(user.email, user.displayName),
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('Reset your password')
    .setText(`
Hi, ${user.displayName}!

Please click this link to reset your password: ${resetUrl}

This link will stay active for 10 minutes, after which it will expire and you will have to request a new link.

Beary sincerely yours,
TrackBear
    `.trim());

  sendEmail(emailParams);
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
  makeTask,
};
