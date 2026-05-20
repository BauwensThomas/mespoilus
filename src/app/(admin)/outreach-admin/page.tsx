'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, Mail, Eye, Code, RefreshCw, Upload, Image, Link, History } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DEFAULT_SUBJECT = 'Proposition de partenariat - Mes Poilus';

const DEFAULT_HTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:system-ui,-apple-system,sans-serif;background:#f0f4f8;padding:20px 0">
  <tr>
    <td align="center" style="padding:20px">

      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

        <!-- En-tete orange -->
        <tr>
          <td bgcolor="#ea580c" style="background-color:#ea580c;padding:36px 40px 32px;border-radius:12px 12px 0 0">
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px">
              <tr>
                <td style="vertical-align:middle;padding-right:10px">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="4.5" cy="6.5" rx="2.5" ry="2.5"/>
                    <ellipse cx="9.5" cy="3.5" rx="2" ry="2"/>
                    <ellipse cx="14.5" cy="3.5" rx="2" ry="2"/>
                    <ellipse cx="19.5" cy="6.5" rx="2.5" ry="2.5"/>
                    <path d="M12 8c-3.9 0-7 2.6-7 6.5 0 2.3 1.5 4.5 3 5.5 1 .7 2 1 4 1s3-.3 4-1c1.5-1 3-3.2 3-5.5C19 10.6 15.9 8 12 8z"/>
                  </svg>
                </td>
                <td style="vertical-align:middle">
                  <span style="color:white;font-size:26px;font-weight:800;letter-spacing:-0.5px">Mes Poilus</span>
                </td>
              </tr>
            </table>
            <h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 8px 0;line-height:1.3">
              Développez votre visibilité gratuitement
            </h1>
            <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0">
              Un partenariat gagnant-gagnant pour les acteurs du monde animal
            </p>
          </td>
        </tr>

        <!-- Corps -->
        <tr>
          <td bgcolor="#ffffff" style="background-color:white;padding:36px 40px">

            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px">Bonjour,</p>

            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px">
              Je suis <strong>Thomas</strong>, fondateur de <strong>Mes Poilus</strong>.
              Nous aidons chaque jour les propriétaires d'animaux à trouver les meilleurs conseils,
              services et professionnels fiables.
            </p>

            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px">
              Nous développons un réseau de partenaires sélectionnés avec soin
              et nous aimerions vous y intégrer <strong>gratuitement</strong>.
            </p>

            <!-- Proposition -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
              <tr>
                <td style="background-color:#fff7ed;border-left:4px solid #ea580c;padding:20px 24px;border-radius:0 8px 8px 0">
                  <p style="color:#ea580c;font-size:12px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.8px">Ce que cela vous apporte</p>
                  <ul style="color:#374151;font-size:14px;line-height:1.9;margin:0;padding-left:18px">
                    <li>Une mise en avant dans notre section <strong>"Nos recommandations"</strong></li>
                    <li>Une visibilité continue auprès de propriétaires d'animaux ciblés</li>
                    <li>Un lien direct vers votre site ou vos réseaux</li>
                    <li>Une présence possible dans notre bandeau partenaires</li>
                  </ul>
                </td>
              </tr>
            </table>

            <!-- Contrepartie -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px">
              <tr>
                <td style="background-color:#f9fafb;border:1px solid #e5e7eb;padding:20px 24px;border-radius:8px">
                  <p style="color:#111827;font-size:12px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.8px">En échange simple</p>
                  <ul style="color:#374151;font-size:14px;line-height:1.9;margin:0;padding-left:18px">
                    <li>Un lien vers <strong>mespoilus.com</strong> depuis votre site et/ou</li>
                    <li>Une mention sur vos réseaux sociaux</li>
                  </ul>
                </td>
              </tr>
            </table>

            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 28px">
              C'est rapide, sans coût, et pensé pour créer une vraie valeur mutuelle.
              Si cela vous intéresse, répondez simplement à cet email.
            </p>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px">
              <tr>
                <td align="center">
                  <a href="https://mespoilus.com" style="display:inline-block;background-color:#ea580c;color:white;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px">
                    Découvrir Mes Poilus
                  </a>
                </td>
              </tr>
            </table>

            <!-- Réseaux -->
            <p style="color:#374151;font-size:13px;text-align:center;margin:0 0 28px">
              Nos réseaux :
              <a href="https://www.instagram.com/mespoilusofficiel/" style="color:#ea580c;text-decoration:none;font-weight:600"> Instagram</a>
              &nbsp;&bull;&nbsp;
              <a href="https://www.facebook.com/profile.php?id=61589487954538" style="color:#ea580c;text-decoration:none;font-weight:600">Facebook</a>
            </p>

            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 4px">
              Merci pour votre engagement auprès des animaux.
            </p>
            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 4px">Bien cordialement,</p>
            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0">
              <strong>Thomas</strong><br>
              Fondateur - Mes Poilus<br>
              <a href="mailto:contact@mespoilus.com" style="color:#ea580c;text-decoration:none">contact@mespoilus.com</a>
            </p>

          </td>
        </tr>

        <!-- Pied de page -->
        <tr>
          <td bgcolor="#f3f4f6" style="background-color:#f3f4f6;padding:20px 40px;text-align:center;border-top:2px solid #e5e7eb;border-radius:0 0 12px 12px">
            <p style="color:#6b7280;font-size:12px;margin:0 0 4px">
              Mes Poilus - <a href="https://mespoilus.com" style="color:#6b7280;text-decoration:underline">mespoilus.com</a>
            </p>
            <p style="color:#9ca3af;font-size:11px;margin:0">
              Partenariat proposé dans une démarche de collaboration entre acteurs du monde animal.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;

interface Campaign {
  id: string;
  subject: string;
  emails: string[];
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export default function OutreachAdminPage() {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [showImgPanel, setShowImgPanel] = useState(false);
  const [imgSize, setImgSize] = useState('100%');
  const [history, setHistory] = useState<Campaign[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetch('/api/admin/outreach').then(r => r.json()).then(d => { setHistory(Array.isArray(d) ? d : []); setLoadingHistory(false); }).catch(() => setLoadingHistory(false));
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cursorPos = useRef({ start: 0, end: 0 });

  function saveCursor() {
    if (textareaRef.current) {
      cursorPos.current = { start: textareaRef.current.selectionStart, end: textareaRef.current.selectionEnd };
    }
  }

  function insertImg(url: string, alt = '') {
    if (!url.trim()) return;
    const sizeStyle = imgSize === '100%'
      ? 'max-width:100%;width:100%;display:block;margin:16px auto;border-radius:6px'
      : `width:${imgSize};max-width:100%;display:block;margin:16px auto;border-radius:6px`;
    const tag = `<img src="${url}" alt="${alt}" style="${sizeStyle}" />`;
    const { start, end } = cursorPos.current;
    const newVal = html.substring(0, start) + tag + html.substring(end);
    setHtml(newVal);
    cursorPos.current = { start: start + tag.length, end: start + tag.length };
    setImgUrlInput('');
    setShowImgPanel(false);
    setTab('edit');
  }

  function removeImg(src: string) {
    const escaped = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    setHtml(h => h.replace(new RegExp(`<img[^>]*src="${escaped}"[^>]*/?>`, 'gi'), ''));
  }

  function getImagesFromHtml(): string[] {
    return [...html.matchAll(/<img[^>]*src="([^"]+)"[^>]*\/?>/gi)].map(m => m[1]);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', 'image');
    const res = await fetch('/api/admin/partenaires/upload-logo', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) insertImg(data.url);
  }

  function addEmails() {
    const raw = emailInput.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'));
    const newOnes = raw.filter(e => !emails.includes(e));
    if (newOnes.length) setEmails(prev => [...prev, ...newOnes]);
    setEmailInput('');
    inputRef.current?.focus();
  }

  function removeEmail(e: string) {
    setEmails(prev => prev.filter(x => x !== e));
  }

  async function send() {
    setConfirmOpen(false);
    setSending(true);
    setResult(null);
    const res = await fetch('/api/admin/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, html, emails }),
    });
    const data = await res.json();
    setSending(false);
    setResult(data);
  }

  const canSend = subject.trim() && html.trim() && emails.length > 0 && !sending;

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Prospection email</h1>
        <p className="text-gray-500 text-base mt-1">Envoi individuel - les destinataires ne se voient pas entre eux.</p>
      </div>

      <div className="flex gap-6 items-start">

        {/* Formulaire gauche */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* Objet */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Objet *</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="ex: Proposition de partenariat - Mes Poilus"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          {/* Editeur HTML */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">Contenu HTML *</label>
              <div className="flex items-center gap-2">
                {/* Bouton insérer image */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowImgPanel(v => !v)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Image size={11} /> Insérer image
                  </button>
                  {showImgPanel && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-80 space-y-3">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Insérer une image</p>

                      {/* Taille */}
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Taille</p>
                        <div className="flex gap-1">
                          {[{ label: 'Pleine', value: '100%' }, { label: '50%', value: '50%' }, { label: '300px', value: '300px' }, { label: '200px', value: '200px' }].map(opt => (
                            <button key={opt.value} type="button" onClick={() => setImgSize(opt.value)}
                              className={`flex-1 text-[10px] py-1 rounded-md border transition-colors ${imgSize === opt.value ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Upload */}
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-colors"
                      >
                        {uploading ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Upload en cours...</> : <><Upload size={11} /> Uploader un fichier</>}
                      </button>

                      {/* URL directe */}
                      <div className="flex gap-1.5">
                        <input
                          value={imgUrlInput}
                          onChange={e => setImgUrlInput(e.target.value)}
                          placeholder="https://... URL de l'image"
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-orange-400"
                        />
                        <button
                          type="button"
                          onClick={() => insertImg(imgUrlInput)}
                          disabled={!imgUrlInput.trim()}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-500 disabled:opacity-40 transition-colors"
                        >
                          <Link size={10} /> Insérer
                        </button>
                      </div>

                      <p className="text-[10px] text-gray-400">Clique dans l'éditeur à l'endroit voulu, puis insère ici.</p>

                      {/* Images déjà dans le mail */}
                      {getImagesFromHtml().length > 0 && (
                        <div className="border-t border-gray-100 pt-2 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Images dans le mail</p>
                          {getImagesFromHtml().map((src, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="" className="w-10 h-8 object-cover rounded flex-shrink-0 border border-gray-200" />
                              <span className="text-[10px] text-gray-500 truncate flex-1 min-w-0">{src.split('/').pop()}</span>
                              <button type="button" onClick={() => removeImg(src)} className="text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors">
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Toggle edit/preview */}
                <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                  <button type="button" onClick={() => setTab('edit')}
                    className={clsx('flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors', tab === 'edit' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}>
                    <Code size={11} /> HTML
                  </button>
                  <button type="button" onClick={() => setTab('preview')}
                    className={clsx('flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors', tab === 'preview' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}>
                    <Eye size={11} /> Apercu
                  </button>
                </div>
              </div>
            </div>

            {tab === 'edit' ? (
              <textarea
                ref={textareaRef}
                value={html}
                onChange={e => setHtml(e.target.value)}
                onSelect={saveCursor}
                onBlur={saveCursor}
                onKeyUp={saveCursor}
                rows={18}
                placeholder={'<div style="font-family:sans-serif;max-width:600px;margin:0 auto">\n  <img src="https://..." alt="Logo" style="height:48px" />\n  <h2>Bonjour,</h2>\n  <p>...</p>\n</div>'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-orange-400 resize-none"
              />
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ height: '420px' }}>
                {html ? (
                  <iframe srcDoc={html} className="w-full h-full" sandbox="allow-same-origin" title="Apercu email" />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-300 text-sm">
                    Ecris du HTML pour voir l'apercu
                  </div>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); e.target.value = ''; }} />
          </div>

          {/* Destinataires */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">Destinataires</label>
            <div className="flex gap-2 mb-2">
              <input
                ref={inputRef}
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmails(); } }}
                placeholder="email@exemple.com ou coller plusieurs adresses..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              />
              <button onClick={addEmails} className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors">
                <Plus size={13} /> Ajouter
              </button>
            </div>

            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {emails.map(e => (
                  <span key={e} className="flex items-center gap-1 bg-white border border-gray-200 text-xs text-gray-700 px-2 py-1 rounded-full">
                    <Mail size={10} className="text-gray-400" />
                    {e}
                    <button onClick={() => removeEmail(e)} className="text-gray-300 hover:text-red-500 ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {emails.length > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">{emails.length} destinataire{emails.length > 1 ? 's' : ''} - envoi individuel, aucun ne voit les autres.</p>
            )}
          </div>

          {/* Bouton envoyer */}
          <div className="pt-1">
            {!confirmOpen ? (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!canSend}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
              >
                <Send size={15} strokeWidth={2} />
                Envoyer a {emails.length} destinataire{emails.length > 1 ? 's' : ''}
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm text-orange-800 font-medium flex-1">Confirmer l'envoi a {emails.length} destinataire{emails.length > 1 ? 's' : ''} ?</p>
                <button onClick={send} className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors">
                  Confirmer
                </button>
                <button onClick={() => setConfirmOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {sending && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw size={14} className="animate-spin" /> Envoi en cours...
            </div>
          )}
          {result && (
            <div className={clsx('p-4 rounded-xl border text-sm', result.failed === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-orange-50 border-orange-200 text-orange-800')}>
              <p className="font-semibold">{result.sent} email{result.sent > 1 ? 's' : ''} envoye{result.sent > 1 ? 's' : ''} avec succes{result.failed > 0 ? `, ${result.failed} echec${result.failed > 1 ? 's' : ''}` : ''}.</p>
              {result.errors?.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs">
                  {result.errors.map((e, i) => <li key={i} className="text-red-600">{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Apercu sticky droite */}
        <div className="sticky top-6 w-80 flex-shrink-0 hidden xl:block">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Apercu live</p>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm" style={{ height: '500px' }}>
            {html ? (
              <iframe srcDoc={html} className="w-full h-full" sandbox="allow-same-origin" title="Apercu sticky" />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm text-center px-6">
                L'apercu apparait ici pendant que tu edites
              </div>
            )}
          </div>
          {subject && (
            <div className="mt-2 px-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Objet</p>
              <p className="text-xs text-gray-700 font-medium mt-0.5 truncate">{subject}</p>
            </div>
          )}
        </div>

      </div>

      {/* Historique */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <History size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Historique des envois</h2>
        </div>
        {loadingHistory ? (
          <p className="text-sm text-gray-400">Chargement...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun envoi pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {history.map(c => (
              <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(c.created_at), 'd MMM yyyy à HH:mm', { locale: fr })} - {c.emails.length} destinataire{c.emails.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{c.sent_count} envoyes</span>
                  {c.failed_count > 0 && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">{c.failed_count} echecs</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
