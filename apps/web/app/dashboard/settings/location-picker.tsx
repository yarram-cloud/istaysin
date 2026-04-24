'use client';
import { useEffect, useRef, useState } from 'react';

export default function LocationPicker({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const L = (await import('leaflet')).default;
        // @ts-ignore — leaflet CSS has no type declarations; loaded at runtime only
        await import('leaflet/dist/leaflet.css');

        // Fix default icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        if (cancelled || !mapRef.current) return;

        // Only create map once
        if (!mapInstanceRef.current) {
          const map = L.map(mapRef.current).setView([lat, lng], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          const marker = L.marker([lat, lng]).addTo(map);
          markerRef.current = marker;
          mapInstanceRef.current = map;

          map.on('click', (e: any) => {
            marker.setLatLng(e.latlng);
            onChange(e.latlng.lat, e.latlng.lng);
          });
        }

        setReady(true);
      } catch (err: any) {
        console.error('Leaflet init error:', err);
        setError('Map could not be loaded. You can enter coordinates manually below.');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Update marker when lat/lng props change externally
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-surface-100 border border-surface-200 text-center">
        <p className="text-sm text-surface-500 mb-3">{error}</p>
        <div className="flex gap-3 justify-center">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">Latitude</label>
            <input type="number" step="any" value={lat} onChange={(e) => onChange(parseFloat(e.target.value) || 0, lng)} className="input-field w-32 text-center" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">Longitude</label>
            <input type="number" step="any" value={lng} onChange={(e) => onChange(lat, parseFloat(e.target.value) || 0)} className="input-field w-32 text-center" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden mt-4 border border-surface-200 relative z-0">
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-100">
          <p className="text-sm text-surface-400">Loading map...</p>
        </div>
      )}
    </div>
  );
}
