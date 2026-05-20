'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, Mail, Eye, Code, RefreshCw, Upload, Image, Link, History } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Campaign {
  id: string;
  subject: string;
  emails: string[];
  sent_count: number;
  failed_count: number;
  created_at: string;
}

function insertAtCursor(textarea: HTMLTextAreaElement, text: string): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);
  return before + text + after;
}

export default function OutreachAdminPage() {
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [showImgPanel, setShowImgPanel] = useState(false);
  const [history, setHistory] = useState<Campaign[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetch('/api/admin/outreach').then(r => r.json()).then(d => { setHistory(Array.isArray(d) ? d : []); setLoadingHistory(false); }).catch(() => setLoadingHistory(false));
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function insertImg(url: string, alt = '') {
    if (!url.trim()) return;
    const tag = `<img src="${url}" alt="${alt}" style="max-width:100%;display:block;margin:16px auto;border-radius:6px" />`;
    if (textareaRef.current) {
      const newVal = insertAtCursor(textareaRef.current, tag);
      setHtml(newVal);
    } else {
      setHtml(h => h + '\n' + tag);
    }
    setImgUrlInput('');
    setShowImgPanel(false);
    setTab('edit');
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
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-72 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Insérer une image</p>
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
                      <p className="text-[10px] text-gray-400">L'image est insérée au niveau du curseur dans l'éditeur.</p>
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
