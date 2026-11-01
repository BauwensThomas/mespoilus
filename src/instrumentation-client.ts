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
  // Bruit connu du navigateur intégré Instagram/Android WebView (pont natif détruit
  // pendant la navigation) - ne vient jamais de notre code, aucune action possible.
  ignoreErrors: [
    /Java object is gone/,
    /Java bridge method invoked after JavaScript context destroyed/,
    // Requêtes injectées par des extensions / adwares du visiteur (ex. "Failed to fetch
    // (safesearchinc.com)", 01/11/2026) : seuls les échecs vers notre domaine ou Supabase
    // nous concernent, les autres hôtes sont ignorés.
    /Failed to fetch \((?!(?:www\.)?mespoilus\.com\)|[a-z0-9-]+\.supabase\.co\))[^)]+\)/,
  ],
  // Erreurs levées par le code d'une extension de navigateur, jamais par le site.
  denyUrls: [
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-(web-)?extension:\/\//i,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
