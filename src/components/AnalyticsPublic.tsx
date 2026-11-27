'use client';

import { Analytics } from '@vercel/analytics/next';

// Pages d'administration exclues des statistiques (27/11/2026) : les visites de l'admin gonflaient
// les chiffres (/agents/emma, /dashboard, /races-admin... plus de 300 visites en novembre).
const ADMIN_PATH = /^\/(?:dashboard|agents|orchestrate|login)(?:\/|$)|^\/[a-z-]+-admin(?:\/|$)/;

export default function AnalyticsPublic() {
  return (
    <Analytics
      beforeSend={event => {
        try {
          return ADMIN_PATH.test(new URL(event.url).pathname) ? null : event;
        } catch {
          return event;
        }
      }}
    />
  );
}
