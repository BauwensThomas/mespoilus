// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://be2b25d58b9617d48f5102aefe1b9487@o4511412620689408.ingest.de.sentry.io/4511412634189904",
  tracesSampleRate: 1,
  profilesSampleRate: 1,
  sendDefaultPii: true,
  enableLogs: true,
  integrations: [
    nodeProfilingIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  // POST forgés par des robots scanners (ex. 12/11/2026 : POST / de 137 Ko depuis la
  // Moldavie avec des cookies d'un autre site) ou onglet resté ouvert pendant un déploiement.
  // Next.js rejette déjà la requête, aucune action possible de notre côté.
  ignoreErrors: [/Failed to find Server Action/],
});
