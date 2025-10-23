import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { useGoogleMaps } from './GoogleMapsProvider';

interface RoutePreviewMapProps {
  routeStart: string;
  routeEnd: string;
  height?: number;
  busColor?: string; // Color del bus
  onRouteCalculated?: (waypoints: Array<{ lat: number; lng: number }>) => void;
}

export default function RoutePreviewMap({
  routeStart,
  routeEnd,
  height = 300,
  busColor = '#3B82F6', // Default blue
  onRouteCalculated
}: RoutePreviewMapProps) {
  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    // Create map centered on Costa Rica
    const map = new google.maps.Map(mapRef.current, {
      zoom: 11,
      center: { lat: 9.7489, lng: -83.7534 }, // San José, Costa Rica
      mapTypeControl: true,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map: map,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: busColor, // Use bus color
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
      markerOptions: {
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      },
    });
  }, [isLoaded]);

  // Update polyline color when busColor changes (without recalculating route)
  useEffect(() => {
    if (!directionsRendererRef.current) return;
    
    directionsRendererRef.current.setOptions({
      polylineOptions: {
        strokeColor: busColor,
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });
  }, [busColor]);

  // Calculate route when start/end change
  useEffect(() => {
    if (!isLoaded || !routeStart || !routeEnd || !directionsServiceRef.current || !directionsRendererRef.current) {
      // Clear route if either field is empty
      if (directionsRendererRef.current && (!routeStart || !routeEnd)) {
        directionsRendererRef.current.setDirections({ routes: [] } as any);
      }
      return;
    }

    const calculateRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await directionsServiceRef.current!.route({
          origin: routeStart,
          destination: routeEnd,
          travelMode: google.maps.TravelMode.DRIVING,
          region: 'CR', // Costa Rica
        });

        directionsRendererRef.current!.setDirections(result);

        // Extract waypoints from the route for backend
        if (result.routes.length > 0) {
          const route = result.routes[0];
          const legs = route.legs;
          const waypoints: Array<{ lat: number; lng: number }> = [];

          // Add start point
          if (legs[0]?.start_location) {
            waypoints.push({
              lat: legs[0].start_location.lat(),
              lng: legs[0].start_location.lng(),
            });
          }

          // Add all steps
          for (const leg of legs) {
            for (const step of leg.steps || []) {
              if (step.end_location) {
                waypoints.push({
                  lat: step.end_location.lat(),
                  lng: step.end_location.lng(),
                });
              }
            }
          }

          // Deduplicate waypoints
          const unique = waypoints.filter((w, i, arr) => 
            i === 0 || (w.lat !== arr[i-1].lat || w.lng !== arr[i-1].lng)
          );

          onRouteCalculated?.(unique);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo calcular la ruta';
        setError(message);
        console.error('Route calculation error:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();
  }, [routeStart, routeEnd, onRouteCalculated, isLoaded]);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
      {/* Map container */}
      {isLoaded ? (
        <div
          ref={mapRef}
          style={{ height: `${height}px`, width: '100%' }}
          className="relative bg-gray-100"
        />
      ) : (
        <div
          style={{ height: `${height}px`, width: '100%' }}
          className="relative bg-gray-100 flex items-center justify-center"
        >
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="h-5 w-5 animate-spin" />
            <span className="text-sm">Cargando mapa...</span>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg top-0 left-0">
          <div className="flex items-center gap-2 text-blue-600">
            <Loader className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Calculando ruta...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center z-10 rounded-lg top-0 left-0">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Info footer */}
      {routeStart || routeEnd ? (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
          <div className="text-xs text-gray-600">
            {routeStart && (
              <>
                <strong>📍 Inicio:</strong> {routeStart}
                <br />
              </>
            )}
            {routeEnd && (
              <>
                <strong>📍 Final:</strong> {routeEnd}
              </>
            )}
            {!routeEnd && routeStart && (
              <span className="text-gray-500 italic">Completa el final para ver la ruta...</span>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-xs text-gray-500 italic">
            Ingresa el inicio y final para ver la ruta en el mapa
          </div>
        </div>
      )}
    </div>
  );
}
