'use client';

import { useEffect } from 'react';

/**
 * Gardien global des liens externes.
 * Force tout lien pointant hors du domaine du site à s'ouvrir dans un nouvel
 * onglet (target="_blank") + rel="noopener noreferrer", PARTOUT et sur toutes
 * les rubriques (y compris le contenu blog rendu via dangerouslySetInnerHTML,
 * les liens affiliés, la boutique, et toute page future).
 * Les liens internes (même domaine) et les ancres (#) ne sont pas touchés.
 */
export default function ExternalLinks() {
  useEffect(() => {
    const markExternal = (root: ParentNode = document) => {
      const anchors = root.querySelectorAll?.('a[href]');
      if (!anchors) return;
      anchors.forEach((node) => {
        const a = node as HTMLAnchorElement & { dataset: DOMStringMap };
        if (a.dataset.extDone) return;

        const href = a.getAttribute('href') || '';
        // Ignore ancres, mailto, tel, javascript:
        if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return;

        let host: string;
        try { host = new URL(a.href, window.location.href).hostname; }
        catch { return; }

        if (host && host !== window.location.hostname) {
          a.target = '_blank';
          const rel = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
          rel.add('noopener');
          rel.add('noreferrer');
          a.setAttribute('rel', Array.from(rel).join(' '));
          a.dataset.extDone = '1';
        }
      });
    };

    markExternal();

    // Couvre le contenu ajouté dynamiquement (navigation client, modales, etc.)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes.length) { markExternal(); break; }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
