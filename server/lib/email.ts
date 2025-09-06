import { MailerSend, EmailParams } from 'mailersend';

import { getLogger } from 'server/lib/logger.ts';

import { getNormalizedEnv } from './env.ts';

export async function sendEmail(params: EmailParams) {
  const env = await getNormalizedEnv();
  const logger = getLogger();

  if(!env.ENABLE_EMAIL) {
    logger.warn('Refusing to send this email because ENABLE_EMAIL is not set to `1`. Continuing...');
    return {
      statusCode: 204,
      body: 'No email sent; ENABLE_EMAIL is not set to `1`',
    };
  }

  const mailerSend = new MailerSend({
    apiKey: env.MAILERSEND_API_KEY,
  });

  const response = await mailerSend.email.send(params);
  if(response.statusCode > 299) {
    logger.error(`Could not send email: ${response.statusCode} ${JSON.stringify(response.body)}`, {
      statusCode: response.statusCode,
      to: params.to,
      subject: params.subject,
    });
  }

  return response;
}
