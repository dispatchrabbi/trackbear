import { MailerSend, EmailParams } from 'mailersend';
import winston from 'winston';

import { getNormalizedEnv } from './env.ts';


export async function sendEmail(params: EmailParams) {
  const env = await getNormalizedEnv();

  if(!env.ENABLE_EMAIL) {
    winston.warn('Refusing to send this email because ENABLE_EMAIL is not set to `1`. Continuing...');
    return;
  }

  const mailerSend = new MailerSend({
    apiKey: env.MAILERSEND_API_KEY,
  });

  return mailerSend.email.send(params);
}
