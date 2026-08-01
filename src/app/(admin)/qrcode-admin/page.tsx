'use client';

import { useState, useEffect } from 'react';
import { QrCode, MapPin, Globe2, Download } from 'lucide-react';

interface Scan {
  id: string;
  scanned_at: string;
  user_agent: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  language: string | null;
  campaign: string;
}

interface Stats {
  total: number;
  last30Days: number;
  byCity: { label: string; count: number }[];
  byCountry: { label: string; count: number }[];
  recent: Scan[];
}

// Détection simple navigateur/OS à partir du user-agent, purement pour l'affichage
// (aucune donnée supplémentaire collectée, on ne fait que relire ce qui est déjà stocké).
function parseUserAgent(ua: string | null) {
  if (!ua) return { browser: 'Inconnu', os: 'Inconnu' };
  const browser =
    /Edg\//.test(ua) ? 'Edge' :
    /Chrome\//.test(ua) ? 'Chrome' :
    /Firefox\//.test(ua) ? 'Firefox' :
    /Safari\//.test(ua) && !/Chrome/.test(ua) ? 'Safari' :
    'Autre';
  const os =
    /Windows/.test(ua) ? 'Windows' :
    /Android/.test(ua) ? 'Android' :
    /iPhone|iPad|iOS/.test(ua) ? 'iOS' :
    /Mac OS/.test(ua) ? 'macOS' :
    /Linux/.test(ua) ? 'Linux' :
    'Inconnu';
  return { browser, os };
}

export default function QrcodeAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/qrcode-stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stats QR Code</h1>
          <p className="text-gray-500 text-base mt-1">Scans de la carte de visite physique (campagne presentoir_2026)</p>
        </div>
        <a
          href="/api/admin/qrcode-download"
          download
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
        >
          <Download size={16} strokeWidth={1.5} />
          Télécharger QR Code
        </a>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Chargement…</div>
      ) : !stats ? (
        <div className="py-16 text-center text-gray-400 text-sm">Erreur de chargement</div>
      ) : (
        <>
          {/* Cartes résumé */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                <QrCode size={20} className="text-orange-600" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">Scans au total</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <Globe2 size={20} className="text-blue-600" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.last30Days}</div>
                <div className="text-xs text-gray-500">Scans (30 derniers jours)</div>
              </div>
            </div>
          </div>

          {/* Répartitions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5"><MapPin size={14} /> Par ville</h2>
              {stats.byCity.length === 0 ? (
                <p className="text-xs text-gray-400">Aucune donnée</p>
              ) : (
                <ul className="space-y-1.5">
                  {stats.byCity.slice(0, 8).map(c => (
                    <li key={c.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{c.label}</span>
                      <span className="font-medium text-gray-900">{c.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5"><Globe2 size={14} /> Par pays</h2>
              {stats.byCountry.length === 0 ? (
                <p className="text-xs text-gray-400">Aucune donnée</p>
              ) : (
                <ul className="space-y-1.5">
                  {stats.byCountry.slice(0, 8).map(c => (
                    <li key={c.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{c.label}</span>
                      <span className="font-medium text-gray-900">{c.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Scans récents */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Scans récents</h2>
            </div>
            {stats.recent.length === 0 ? (
              <div className="py-16 text-center">
                <QrCode size={32} strokeWidth={1.5} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucun scan pour l&apos;instant</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Ville</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Région</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Pays</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Langue</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Navigateur</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recent.map(s => {
                    const { browser, os } = parseUserAgent(s.user_agent);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">
                          {new Date(s.scanned_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">{s.city ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{s.region ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{s.country ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{s.language ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{browser}</td>
                        <td className="px-4 py-2.5 text-gray-700">{os}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
