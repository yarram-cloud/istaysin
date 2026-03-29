'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AddressResult {
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

interface LocationMapProps {
  lat: number;
  lng: number;
  onLocationSelect: (result: AddressResult) => void;
}

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

async function reverseGeocode(lat: number, lng: number): Promise<AddressResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'istaysin/1.0' } }
    );
    const data = await res.json();
    if (!data?.address) return null;
    const a = data.address;
    return {
      address: data.display_name?.split(',').slice(0, 3).join(',').trim() || '',
      city: a.city || a.town || a.village || a.county || a.state_district || '',
      state: a.state || '',
      pincode: a.postcode || '',
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

export default function LocationMap({ lat, lng, onLocationSelect }: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 5,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { icon: defaultIcon, draggable: true }).addTo(map);

    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      const result = await reverseGeocode(pos.lat, pos.lng);
      if (result) {
        setQuery(result.address);
        onLocationSelect(result);
      }
    });

    map.on('click', async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      map.flyTo(e.latlng, Math.max(map.getZoom(), 15), { duration: 0.5 });
      const result = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      if (result) {
        setQuery(result.address);
        onLocationSelect(result);
      }
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to when lat/lng changes from parent (e.g. "Use My Location")
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
  }, [lat, lng]);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=in&addressdetails=1&limit=5&accept-language=en`,
          { headers: { 'User-Agent': 'istaysin/1.0' } }
        );
        const data = await res.json();
        setSuggestions(data || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  // Select a suggestion
  function selectSuggestion(item: any) {
    const a = item.address || {};
    const result: AddressResult = {
      address: item.display_name?.split(',').slice(0, 3).join(',').trim() || item.display_name || '',
      city: a.city || a.town || a.village || a.county || a.state_district || '',
      state: a.state || '',
      pincode: a.postcode || '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };

    setQuery(result.address);
    setSuggestions([]);
    onLocationSelect(result);

    // Move map
    if (mapRef.current && markerRef.current) {
      const latlng = L.latLng(result.lat, result.lng);
      markerRef.current.setLatLng(latlng);
      mapRef.current.flyTo(latlng, 16, { duration: 0.8 });
    }
  }

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <svg className="absolute left-3 top-3 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search your property address, city, or landmark..."
          className="input-field pl-10 pr-4 py-2.5"
          autoComplete="off"
        />
        {searching && (
          <div className="absolute right-3 top-3">
            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((item, i) => (
              <button
                key={item.place_id || i}
                type="button"
                onClick={() => selectSuggestion(item)}
                className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-surface-100 last:border-0 flex items-start gap-3"
              >
                <svg className="w-4 h-4 mt-0.5 text-primary-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{item.display_name?.split(',').slice(0, 2).join(', ')}</p>
                  <p className="text-xs text-surface-500 truncate">{item.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="h-[280px] rounded-xl border border-surface-200 overflow-hidden"
        style={{ zIndex: 0 }}
      />

      <p className="text-xs text-surface-400 text-center">
        Search above or click on the map to set your property location. Drag the pin to fine-tune.
      </p>
    </div>
  );
}
