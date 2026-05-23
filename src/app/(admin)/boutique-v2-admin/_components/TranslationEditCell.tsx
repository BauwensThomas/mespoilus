'use client';

import { useState } from 'react';
import { Pencil, Check, X, Languages, Globe } from 'lucide-react';

interface Props {
  catalogId: string;
  name: string;
  nameFr: string | null;
  description: string | null;
  descriptionFr: string | null;
}

async function saveTranslation(id: string, update: { name_fr?: string | null; description_fr?: string | null }) {
  const res = await fetch('/api/admin/catalog/translation', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...update }),
  });
  if (!res.ok) throw new Error();
}

type Status = 'translated' | 'marked_fr' | 'missing';
function getStatus(current: string | null, original: string | null): Status {
  if (!current) return 'missing';
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  if (norm(current) === norm(original ?? '')) return 'marked_fr';
  return 'translated';
}

interface ModalProps extends Props {
  onClose: () => void;
  onSaved: (nameFr: string | null, descFr: string | null) => void;
}

function TranslationModal({ catalogId, name, nameFr, description, descriptionFr, onClose, onSaved }: ModalProps) {
  const [nameVal, setNameVal] = useState(nameFr ?? '');
  const [descVal, setDescVal] = useState(descriptionFr ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(false);
    try {
      const update: { name_fr?: string | null; description_fr?: string | null } = {
        name_fr: nameVal.trim() || null,
      };
      if (description) update.description_fr = descVal.trim() || null;
      await saveTranslation(catalogId, update);
      onSaved(nameVal.trim() || null, description ? (descVal.trim() || null) : descriptionFr);
      onClose();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Modifier la traduction</h2>
            <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">

          {/* Nom */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Nom du produit</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Globe size={11} /> Original (EN/NL)
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                  {name}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-teal-600 mb-1.5 flex items-center gap-1.5">
                  <Languages size={11} /> Traduction française
                </label>
                <input
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  placeholder={name}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          {description && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Description</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Globe size={11} /> Original (EN/NL)
                  </label>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {description}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-teal-600 mb-1.5 flex items-center gap-1.5">
                    <Languages size={11} /> Traduction française
                  </label>
                  <textarea
                    value={descVal}
                    onChange={e => setDescVal(e.target.value)}
                    rows={5}
                    className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-200">
              Erreur lors de la sauvegarde. Réessaie.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Check size={14} />
            }
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TranslationEditCell({ catalogId, name, nameFr, description, descriptionFr }: Props) {
  const [open, setOpen] = useState(false);
  const [currentNameFr, setCurrentNameFr] = useState(nameFr);
  const [currentDescFr, setCurrentDescFr] = useState(descriptionFr);

  const nameStatus = getStatus(currentNameFr, name);
  const descStatus = description ? getStatus(currentDescFr, description) : null;

  const allTranslated = nameStatus === 'translated' && (descStatus === null || descStatus === 'translated');
  const anyMissing   = nameStatus === 'missing' || descStatus === 'missing';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 mt-1 group"
        title="Modifier la traduction"
      >
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
          allTranslated
            ? 'bg-teal-50 text-teal-600 border-teal-200'
            : anyMissing
            ? 'bg-red-50 text-red-500 border-red-200'
            : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}>
          <Languages size={9} />
          {allTranslated ? 'Traduit' : anyMissing ? 'Non traduit' : 'Déjà FR'}
        </span>
        <Pencil size={10} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
      </button>

      {open && (
        <TranslationModal
          catalogId={catalogId}
          name={name}
          nameFr={currentNameFr}
          description={description}
          descriptionFr={currentDescFr}
          onClose={() => setOpen(false)}
          onSaved={(nf, df) => { setCurrentNameFr(nf); setCurrentDescFr(df); }}
        />
      )}
    </>
  );
}
