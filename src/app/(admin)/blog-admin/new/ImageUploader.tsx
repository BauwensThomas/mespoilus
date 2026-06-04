'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Copy, Check, X } from 'lucide-react';

export default function ImageUploader() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [snippet, setSnippet] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    setError('');
    setSnippet('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.url) throw new Error(data.error ?? 'Erreur upload');
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setSnippet(
        `<figure style="margin:2rem 0;text-align:center">\n  <img src="${data.url}" alt="${alt}" style="width:100%;max-width:600px;display:block;margin:0 auto;border-radius:12px" />\n</figure>`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
      <p className="text-xs font-medium text-gray-600">Insérer une image dans le contenu</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50"
      >
        {uploading
          ? <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          : <ImagePlus size={13} strokeWidth={1.5} />}
        {uploading ? 'Upload en cours…' : 'Uploader une image'}
      </button>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}

      {snippet && (
        <div className="space-y-2">
          <div className="relative">
            <textarea
              readOnly
              value={snippet}
              rows={4}
              className="w-full font-mono text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 resize-none focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copié !' : 'Copier le code'}
          </button>
          <p className="text-[11px] text-gray-400">Colle ce code dans le contenu à l'endroit voulu.</p>
        </div>
      )}
    </div>
  );
}
