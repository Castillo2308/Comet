import { useEffect, useRef } from 'react';

interface DriverRouteMapProps {
  driverLat: number;
  driverLng: number;
  routeStart: string;
  routeEnd: string;
  routeWaypoints?: Array<{ lat: number; lng: number }>;
  displayRoute?: Array<{ lat: number; lng: number }>;
  stage?: 'pickup' | 'route'; // pickup = going to start, route = doing the route
  busNumber?: string;
  busColor?: string; // Bus color for the route
  height?: number;
}

export default function DriverRouteMap({
  driverLat,
  driverLng,
  routeStart,
  routeEnd,
  routeWaypoints = [],
  displayRoute = [],
  stage = 'pickup',
  busNumber = 'Bus',
  busColor = '#3B82F6',
  height = 400,
}: DriverRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const startMarkerRef = useRef<google.maps.Marker | null>(null);
  const endMarkerRef = useRef<google.maps.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: driverLat, lng: driverLng },
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;
  }, []);

  // Update driver location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const position = { lat: driverLat, lng: driverLng };

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current,
        position,
        title: busNumber,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#DC2626',
          strokeWeight: 2,
        },
        label: {
          text: busNumber,
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      });
    } else {
      driverMarkerRef.current.setPosition(position);
    }

    // Center map on driver
    mapInstanceRef.current.setCenter(position);
  }, [driverLat, driverLng, busNumber]);

  // Update route polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !displayRoute || displayRoute.length < 2) return;

    // Remove old polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Create new polyline
    const color = stage === 'pickup' ? '#F59E0B' : busColor; // Orange for pickup, bus color for route
    polylineRef.current = new google.maps.Polyline({
      path: displayRoute,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: mapInstanceRef.current,
    });
  }, [displayRoute, stage]);

  // Update start marker
  useEffect(() => {
    if (!mapInstanceRef.current || !routeWaypoints || routeWaypoints.length === 0) return;

    const startPoint = routeWaypoints[0];
    if (!startPoint) return;

    const position = { lat: startPoint.lat, lng: startPoint.lng };

    if (!startMarkerRef.current) {
      startMarkerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current,
        position,
        title: `Inicio: ${routeStart}`,
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      });
    } else {
      startMarkerRef.current.setPosition(position);
    }
  }, [routeWaypoints, routeStart]);

  // Update end marker
  useEffect(() => {
    if (!mapInstanceRef.current || !routeWaypoints || routeWaypoints.length === 0) return;

    const endPoint = routeWaypoints[routeWaypoints.length - 1];
    if (!endPoint) return;

    const position = { lat: endPoint.lat, lng: endPoint.lng };

    if (!endMarkerRef.current) {
      endMarkerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current,
        position,
        title: `Final: ${routeEnd}`,
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      });
    } else {
      endMarkerRef.current.setPosition(position);
    }
  }, [routeWaypoints, routeEnd]);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height: `${height}px`, width: '100%' }}
        className="relative bg-gray-100"
      />

      {/* Status badge */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="text-sm font-medium text-gray-800">
          {stage === 'pickup' ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                <span>🚌 Yendo al punto de inicio</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">📍 {routeStart}</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span>🚌 En ruta</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                📍 {routeStart} → {routeEnd}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Tu ubicación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500" />
            <span>Punto de inicio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600" />
            <span>Punto final</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-orange-500" />
            <span>Ruta al pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-blue-500" />
            <span>Ruta principal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
