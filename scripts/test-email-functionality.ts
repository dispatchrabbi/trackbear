#!/usr/bin/env -S node --import tsx

import dotenv from 'dotenv';
import { getNormalizedEnv } from '../server/lib/env.ts';

import { initLoggers, getLogger } from '../server/lib/logger.ts';

import { initQueue, pushTask } from '../server/lib/queue.ts';
import sendTestEmailTask, { sendTestEmail } from '../server/lib/tasks/send-test-email.ts';

async function main() {
  process.env.NODE_ENV = 'development';
  dotenv.config();
  await getNormalizedEnv();

  await initLoggers();
  const scriptLogger = getLogger('default').child({ service: 'test-email-functionality.ts' });

  await initQueue();

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const TEST_EMAIL_RECIPIENT = 'dispatch.rabbi+trackbear_debug@gmail.com';

  scriptLogger.info(`Sending a test email to ${TEST_EMAIL_RECIPIENT} via the queue...`);
  pushTask(sendTestEmailTask.makeTask(TEST_EMAIL_RECIPIENT, 'This was sent via the queue'));
  scriptLogger.info(`Queue task pushed`);

  scriptLogger.info(`Sending a test email to ${TEST_EMAIL_RECIPIENT} without the queue...`);
  const result = await sendTestEmail(TEST_EMAIL_RECIPIENT, 'This was sent directly');
  if(result) {
    console.log(`Test email send result was ${result.statusCode}: ${JSON.stringify(result.body)}`);
    scriptLogger.info(`Test email send result was ${result.statusCode}: ${JSON.stringify(result.body)}`);
  } else {
    scriptLogger.info(`Test email send result was undefined for some reason`);
  }
  scriptLogger.info(`Done`);
}

main().catch(e => console.error(e));
