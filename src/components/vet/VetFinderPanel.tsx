'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import { Stethoscope, X, Search, ChevronRight, Star, AlertCircle, MapPin, LocateFixed } from 'lucide-react';

declare global {
  interface Window { google?: typeof google; }
}

const RADIUS_OPTIONS = [5, 10, 20, 50] as const;



interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

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

async function nominatimSearch(query: string, limit = 5): Promise<Suggestion[]> {
  const params = new URLSearchParams({ q: query, format: 'json', limit: String(limit), addressdetails: '0' });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'fr', 'User-Agent': 'MesPoilus/1.0' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function VetFinderPanel() {
  const [open, setOpen]                       = useState(false);
  const [mapReady, setMapReady]               = useState(false);
  const [radius, setRadius]                   = useState(10);
  const [results, setResults]                 = useState<VetResult[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [geoLoading, setGeoLoading]           = useState(false);
  const [address, setAddress]                 = useState('');
  const [suggestions, setSuggestions]         = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstance    = useRef<google.maps.Map | null>(null);
  const locationRef    = useRef<{ lat: number; lng: number } | null>(null);
  const markersRef     = useRef<google.maps.Marker[]>([]);
  const circleRef      = useRef<google.maps.Circle | null>(null);
  const mapInitialized = useRef(false);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputWrapRef   = useRef<HTMLDivElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!open || mapInitialized.current) return;
    const tryInit = () => {
      if (!window.google?.maps || !mapRef.current) return false;
      mapInitialized.current = true;
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 50.5, lng: 4.4 },
        zoom: 7,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      setMapReady(true);
      return true;
    };
    if (tryInit()) return;
    const interval = setInterval(() => { if (tryInit()) clearInterval(interval); }, 300);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputWrapRef.current && !inputWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clearOverlays = useCallback(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    circleRef.current?.setMap(null);
    circleRef.current = null;
  }, []);

  function handleAddressChange(val: string) {
    setAddress(val);
    locationRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      const data = await nominatimSearch(val);
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    }, 600);
  }

  function handleSelectSuggestion(s: Suggestion) {
    const label = s.display_name.split(',').slice(0, 3).join(',').trim();
    setAddress(label);
    locationRef.current = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setSuggestions([]);
    setShowSuggestions(false);
    if (mapInstance.current) {
      mapInstance.current.setCenter(locationRef.current!);
      mapInstance.current.setZoom(13);
    }
  }

  function handleGeolocate() {
    if (!navigator.geolocation) { setError('Geolocalisation non supportee.'); return; }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setAddress('Ma position GPS');
        if (mapInstance.current) {
          mapInstance.current.setCenter(locationRef.current!);
          mapInstance.current.setZoom(13);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Acces refuse. Autorisez la localisation ou entrez votre adresse.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Position GPS indisponible. Entrez votre adresse.');
        } else {
          setError('Delai depasse. Reessayez.');
        }
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }

  async function handleSearch() {
    if (!mapInstance.current || !address.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    clearOverlays();

    let coords = locationRef.current;

    if (!coords) {
      try {
        const data = await nominatimSearch(address, 1);
        if (data.length) coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      } catch { coords = null; }
      if (!coords) {
        setLoading(false);
        setError('Adresse introuvable. Selectionnez une suggestion ou soyez plus precis.');
        return;
      }
    }

    const { lat, lng } = coords;
    locationRef.current = { lat, lng };
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

    const keyword = 'veterinaire';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new (google.maps.places as any).PlacesService(mapInstance.current);
    service.nearbySearch(
      { location: center, radius: radius * 1000, type: 'veterinary_care', keyword },
      (places: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setError(`Aucun veterinaire trouve dans ${radius} km.`);
          return;
        }
        if (status !== google.maps.places.PlacesServiceStatus.OK || !places) {
          setError(`Erreur (${status}). Verifiez que Places API est activee.`);
          return;
        }
        const vets: VetResult[] = places.map(p => ({
          name:         p.name ?? 'Veterinaire',
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

  const canSearch = mapReady && address.trim().length > 0;

  return (
    <>
      {apiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`}
          strategy="afterInteractive"
        />
      )}

      {/* Tab lateral */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Trouver un veterinaire"
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-l-xl shadow-lg transition-all duration-300 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="flex flex-col items-center gap-2 px-2.5 py-5">
          <Stethoscope size={16} strokeWidth={1.5} />
          <span className="text-[11px] font-semibold tracking-wide" style={{ writingMode: 'vertical-rl' }}>
            Veterinaire
          </span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/25 z-40 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: 'clamp(320px, 40vw, 600px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-blue-600 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Stethoscope size={15} strokeWidth={1.5} />
            <h2 className="text-sm font-bold">Trouver un veterinaire</h2>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-blue-700 transition-colors">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {!apiKey ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <AlertCircle size={36} strokeWidth={1} className="text-amber-400" />
            <p className="text-sm font-semibold text-gray-700">Cle Google Maps manquante</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {/* Formulaire */}
            <div className="px-3 py-2 space-y-1.5 border-b border-gray-100">

              {/* GPS + Rayon */}
              <div className="flex gap-1">
                <button
                  onClick={handleGeolocate}
                  disabled={geoLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all disabled:opacity-50 shrink-0 text-xs whitespace-nowrap"
                >
                  {geoLoading
                    ? <span className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    : <LocateFixed size={12} strokeWidth={1.5} />
                  }
                  {geoLoading ? 'Localisation...' : 'Ma position'}
                </button>
                <select
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  {RADIUS_OPTIONS.map(r => <option key={r} value={r}>Rayon : {r} km</option>)}
                </select>
              </div>

              {/* Adresse avec autocomplete */}
              <div className="relative" ref={inputWrapRef}>
                <div className="flex gap-1">
                  <div className="flex-1 relative">
                    <MapPin size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={address}
                      onChange={e => handleAddressChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && canSearch) { setShowSuggestions(false); handleSearch(); } }}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Entrez votre adresse..."
                      autoComplete="off"
                      className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onMouseDown={e => { e.preventDefault(); handleSelectSuggestion(s); }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-50 last:border-0 transition-colors flex items-start gap-1.5"
                      >
                        <MapPin size={10} className="text-gray-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                        <span className="line-clamp-2">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSearch}
                disabled={!canSearch || loading}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                {loading
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Search size={12} strokeWidth={2} />
                }
                {loading ? 'Recherche...' : !mapReady ? 'Chargement carte...' : 'Rechercher'}
              </button>

              {error && (
                <p className="text-[11px] text-red-500 flex items-start gap-1 leading-tight">
                  <AlertCircle size={11} className="shrink-0 mt-0.5" /> {error}
                </p>
              )}
            </div>

            {/* Carte */}
            <div className="px-3 py-2">
              <div className="relative w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: '190px' }}>
                <div ref={mapRef} className="w-full h-full" />
                {!mapReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <span className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Resultats */}
            {results.length > 0 ? (
              <div className="px-3 py-1.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-0.5">
                  {results.length} veterinaire{results.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-1">
                  {results.map((vet, i) => (
                    <a
                      key={vet.placeId}
                      href={`https://www.google.com/maps/place/?q=place_id:${vet.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{vet.name}</p>
                        <p className="text-[11px] text-gray-500 leading-tight truncate">{vet.address}</p>
                        {(vet.rating || vet.isOpen !== undefined) && (
                          <div className="flex items-center gap-2">
                            {vet.rating && (
                              <div className="flex items-center gap-0.5">
                                <Star size={9} className="text-yellow-500 fill-yellow-500" />
                                <span className="text-[10px] text-yellow-600 font-medium">{vet.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {vet.isOpen === true && <span className="text-[10px] text-green-600 font-medium">Ouvert</span>}
                            {vet.isOpen === false && <span className="text-[10px] text-red-500">Ferme</span>}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={11} className="text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              !loading && !error && (
                <div className="px-5 py-6 text-center">
                  <MapPin size={24} strokeWidth={1} className="mx-auto mb-1.5 text-gray-200" />
                  <p className="text-xs text-gray-400">Entrez une adresse ou utilisez votre position GPS</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}
