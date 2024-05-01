import { EmailParams, Sender, Recipient } from 'mailersend';
import { sendEmail } from '../email.ts';

import type { User, PendingEmailVerification } from '@prisma/client';
import dbClient from '../db.ts';

// use the queue log to log info about the queue
import winston from 'winston';

import { getNormalizedEnv } from '../env.ts';
import { logAuditEvent, TRACKBEAR_SYSTEM_ID } from '../audit-events.ts';
import { USER_STATE } from '../models/user.ts';

const TASK_NAME = 'send-emailverification-email';

async function handler(task) {
  const taskLogger = winston.loggers.get('queue').child({ service: TASK_NAME });
  taskLogger.debug('Starting task...');

  let pendingEmailVerification: PendingEmailVerification & { user: User };
  try {
    taskLogger.debug(`Getting pending email verification record for uuid ${task.verificationUuid}`);
    pendingEmailVerification = await dbClient.pendingEmailVerification.findUnique({
      where: {
        uuid: task.verificationUuid,
        user: { state: USER_STATE.ACTIVE },
      },
      include: { user: true }
    });
  } catch(err) {
    taskLogger.error(`Could not find a pending email verification with uuid ${task.verificationUuid}`);
    throw new Error(`Could not find a pending email verification with uuid ${task.verificationUuid}`);
  }

  taskLogger.debug(`Sending email verification email for uuid ${task.verificationUuid}`);
  const response = await sendEmailVerificationEmail(pendingEmailVerification.user, pendingEmailVerification);

  if(response.statusCode >= 200 && response.statusCode < 300) {
    taskLogger.info(`Sending email succeeded with status code ${response.statusCode}: ${JSON.stringify(response.body)}`);
    await logAuditEvent('email:verify-email', TRACKBEAR_SYSTEM_ID, pendingEmailVerification.user.id);
  } else {
    taskLogger.error(`Sending email failed with status code ${response.statusCode}: ${JSON.stringify(response.body)}`);
  }

  taskLogger.debug(`Task has been finished`);
}

async function sendEmailVerificationEmail(user: User, pendingEmailVerification: PendingEmailVerification) {
  const env = await getNormalizedEnv();
  const verifyUrl = env.EMAIL_URL_PREFIX + '/verify-email/' + pendingEmailVerification.uuid;

  const sentFrom = new Sender('no-reply@trackbear.app', 'TrackBear');
  const recipients = [
    new Recipient(user.email, user.displayName),
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('Verify your email address')
    .setText(`
Hi, ${user.displayName}!

Please click this link to verify your email address: ${verifyUrl}

This link will stay active for 10 days. If you don't verify your email address by then, your account will be suspended.

You are receiving this email because you just either signed up for TrackBear or changed your email address within TrackBear, and we are verifying your email address to make sure you actually own this email and can receive email here.

Beary sincerely yours,
TrackBear
    `.trim());

  return sendEmail(emailParams);
}

function makeTask(verificationUuid: string) {
  return {
    name: TASK_NAME,
    verificationUuid,
  };
}

export default {
  TASK_NAME,
  handler,
  makeTask
};
