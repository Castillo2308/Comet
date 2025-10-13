import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api';

export interface HotspotPoint {
  id: string | number;
  title: string;
  description?: string;
  lat?: number;
  lng?: number;
  riskLevel?: 'Alto' | 'Medio' | 'Bajo';
}

interface Props {
  apiKey: string;
  points: HotspotPoint[];
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  onUserLocation?: (pos: GeolocationPosition) => void;
  // New optional props for picking a single location
  pickMode?: boolean;
  selected?: { lat?: number; lng?: number };
  onSelect?: (coords: { lat: number; lng: number }) => void;
  height?: number; // default 300
  showAutocomplete?: boolean; // default true
}

const baseContainerStyle: React.CSSProperties = { width: '100%', height: 300, borderRadius: 12 };

// You can color markers by risk if desired

export default function HotspotsMap({ apiKey, points, onPlaceSelected, onUserLocation, pickMode = false, selected, onSelect, height, showAutocomplete = true }: Props) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: apiKey, libraries: ['places'] as any });
  const [center, setCenter] = useState<{lat: number; lng: number}>({ lat: 9.9118, lng: -84.1012 }); // Default: Alajuelita approx.
  const [zoom, setZoom] = useState(13);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleAskLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCenter(c);
      setZoom(15);
      onUserLocation?.(pos);
    });
  }, [onUserLocation]);

  const onLoadAuto = useCallback((ac: google.maps.places.Autocomplete) => {
    autoRef.current = ac;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const ac = autoRef.current; if (!ac) return;
    const place = ac.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setCenter({ lat, lng });
      setZoom(16);
      onPlaceSelected?.(place);
    }
  }, [onPlaceSelected]);

  const markers = useMemo(() => {
    return points.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number');
  }, [points]);

  const containerStyle = useMemo(() => ({ ...baseContainerStyle, height: height ?? baseContainerStyle.height }), [height]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!pickMode || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setCenter({ lat, lng });
    setZoom(16);
    onSelect?.({ lat, lng });
  }, [pickMode, onSelect]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {showAutocomplete ? (
          isLoaded ? (
            <Autocomplete onLoad={onLoadAuto} onPlaceChanged={onPlaceChanged} options={{ fields: ['geometry','place_id','formatted_address','name','plus_code'] as any }}>
              <input className="flex-1 p-2 border rounded" placeholder="Busca un lugar (ej. Parque, escuela, barrio)" />
            </Autocomplete>
          ) : (
            <input disabled className="flex-1 p-2 border rounded bg-gray-100" placeholder="Cargando mapa…" />
          )
        ) : (
          <div className="flex-1" />
        )}
        <button onClick={handleAskLocation} className="px-3 py-2 rounded bg-blue-500 text-white text-sm">Mi ubicación</button>
      </div>
      {isLoaded ? (
        <GoogleMap onClick={handleMapClick} mapContainerStyle={containerStyle} center={center} zoom={zoom} options={{ streetViewControl: false, fullscreenControl: false }}>
          {markers.map((p) => (
            <Marker key={`m-${p.id}`} position={{ lat: p.lat!, lng: p.lng! }} title={p.title} />
          ))}
          {pickMode && selected?.lat !== undefined && selected?.lng !== undefined && (
            <Marker key="selected" position={{ lat: selected.lat, lng: selected.lng }} />
          )}
        </GoogleMap>
      ) : (
        <div className="w-full h-[300px] bg-gray-100 rounded-xl animate-pulse" />
      )}
    </div>
  );
}
