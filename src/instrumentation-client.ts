// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://be2b25d58b9617d48f5102aefe1b9487@o4511412620689408.ingest.de.sentry.io/4511412634189904",
  tracesSampleRate: 1,
  profilesSampleRate: 1,
  sendDefaultPii: true,
  enableLogs: true,
  integrations: [
    Sentry.browserProfilingIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
