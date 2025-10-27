import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, Polyline, useLoadScript, Autocomplete } from '@react-google-maps/api';

export interface HotspotPoint {
  id: string | number;
  title: string;
  description?: string;
  lat?: number;
  lng?: number;
  riskLevel?: 'Alto' | 'Medio' | 'Bajo';
  busNumber?: string;
  busId?: string;
  routeWaypoints?: Array<{lat: number; lng: number}>;
  routeColor?: string;
}

interface Props {
  apiKey: string;
  points: HotspotPoint[];
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  onUserLocation?: (pos: GeolocationPosition) => void;
  // New optional props for picking a single location
  pickMode?: boolean;
  selected?: { lat?: number; lng?: number };
  // Optional selected point id to highlight a specific marker
  selectedId?: string | number;
  onSelect?: (coords: { lat: number; lng: number }) => void;
  height?: number; // default 300
  showAutocomplete?: boolean; // default true
  // Optional custom marker icon for all points (string URL or full Icon)
  markerIcon?: string | google.maps.Icon;
}

const baseContainerStyle: React.CSSProperties = { width: '100%', height: 300, borderRadius: 12 };

// You can color markers by risk if desired

export default function HotspotsMap({ apiKey, points, onPlaceSelected, onUserLocation, pickMode = false, selected, selectedId, onSelect, height, showAutocomplete = true, markerIcon }: Props) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: apiKey, libraries: ['places'] as any });
  const [center, setCenter] = useState<{lat: number; lng: number}>({ lat: 9.9118, lng: -84.1012 }); // Default: Alajuelita approx.
  const [zoom, setZoom] = useState(13);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);
  const selectedRef = useRef<{ lat: number; lng: number } | null>(null);

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

  // Build a google.maps.Icon from a URL when provided, once the API is loaded
  const computedIcon = useMemo(() => {
    if (!markerIcon || !isLoaded) return undefined;
    if (typeof markerIcon === 'string') {
      try {
        return {
          url: markerIcon,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        } as google.maps.Icon;
      } catch {
        return undefined;
      }
    }
    return markerIcon;
  }, [markerIcon, isLoaded]);

  // Recenter map when a new external selected location is provided
  useEffect(() => {
    const hasLat = typeof selected?.lat === 'number';
    const hasLng = typeof selected?.lng === 'number';
    if (hasLat && hasLng) {
      const next = { lat: selected!.lat as number, lng: selected!.lng as number };
      const prev = selectedRef.current;
      if (!prev || prev.lat !== next.lat || prev.lng !== next.lng) {
        setCenter(next);
        setZoom(z => (z < 15 ? 16 : z));
        selectedRef.current = next;
      }
    }
  }, [selected?.lat, selected?.lng]);

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
          {/* Render polylines for routes */}
          {points.map((p) => {
            const hasWaypoints = Array.isArray(p.routeWaypoints) && p.routeWaypoints.length > 0;
            if (!hasWaypoints || !p.routeColor) return null;
            
            // Create polyline path from waypoints
            const path = p.routeWaypoints!.map(wp => ({ lat: wp.lat, lng: wp.lng }));
            
            return (
              <Polyline
                key={`route-${p.id}`}
                path={path}
                options={{
                  strokeColor: p.routeColor,
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  geodesic: true,
                }}
              />
            );
          })}
          
          {markers.map((p) => (
            <Marker
              key={`m-${p.id}`}
              position={{ lat: p.lat!, lng: p.lng! }}
              title={p.title}
              icon={computedIcon}
              animation={selectedId !== undefined && p.id === selectedId ? google.maps.Animation.BOUNCE : undefined}
              zIndex={p.id === selectedId ? 999 : undefined}
              label={p.busNumber ? {
                text: p.busNumber,
                color: '#000',
                fontSize: '11px',
                fontWeight: 'bold',
              } as any : undefined}
            />
          ))}
          {/* Ensure selected location is visible even if not part of markers or when pickMode is active */}
          {(selected?.lat !== undefined && selected?.lng !== undefined && (!selectedId || !markers.some(m => m.id === selectedId))) && (
            <Marker key="selected" position={{ lat: selected.lat!, lng: selected.lng! }} animation={google.maps.Animation.BOUNCE} />
          )}
        </GoogleMap>
      ) : (
        <div className="w-full h-[300px] bg-gray-100 rounded-xl animate-pulse" />
      )}
    </div>
  );
}
