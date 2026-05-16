'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import { Stethoscope, X, MapPin, Search, ChevronRight, Star, AlertCircle } from 'lucide-react';

const RADIUS_OPTIONS = [5, 10, 20, 50] as const;

const ANIMALS = [
  { value: 'tous',    label: 'Tous animaux' },
  { value: 'chien',   label: 'Chien' },
  { value: 'chat',    label: 'Chat' },
  { value: 'oiseau',  label: 'Oiseau / NAC' },
  { value: 'rongeur', label: 'Rongeur' },
  { value: 'reptile', label: 'Reptile' },
] as const;

interface VetResult {
  name: string;
  address: string;
  rating?: number;
  ratingsTotal?: number;
  placeId: string;
  lat: number;
  lng: number;
  isOpen?: boolean;
}

export default function VetFinderPanel() {
  const [open, setOpen]               = useState(false);
  const [animal, setAnimal]           = useState('tous');
  const [radius, setRadius]           = useState(10);
  const [results, setResults]         = useState<VetResult[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [mapsReady, setMapsReady]     = useState(false);

  const mapRef         = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const mapInstance    = useRef<google.maps.Map | null>(null);
  const locationRef    = useRef<{ lat: number; lng: number } | null>(null);
  const markersRef     = useRef<google.maps.Marker[]>([]);
  const circleRef      = useRef<google.maps.Circle | null>(null);
  const mapInitialized = useRef(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Initialiser carte + autocomplete après ouverture du panel (attend que le SDK soit prêt)
  const initMap = useCallback(() => {
    if (!open || !mapsReady || mapInitialized.current) return;
    if (!mapRef.current || !inputRef.current) return;

    mapInitialized.current = true;

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: { lat: 46.8, lng: 2.3 },
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['geometry', 'formatted_address'],
      componentRestrictions: { country: ['fr', 'be', 'ch', 'lu'] },
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (place.geometry?.location) {
        locationRef.current = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setHasLocation(true);
      }
    });
  }, [open, mapsReady]);

  useEffect(() => { initMap(); }, [initMap]);

  const clearOverlays = useCallback(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    circleRef.current?.setMap(null);
    circleRef.current = null;
  }, []);

  function handleSearch() {
    if (!locationRef.current || !mapInstance.current) return;
    setLoading(true);
    setError(null);
    setResults([]);
    clearOverlays();

    const { lat, lng } = locationRef.current;
    const center = new google.maps.LatLng(lat, lng);

    mapInstance.current.setCenter(center);
    mapInstance.current.setZoom(13);

    circleRef.current = new google.maps.Circle({
      map: mapInstance.current,
      center,
      radius: radius * 1000,
      strokeColor: '#2563eb',
      strokeOpacity: 0.3,
      strokeWeight: 2,
      fillColor: '#2563eb',
      fillOpacity: 0.05,
    });

    const keyword = animal !== 'tous' ? `vétérinaire ${animal}` : 'vétérinaire';
    const service = new google.maps.places.PlacesService(mapInstance.current);

    service.nearbySearch(
      { location: center, radius: radius * 1000, type: 'veterinary_care', keyword },
      (places, status) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setError(`Aucun vétérinaire dans un rayon de ${radius} km.`);
          return;
        }
        if (status !== google.maps.places.PlacesServiceStatus.OK || !places) {
          setError('Erreur lors de la recherche. Réessayez.');
          return;
        }

        const vets: VetResult[] = places.map(p => ({
          name:         p.name ?? 'Vétérinaire',
          address:      p.vicinity ?? '',
          rating:       p.rating,
          ratingsTotal: p.user_ratings_total,
          placeId:      p.place_id ?? '',
          lat:          p.geometry!.location!.lat(),
          lng:          p.geometry!.location!.lng(),
          isOpen:       p.opening_hours?.isOpen?.(),
        }));
        setResults(vets);

        const bounds = new google.maps.LatLngBounds();
        vets.forEach((vet, i) => {
          const pos = { lat: vet.lat, lng: vet.lng };
          bounds.extend(pos);
          const marker = new google.maps.Marker({
            map: mapInstance.current!,
            position: pos,
            title: vet.name,
            label: { text: String(i + 1), color: 'white', fontSize: '11px', fontWeight: 'bold' },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 13,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
          markersRef.current.push(marker);
        });

        if (vets.length > 1) mapInstance.current!.fitBounds(bounds);
      },
    );
  }

  return (
    <>
      {/* Chargement SDK Google Maps (une seule fois, non bloquant) */}
      {apiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`}
          onLoad={() => setMapsReady(true)}
        />
      )}

      {/* Tab latéral bleu */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Trouver un vétérinaire"
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-l-xl shadow-lg transition-all duration-300 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="flex flex-col items-center gap-2 px-2.5 py-5">
          <Stethoscope size={16} strokeWidth={1.5} />
          <span
            className="text-[11px] font-semibold tracking-wide"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Vétérinaire
          </span>
        </div>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/25 z-40 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: 'clamp(380px, 40vw, 600px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-blue-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <Stethoscope size={18} strokeWidth={1.5} />
            <div>
              <h2 className="text-sm font-bold">Trouver un vétérinaire</h2>
              <p className="text-blue-200 text-[11px]">Autour de votre adresse</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Si pas de clé API */}
        {!apiKey ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <AlertCircle size={36} strokeWidth={1} className="text-amber-400" />
            <p className="text-sm font-semibold text-gray-700">Clé Google Maps manquante</p>
            <p className="text-xs text-gray-400">
              Ajoutez <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> dans .env.local
            </p>
          </div>
        ) : (
          <>
            {/* Formulaire */}
            <div className="px-5 py-4 space-y-3 shrink-0 border-b border-gray-100">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Votre adresse
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ex : 12 rue de la Paix, Paris"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Animal
                  </label>
                  <select
                    value={animal}
                    onChange={e => setAnimal(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    {ANIMALS.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Rayon
                  </label>
                  <select
                    value={radius}
                    onChange={e => setRadius(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    {RADIUS_OPTIONS.map(r => (
                      <option key={r} value={r}>{r} km</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={!hasLocation || loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Search size={14} strokeWidth={2} />
                }
                {loading ? 'Recherche...' : 'Rechercher'}
              </button>

              {error && (
                <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </div>

            {/* Carte */}
            <div ref={mapRef} className="w-full shrink-0" style={{ height: '240px' }} />

            {/* Résultats */}
            <div className="flex-1 overflow-y-auto">
              {results.length > 0 ? (
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {results.length} vétérinaire{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                  </p>
                  {results.map((vet, i) => (
                    <a
                      key={vet.placeId}
                      href={`https://www.google.com/maps/place/?q=place_id:${vet.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{vet.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{vet.address}</p>
                        {vet.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={11} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-yellow-600 font-medium">{vet.rating.toFixed(1)}</span>
                            {vet.ratingsTotal && (
                              <span className="text-xs text-gray-400">({vet.ratingsTotal})</span>
                            )}
                          </div>
                        )}
                        {vet.isOpen === true && (
                          <span className="text-[10px] text-green-600 font-medium">Ouvert maintenant</span>
                        )}
                        {vet.isOpen === false && (
                          <span className="text-[10px] text-red-500 font-medium">Fermé</span>
                        )}
                      </div>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors mt-1" />
                    </a>
                  ))}
                </div>
              ) : (
                !loading && !error && (
                  <div className="px-5 py-10 text-center">
                    <MapPin size={32} strokeWidth={1} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-400">Entrez votre adresse et lancez la recherche</p>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
