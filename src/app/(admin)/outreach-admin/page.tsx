'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, Mail, RefreshCw, Upload, Image, Link, History, Monitor, Smartphone } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DEFAULT_SUBJECT = 'Proposition de partenariat - Mes Poilus';

const DEFAULT_HTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:system-ui,-apple-system,sans-serif;background:#f0f4f8;padding:20px 0">
  <tr>
    <td align="center" style="padding:20px">

      <table width="860" cellpadding="0" cellspacing="0" border="0" style="max-width:860px;width:100%">

        <!-- En-tete orange -->
        <tr>
          <td bgcolor="#ea580c" style="background-color:#ea580c;padding:36px 40px 32px;border-radius:12px 12px 0 0">
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px">
              <tr>
                <td style="vertical-align:middle;padding-right:10px"><img src="https://ccpkrprfvbgsvobudlam.supabase.co/storage/v1/object/public/partner-logos/logo.jpg" width="40" height="40" alt="Mes Poilus" style="display:block;border:0"></td>
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
            <p style="text-align:center;margin:0 0 8px">
              <a href="https://www.facebook.com/profile.php?id=61589487954538" style="display:inline-block;margin:0 4px;background:#1877f2;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:5px;text-decoration:none">Facebook</a>
              <a href="https://www.instagram.com/mespoilusofficiel/" style="display:inline-block;margin:0 4px;background:#e1306c;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:5px;text-decoration:none">Instagram</a>
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
  html: string;
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
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [showImgPanel, setShowImgPanel] = useState(false);
  const [imgSize, setImgSize] = useState('100%');
  const [history, setHistory] = useState<Campaign[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [articleOptions, setArticleOptions] = useState<{ slug: string; title: string; published_at: string | null }[]>([]);
  const [genTemplate, setGenTemplate] = useState('default');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/outreach').then(r => r.json()).then(d => { setHistory(Array.isArray(d) ? d : []); setLoadingHistory(false); }).catch(() => setLoadingHistory(false));
    fetch('/api/admin/outreach/generate').then(r => r.json()).then(d => setArticleOptions(Array.isArray(d.articles) ? d.articles : [])).catch(() => {});
  }, []);

  async function handleTemplateChange(value: string) {
    setGenTemplate(value);
    setGenError('');
    if (value === 'default') {
      setSubject(DEFAULT_SUBJECT);
      setHtml(DEFAULT_HTML);
      return;
    }
    setGenerating(true);
    try {
      const r = await fetch('/api/admin/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: value }),
      });
      const data = await r.json();
      if (r.ok && data.html) { setSubject(data.subject); setHtml(data.html); }
      else setGenError(data.error ?? 'Échec de la génération');
    } catch { setGenError('Erreur de connexion'); }
    finally { setGenerating(false); }
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cursorPos = useRef({ start: 0, end: 0 });
  const fromPreview = useRef(false);
  const iframeCleanup = useRef<(() => void) | null>(null);
  const lastFocused = useRef<'html' | 'visual'>('visual');
  const htmlHistory = useRef<string[]>([DEFAULT_HTML]);
  const historyIdx = useRef(0);

  function writeIframe(content: string) {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    if (iframeCleanup.current) iframeCleanup.current();
    doc.open(); doc.write(content); doc.close();
    doc.designMode = 'on';

    let selectedEl: HTMLElement | null = null;

    const inputHandler = () => {
      if (selectedEl) { selectedEl.style.outline = ''; selectedEl = null; }
      lastFocused.current = 'visual';
      fromPreview.current = true;
      setHtml(doc.documentElement.outerHTML);
    };

    const clickHandler = (e: Event) => {
      lastFocused.current = 'visual';
      const el = e.target as HTMLElement;
      if (!el || el.tagName === 'HTML' || el.tagName === 'BODY') return;

      if (selectedEl && selectedEl !== el) selectedEl.style.outline = '';
      selectedEl = el;
      el.style.outline = '2px solid #ea580c';

      const textarea = textareaRef.current;
      if (!textarea) return;
      const currentHtml = textarea.value;

      // Chrome normalise les couleurs CSS donc outerHTML ne correspond pas au textarea.
      // On cherche par contenu texte qui lui n'est jamais modifie par le navigateur.
      const trimmed = (el.textContent ?? '').trim();
      let idx = trimmed ? currentHtml.indexOf(trimmed) : -1;

      // Repli : mot le plus long si le texte complet ne correspond pas
      if (idx === -1 && trimmed) {
        const longest = trimmed.split(/\s+/).sort((a, b) => b.length - a.length)[0];
        if (longest && longest.length >= 4) idx = currentHtml.indexOf(longest);
      }
      if (idx === -1) return;

      const tagStart = currentHtml.lastIndexOf('<', idx);
      if (tagStart === -1) return;
      const closeTag = currentHtml.indexOf('</', idx + trimmed.length);
      const tagEnd = closeTag !== -1 ? currentHtml.indexOf('>', closeTag) + 1 : idx + trimmed.length;

      textarea.focus();
      textarea.setSelectionRange(tagStart, Math.max(tagEnd, tagStart + 1));
      // Scroll jusqu'a la selection
      const linesBefore = currentHtml.substring(0, tagStart).split('\n').length;
      textarea.scrollTop = Math.max(0, (linesBefore - 3) * 16);
    };

    doc.addEventListener('input', inputHandler);
    doc.addEventListener('click', clickHandler);
    iframeCleanup.current = () => {
      doc.removeEventListener('input', inputHandler);
      doc.removeEventListener('click', clickHandler);
    };
  }

  function execFormat(cmd: string, value?: string) {
    const textarea = textareaRef.current;

    if (lastFocused.current === 'html' && textarea) {
      // --- Undo textarea ---
      if (cmd === 'undo') {
        if (historyIdx.current > 0) {
          historyIdx.current--;
          const prev = htmlHistory.current[historyIdx.current];
          setHtml(prev);
          const pos = Math.min(cursorPos.current.start, prev.length);
          requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(pos, pos);
          });
        }
        return;
      }
      // --- Insertion de balises dans le textarea ---
      const { start, end } = cursorPos.current;
      const selected = html.substring(start, end);
      const inner = selected || 'TEXTE ICI';
      const FONT_SIZES: Record<string, string> = { '1':'10px','3':'16px','5':'24px','7':'48px' };
      let tag = '';
      if (cmd === 'insertHTML')     tag = value ?? '';
      else if (cmd === 'bold')      tag = `<strong>${inner}</strong>`;
      else if (cmd === 'italic')    tag = `<em>${inner}</em>`;
      else if (cmd === 'underline') tag = `<u>${inner}</u>`;
      else if (cmd === 'foreColor') tag = `<span style="color:${value}">${inner}</span>`;
      else if (cmd === 'fontSize')  tag = `<span style="font-size:${FONT_SIZES[value??'3']??'16px'}">${inner}</span>`;
      else return;
      const next = html.substring(0, start) + tag + html.substring(end);
      const pos = start + tag.length;
      setHtml(next);
      cursorPos.current = { start: pos, end: pos };
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
      });
      return;
    }

    // --- Appliquer dans le visuel (iframe designMode) ---
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    doc.execCommand(cmd, false, value);
    fromPreview.current = true;
    setHtml(doc.documentElement.outerHTML);
  }

  useEffect(() => { writeIframe(html); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fromPreview.current) {
      fromPreview.current = false;
      return;
    }
    const t = setTimeout(() => writeIframe(html), 400);
    return () => clearTimeout(t);
  }, [html]);

  function handleHtmlChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    lastFocused.current = 'html';
    const value = e.target.value;
    let h = htmlHistory.current.slice(0, historyIdx.current + 1);
    // Si l'etat courant n'est pas encore dans l'historique (ex: apres edition visuelle),
    // l'ajouter comme baseline pour que undo revienne a cet etat et pas a DEFAULT_HTML
    if (h[h.length - 1] !== html) h.push(html);
    h.push(value);
    if (h.length > 100) h.shift();
    htmlHistory.current = h;
    historyIdx.current = h.length - 1;
    setHtml(value);
  }

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
    const raw = emailInput.split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'));
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

          {/* Modèle d'email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Modèle d'email</label>
              {generating && (
                <span className="flex items-center gap-1.5 text-xs text-orange-600">
                  <span className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  L'IA rédige…
                </span>
              )}
            </div>

            {/* Deux boutons compacts côte à côte */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { handleTemplateChange('default'); setAiOpen(false); }}
                disabled={generating}
                className={clsx(
                  'text-sm rounded-lg border px-3 py-2 transition-colors disabled:opacity-50',
                  (!aiOpen && genTemplate === 'default')
                    ? 'bg-orange-50 border-orange-300 text-orange-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                )}
              >
                Partenariat général
              </button>
              <button
                type="button"
                onClick={() => setAiOpen(v => !v)}
                disabled={generating || articleOptions.length === 0}
                className={clsx(
                  'flex items-center justify-center gap-1.5 text-sm rounded-lg border px-3 py-2 transition-colors disabled:opacity-50',
                  (aiOpen || genTemplate !== 'default')
                    ? 'bg-orange-50 border-orange-300 text-orange-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                )}
              >
                Email IA pour un article
                <span className="text-gray-400 text-xs">{aiOpen ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* Liste déroulante (ouverte au clic sur "Email IA") */}
            {aiOpen && (
              <div className="mt-2 rounded-lg border border-gray-200 p-2 bg-white shadow-sm">
                <input
                  type="text"
                  value={modelSearch}
                  onChange={e => setModelSearch(e.target.value)}
                  placeholder="Rechercher un article…"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs mb-1.5 focus:outline-none focus:border-orange-400"
                />
                <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                  {articleOptions
                    .filter(a => a.title.toLowerCase().includes(modelSearch.trim().toLowerCase()))
                    .map(a => (
                      <button
                        key={a.slug}
                        type="button"
                        onClick={() => { handleTemplateChange(a.slug); setAiOpen(false); }}
                        disabled={generating}
                        className={clsx(
                          'w-full text-left rounded-md px-2 py-1.5 transition-colors disabled:opacity-50',
                          genTemplate === a.slug
                            ? 'bg-orange-100 text-orange-700'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex-1 text-xs line-clamp-1">{a.title}</span>
                          {a.published_at && (
                            <span className="text-[11px] text-gray-900 whitespace-nowrap flex-shrink-0">
                              {format(new Date(a.published_at), 'd MMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  {articleOptions.filter(a => a.title.toLowerCase().includes(modelSearch.trim().toLowerCase())).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">Aucun résultat</p>
                  )}
                </div>
              </div>
            )}
            {genError && <p className="text-xs text-red-600 mt-1">{genError}</p>}
            <p className="text-[11px] text-gray-400 mt-1">
              L'IA rédige l'email, tu le relis puis tu ajoutes les destinataires.
            </p>
          </div>

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
                          {[{ label: 'Pleine', value: '100%' }, { label: '200px', value: '200px' }, { label: '300px', value: '300px' }].map(opt => (
                            <button key={opt.value} type="button" onClick={() => setImgSize(opt.value)}
                              className={`flex-1 text-[11px] py-1 px-1 rounded-md border transition-colors ${imgSize === opt.value ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
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
              </div>
            </div>

            {/* Barre de formatage visuel */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg mb-2 flex-wrap">
              <button type="button" title="Annuler (Ctrl+Z)"
                onMouseDown={e => { e.preventDefault(); execFormat('undo'); }}
                className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded transition-colors">&#8617;</button>
              <button type="button" title="Inserer un paragraphe"
                onMouseDown={e => { e.preventDefault(); execFormat('insertHTML', '<p>TEXTE ICI</p>'); }}
                className="px-2 py-1 text-xs font-mono text-gray-700 hover:bg-gray-200 rounded transition-colors">&lt;p&gt;</button>
              <button type="button" title="Saut de ligne"
                onMouseDown={e => { e.preventDefault(); execFormat('insertHTML', '<br>'); }}
                className="px-2 py-1 text-xs font-mono text-gray-700 hover:bg-gray-200 rounded transition-colors">&lt;br&gt;</button>
              <button type="button" title="Inserer un lien"
                onMouseDown={e => { e.preventDefault(); execFormat('insertHTML', '<a href="">TEXTE ICI</a>'); }}
                className="px-2 py-1 text-xs font-mono text-gray-700 hover:bg-gray-200 rounded transition-colors">&lt;a&gt;</button>
              <div className="w-px h-5 bg-gray-300 mx-0.5" />
              <button type="button" title="Gras"
                onMouseDown={e => { e.preventDefault(); execFormat('bold'); }}
                className="px-2 py-1 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded transition-colors">B</button>
              <button type="button" title="Italique"
                onMouseDown={e => { e.preventDefault(); execFormat('italic'); }}
                className="px-2 py-1 text-sm italic text-gray-700 hover:bg-gray-200 rounded transition-colors">I</button>
              <button type="button" title="Souligne"
                onMouseDown={e => { e.preventDefault(); execFormat('underline'); }}
                className="px-2 py-1 text-sm underline text-gray-700 hover:bg-gray-200 rounded transition-colors">U</button>
              <div className="w-px h-5 bg-gray-300 mx-0.5" />
              <select title="Taille"
                onMouseDown={e => e.stopPropagation()}
                onChange={e => { execFormat('fontSize', e.target.value); (e.target as HTMLSelectElement).value = ''; }}
                value=""
                className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-700 bg-white">
                <option value="" disabled>Taille</option>
                <option value="1">Petit</option>
                <option value="3">Normal</option>
                <option value="5">Grand</option>
                <option value="7">Tres grand</option>
              </select>
              <div className="w-px h-5 bg-gray-300 mx-0.5" />
              {[['#374151','Gris fonce'],['#6b7280','Gris'],['#9ca3af','Gris clair'],['#ea580c','Orange'],['#ffffff','Blanc'],['#000000','Noir']].map(([color, label]) => (
                <button key={color} type="button" title={label}
                  onMouseDown={e => { e.preventDefault(); execFormat('foreColor', color); }}
                  className="w-5 h-5 rounded-full border border-gray-300 hover:scale-110 transition-transform flex-shrink-0"
                  style={{ backgroundColor: color }} />
              ))}
              <div className="w-px h-5 bg-gray-300 mx-0.5" />
              <label title="Couleur personnalisee" className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input type="color" defaultValue="#374151"
                  onChange={e => execFormat('foreColor', e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
                Autre
              </label>
            </div>

            {/* Toggle desktop/mobile au-dessus de l'apercu */}
            <div className="flex items-center justify-end mb-1.5">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button type="button" onClick={() => setPreviewMode('desktop')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${previewMode === 'desktop' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Monitor size={13} strokeWidth={1.5} /> Ordi
                </button>
                <button type="button" onClick={() => setPreviewMode('mobile')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${previewMode === 'mobile' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Smartphone size={13} strokeWidth={1.5} /> Mobile
                </button>
              </div>
            </div>

            {/* Split : éditeur gauche + apercu droite */}
            <div className="flex gap-3" style={{ height: '680px' }}>
              <textarea
                ref={textareaRef}
                value={html}
                onChange={handleHtmlChange}
                onSelect={saveCursor}
                onBlur={saveCursor}
                onKeyUp={saveCursor}
                placeholder={'<div style="...">\n  ...\n</div>'}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-orange-400 resize-none"
              />
              <div
                className={`flex-1 border border-gray-200 rounded-lg overflow-hidden ${previewMode === 'mobile' ? 'bg-gray-100 flex justify-center py-4' : ''}`}
                style={{ display: previewMode === 'desktop' ? 'flex' : undefined, flexDirection: 'column' }}
              >
                <iframe
                  ref={iframeRef}
                  className="border-0 bg-white"
                  title="Apercu editable"
                  style={previewMode === 'mobile'
                    ? { width: '390px', height: '640px', flexShrink: 0, borderRadius: '8px' }
                    : { flex: 1, borderRadius: '0.5rem' }}
                />
              </div>
            </div>
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


      </div>

      {/* Historique */}
      <div className="border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={() => setHistoryOpen(v => !v)}
          className="flex items-center gap-2 mb-4 w-full text-left hover:text-orange-600 transition-colors"
        >
          <History size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Historique des envois</h2>
          {history.length > 0 && <span className="text-xs text-gray-400">({history.length})</span>}
          <span className="ml-auto text-gray-400 text-xs">{historyOpen ? '▲ Fermer' : '▼ Ouvrir'}</span>
        </button>
        {historyOpen && (<>
        {history.length > 0 && (
          <input
            type="text"
            value={historySearch}
            onChange={e => setHistorySearch(e.target.value)}
            placeholder="Rechercher dans l'historique (objet)…"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm mb-3 focus:outline-none focus:border-orange-400"
          />
        )}
        {loadingHistory ? (
          <p className="text-sm text-gray-400">Chargement...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun envoi pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {history.filter(c => c.subject.toLowerCase().includes(historySearch.trim().toLowerCase())).length === 0 && (
              <p className="text-sm text-gray-400">Aucun résultat pour « {historySearch} ».</p>
            )}
            {history.filter(c => c.subject.toLowerCase().includes(historySearch.trim().toLowerCase())).map(c => (
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
                  <button
                    type="button"
                    title="Recharger ce mail (objet + visuel + destinataires) pour le renvoyer"
                    onClick={() => {
                      setSubject(c.subject);
                      setHtml(c.html ?? '');
                      setEmails([]);          // destinataires vides → on ajoute les nouveaux
                      setGenTemplate('');
                      setAiOpen(false);       // liste article fermée
                      setModelSearch('');
                      setResult(null);
                      setConfirmOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:border-orange-300 px-2.5 py-0.5 rounded-full font-medium transition-colors"
                  >Réutiliser</button>
                  <button
                    type="button"
                    title="Telecharger le rapport JSON"
                    onClick={() => {
                      const report = {
                        subject: c.subject,
                        sent_at: c.created_at,
                        sent_count: c.sent_count,
                        failed_count: c.failed_count,
                        emails: c.emails,
                      };
                      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `campagne-${c.id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-xs text-gray-400 hover:text-orange-500 border border-gray-200 hover:border-orange-300 px-2 py-0.5 rounded-full transition-colors"
                  >JSON</button>
                  <button
                    type="button"
                    title="Telecharger le visuel HTML"
                    onClick={() => {
                      const blob = new Blob([c.html ?? ''], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `campagne-${c.id}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-xs text-gray-400 hover:text-orange-500 border border-gray-200 hover:border-orange-300 px-2 py-0.5 rounded-full transition-colors"
                  >HTML</button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>)}
      </div>

    </div>
  );
}
