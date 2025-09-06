import { EmailParams, Sender, Recipient } from 'mailersend';
import { sendEmail } from '../email.ts';

import { UserModel } from '../models/user/user-model.ts';
import { USER_STATE } from '../models/user/consts.ts';

import { logAuditEvent, TRACKBEAR_SYSTEM_ID } from '../audit-events.ts';

async function handler(task) {
  const user = await UserModel.getUser(task.userId, { state: USER_STATE.ACTIVE });
  if(user === null) {
    throw new Error(`Could not find a user with id ${task.userId}`);
  }

  await sendConfirmationEmail(user);
  await logAuditEvent('email:username', TRACKBEAR_SYSTEM_ID, user.id);
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
    .setSubject('Your username was changed')
    .setText(`
Hi, ${user.displayName}!

This email is to confirm that you recently changed your username on TrackBear.

If you did not change your TrackBear username recently, please contact TrackBear Support at trackbearapp+support@gmail.com.

Beary sincerely,
TrackBear
    `.trim());

  sendEmail(emailParams);
}

const TASK_NAME = 'send-username-changed-email';
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
