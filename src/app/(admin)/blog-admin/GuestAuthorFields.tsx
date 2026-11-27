'use client';

import { useState } from 'react';

/** Champs "Article invité" des formulaires d'article (création et modification). */
export default function GuestAuthorFields({ author, bio, inputCls, labelCls }: {
  author?: string | null;
  bio?: string | null;
  inputCls: string;
  labelCls: string;
}) {
  const [open, setOpen] = useState(!!author);
  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
        <input type="checkbox" checked={open} onChange={e => setOpen(e.target.checked)} className="accent-orange-600" />
        Article invité (rédigé par un partenaire)
      </label>
      {open ? (
        <>
          <div>
            <label className={labelCls}>Nom de l&apos;auteur</label>
            <input type="text" name="guest_author" defaultValue={author ?? ''} required maxLength={80}
              placeholder="Ex. Lydie Graudens, Vos Chiens et Chats" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Présentation de l&apos;auteur <span className="text-gray-400 font-normal">- 2 ou 3 lignes</span></label>
            <textarea name="guest_author_bio" defaultValue={bio ?? ''} rows={3} maxLength={500} className={inputCls} />
          </div>
          <p className="text-xs text-gray-500">L&apos;article affichera la mention « Article invité » et sera signé de cet auteur à la place de Marie.</p>
        </>
      ) : (
        <input type="hidden" name="guest_author" value="" />
      )}
    </div>
  );
}
