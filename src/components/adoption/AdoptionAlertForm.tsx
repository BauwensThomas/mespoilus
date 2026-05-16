'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';

const ANIMALS = [
  { value: 'tous',    label: 'Tous les animaux' },
  { value: 'chien',   label: 'Chiens' },
  { value: 'chat',    label: 'Chats' },
  { value: 'oiseau',  label: 'Oiseaux' },
  { value: 'rongeur', label: 'Rongeurs' },
  { value: 'reptile', label: 'Reptiles' },
];

const COUNTRIES = [
  'tous',
  'Belgique', 'France', 'Suisse', 'Luxembourg', 'Monaco',
  'Canada (Québec)', 'Haïti',
  'Guadeloupe', 'Martinique', 'La Réunion', 'Guyane française', 'Mayotte',
  'Algérie', 'Maroc', 'Tunisie',
  'Bénin', 'Burkina Faso', 'Burundi', 'Cameroun', 'Comores',
  "Côte d'Ivoire", 'Djibouti', 'Gabon', 'Guinée', 'Madagascar',
  'Mali', 'Maurice', 'Niger', 'Rwanda', 'Sénégal', 'Tchad', 'Togo',
];

const selectCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400';

export default function AdoptionAlertForm() {
  const [open, setOpen]       = useState(false);
  const [email, setEmail]     = useState('');
  const [animal, setAnimal]   = useState('tous');
  const [country, setCountry] = useState('tous');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState<false | 'sent' | 'already'>(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/adoption/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, animal, country }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      setDone(data.already ? 'already' : 'sent');
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 font-medium text-sm"
        aria-label="Recevoir des alertes adoption"
      >
        <Bell size={18} strokeWidth={1.5} />
        <span className="hidden sm:inline">Recevoir des alertes</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Bell size={16} strokeWidth={1.5} className="text-orange-600" />
                </div>
                <h2 className="font-bold text-gray-900">Alertes adoption</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {done ? (
              <div className="text-center py-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${done === 'already' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  <Bell size={24} strokeWidth={1.5} className={done === 'already' ? 'text-blue-600' : 'text-green-600'} />
                </div>
                {done === 'already' ? (
                  <>
                    <p className="font-semibold text-gray-900">Vous êtes déjà inscrit !</p>
                    <p className="text-gray-500 text-sm mt-1">Cette alerte est déjà active pour votre email.</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">Email de confirmation envoyé !</p>
                    <p className="text-gray-500 text-sm mt-1">Vérifiez votre boîte mail pour activer l'alerte.</p>
                  </>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="mt-4 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-5">
                  Recevez un email dès qu'une nouvelle annonce correspond à vos critères.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="votre@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={selectCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Animal</label>
                      <select value={animal} onChange={e => setAnimal(e.target.value)} className={selectCls}>
                        {ANIMALS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Pays</label>
                      <select value={country} onChange={e => setCountry(e.target.value)} className={selectCls}>
                        {COUNTRIES.map(c => (
                          <option key={c} value={c}>{c === 'tous' ? 'Tous les pays' : c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {error && <p className="text-red-600 text-xs">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Envoi…' : "M'alerter"}
                  </button>
                </form>

                <p className="text-xs text-gray-400 text-center mt-3">
                  Un email de confirmation vous sera envoyé. Désabonnement en 1 clic.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
