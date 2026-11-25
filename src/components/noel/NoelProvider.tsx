'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { isGiftSeason, isNoelSeason } from '@/lib/noel';

interface NoelState { decor: boolean; gifts: boolean }

const NoelContext = createContext<NoelState>({ decor: false, gifts: false });

export const useNoel = () => useContext(NoelContext);

/**
 * `initial` vient du serveur (pas de saut à l'affichage). Une page gardée en cache peut dater d'avant
 * le 25/11 ou d'après le 10/01 : la date est donc revérifiée dans le navigateur.
 */
export default function NoelProvider({ enabled, initial, children }: { enabled: boolean; initial: NoelState; children: React.ReactNode }) {
  const [state, setState] = useState<NoelState>(initial);

  useEffect(() => {
    const now = new Date();
    const next = { decor: enabled && isNoelSeason(now), gifts: enabled && isGiftSeason(now) };
    setState(s => (s.decor === next.decor && s.gifts === next.gifts ? s : next));
  }, [enabled]);

  return <NoelContext.Provider value={state}>{children}</NoelContext.Provider>;
}
