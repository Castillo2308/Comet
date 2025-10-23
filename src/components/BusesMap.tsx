import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';

export interface BusPoint {
  _id?: string;
  id?: string | number;
  busNumber?: string;
  busId?: string;
  lat?: number;
  lng?: number;
  routeWaypoints?: Array<{ lat: number; lng: number }>;
  displayRoute?: Array<{ lat: number; lng: number }>;
  routeStart?: string;
  routeEnd?: string;
  routeColor?: string;
  stage?: 'pickup' | 'route';
  duration?: string; // Estimated travel time
  [key: string]: any;
}

interface Props {
  buses: BusPoint[];
  selectedBusId?: string | number | null;
  onSelectBus?: (busId: string | number) => void;
  height?: number;
  onDurationUpdate?: (busId: string, duration: string) => void;
}

const baseContainerStyle: React.CSSProperties = { width: '100%', height: 300, borderRadius: 12 };

export default function BusesMap({ buses, selectedBusId, onSelectBus, height = 360, onDurationUpdate }: Props) {
  const { isLoaded } = useGoogleMaps();
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 9.9118, lng: -84.1012 });
  const [zoom, setZoom] = useState(13);
  const selectedRef = useRef<string | number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const routePolylinesRef = useRef<Map<string, { completed: google.maps.Polyline; pending: google.maps.Polyline }>>(new Map());
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const startEndMarkersRef = useRef<Map<string, { routeStart: google.maps.Marker; end: google.maps.Marker }>>(new Map());
  const routeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter buses with valid coordinates
  const validBuses = useMemo(() => {
    return buses.filter(b => typeof b.lat === 'number' && typeof b.lng === 'number');
  }, [buses]);

  // Helper function to find the closest point on the route to the bus location
  const findClosestPointOnRoute = (routePath: google.maps.LatLng[], busPosition: google.maps.LatLng): { index: number; distance: number } => {
    let closestIndex = 0;
    let minDistance = google.maps.geometry.spherical.computeDistanceBetween(busPosition, routePath[0]);

    for (let i = 1; i < routePath.length; i++) {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(busPosition, routePath[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return { index: closestIndex, distance: minDistance };
  };

  // Function to create route polylines with progress indication
  const createRoutePolylines = useCallback((bus: BusPoint, routeResult: google.maps.DirectionsResult) => {
    const busId = bus._id || bus.id;
    if (!busId || !routeResult.routes?.[0]?.overview_path) return;

    const busIdStr = String(busId);
    const busColor = bus.routeColor || '#3B82F6';
    const routePath = routeResult.routes[0].overview_path;

    // Remove existing polylines
    const existingPolylines = routePolylinesRef.current.get(busIdStr);
    if (existingPolylines) {
      existingPolylines.completed.setMap(null);
      existingPolylines.pending.setMap(null);
    }

    // Find closest point on route to current bus position
    const busPosition = new google.maps.LatLng(bus.lat!, bus.lng!);
    const { index: closestIndex } = findClosestPointOnRoute(routePath, busPosition);

    // Split route into completed and pending parts
    const completedPath = routePath.slice(0, closestIndex + 1);
    const pendingPath = routePath.slice(closestIndex);

    // Create completed route polyline (dark gray)
    const completedPolyline = new google.maps.Polyline({
      path: completedPath,
      geodesic: true,
      strokeColor: '#374151', // Dark gray for completed
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map: mapRef.current,
    });

    // Create pending route polyline (bus color)
    const pendingPolyline = new google.maps.Polyline({
      path: pendingPath,
      geodesic: true,
      strokeColor: busColor,
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map: mapRef.current,
    });

    routePolylinesRef.current.set(busIdStr, {
      completed: completedPolyline,
      pending: pendingPolyline
    });

    console.log(`[BusesMap] Created route polylines for bus ${busIdStr}: completed=${completedPath.length} points, pending=${pendingPath.length} points`);
  }, []);

  // Function to calculate route and create polylines with progress indication
  const calculateRoute = useCallback((bus: BusPoint) => {
    const busId = bus._id || bus.id;
    if (!busId || !bus.routeEnd || !directionsServiceRef.current) return;

    const busIdStr = String(busId);
    
    // Use current bus location as origin, routeStart as waypoint, routeEnd as destination
    const origin = (typeof bus.lat === 'number' && typeof bus.lng === 'number') 
      ? { lat: bus.lat, lng: bus.lng }
      : bus.routeStart; // Fallback to routeStart if no current location

    if (!origin || !bus.routeStart) return;

    // Create waypoints array with routeStart
    const waypoints = [{
      location: bus.routeStart,
      stopover: true // The bus must stop at the start point
    }];

    directionsServiceRef.current.route(
      {
        origin: origin,
        destination: bus.routeEnd,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        region: 'CR',
        optimizeWaypoints: true, // Optimize for fastest route
        drivingOptions: {
          departureTime: new Date(), // Use current time for traffic
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Create route polylines with progress indication instead of using DirectionsRenderer
          createRoutePolylines(bus, result);
          
          // Extract total duration from all route legs
          if (result.routes?.[0]?.legs) {
            let totalDurationSeconds = 0;
            result.routes[0].legs.forEach(leg => {
              if (leg.duration) {
                totalDurationSeconds += leg.duration.value;
              }
            });
            
            // Convert to minutes and format as text
            const totalMinutes = Math.round(totalDurationSeconds / 60);
            let durationText = '';
            if (totalMinutes < 60) {
              durationText = `${totalMinutes} min`;
            } else {
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              durationText = `${hours} h ${minutes} min`;
            }
            
            console.log(`[BusesMap] Updated duration for bus ${busIdStr}: ${durationText} (${totalDurationSeconds}s total)`);
            onDurationUpdate?.(busIdStr, durationText);
          }
          
          // Add start and end markers
          const existingMarkers = startEndMarkersRef.current.get(busIdStr);
          if (existingMarkers) {
            if (existingMarkers.routeStart) existingMarkers.routeStart.setMap(null);
            existingMarkers.end.setMap(null);
          }
          
          if (result.routes?.[0]?.legs) {
            // Route start marker at conductor's marked point (waypoint) - now green
            const routeStartMarker = new google.maps.Marker({
              position: result.routes[0].legs[0].end_location, // The waypoint location
              map: mapRef.current,
              title: `Punto de inicio - ${bus.busNumber || 'Bus'}`,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#22c55e', // Green for route start point
                fillOpacity: 0.8,
                strokeColor: '#fff',
                strokeWeight: 2,
              },
            });
            
            // End marker at routeEnd
            const endMarker = new google.maps.Marker({
              position: result.routes[0].legs[result.routes[0].legs.length - 1].end_location,
              map: mapRef.current,
              title: bus.routeEnd,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#ef4444', // Red for end
                fillOpacity: 0.8,
                strokeColor: '#fff',
                strokeWeight: 2,
              },
            });
            
            startEndMarkersRef.current.set(busIdStr, { 
              routeStart: routeStartMarker,
              end: endMarker 
            });
          }
        } else if (status !== google.maps.DirectionsStatus.ZERO_RESULTS) {
          console.warn(`Directions request failed for bus ${busId}:`, status);
        }
      }
    );
  }, [onDurationUpdate]);

  // When a bus is selected, center on it
  useEffect(() => {
    if (selectedBusId && selectedBusId !== selectedRef.current) {
      const bus = validBuses.find(b => (b._id || b.id) === selectedBusId);
      if (bus && typeof bus.lat === 'number' && typeof bus.lng === 'number') {
        setCenter({ lat: bus.lat, lng: bus.lng });
        setZoom(16);
        selectedRef.current = selectedBusId;
      }
    }
  }, [selectedBusId, validBuses]);

  const containerStyle = useMemo(() => ({ ...baseContainerStyle, height }), [height]);

  // Get the icon for bus marker (original static icon)
  const busMarkerIcon = useMemo(() => {
    if (!isLoaded) return undefined;
    try {
      return {
        url: '/bus-marker.svg',
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16),
      } as google.maps.Icon;
    } catch {
      return undefined;
    }
  }, [isLoaded]);

  // Initialize DirectionsService
  useEffect(() => {
    if (isLoaded) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
  }, [isLoaded]);

  // Render routes using polylines with progress indication
  useEffect(() => {
    if (!mapRef.current || !directionsServiceRef.current || !isLoaded) return;

    validBuses.forEach((bus) => {
      const busId = bus._id || bus.id;
      if (!busId || !bus.routeEnd) return;

      // Calculate route with polylines
      calculateRoute(bus);
    });

    // Remove polylines and markers for buses that are no longer in the list
    const currentBusIds = new Set(validBuses.map(b => String(b._id || b.id)));
    routePolylinesRef.current.forEach((polylines, busIdStr) => {
      if (!currentBusIds.has(busIdStr)) {
        polylines.completed.setMap(null);
        polylines.pending.setMap(null);
        routePolylinesRef.current.delete(busIdStr);
      }
    });

    // Remove markers for buses that are no longer in the list
    startEndMarkersRef.current.forEach((markers, busIdStr) => {
      if (!currentBusIds.has(busIdStr)) {
        markers.routeStart.setMap(null);
        markers.end.setMap(null);
        startEndMarkersRef.current.delete(busIdStr);
        // Clear duration
        onDurationUpdate?.(busIdStr, '');
      }
    });
  }, [validBuses, isLoaded, calculateRoute, createRoutePolylines]);

  // Set up interval to recalculate routes every 30 seconds for real-time traffic
  useEffect(() => {
    if (!isLoaded) return;

    const updateRoutes = () => {
      validBuses.forEach((bus) => {
        const busId = bus._id || bus.id;
        if (!busId || !bus.routeEnd) return;

        console.log('[BusesMap] Recalculating route for optimal path:', busId);
        calculateRoute(bus);
      });
    };

    // Update routes every 30 seconds for real-time traffic (more frequent than location updates)
    routeUpdateIntervalRef.current = setInterval(updateRoutes, 30000);

    return () => {
      if (routeUpdateIntervalRef.current) {
        clearInterval(routeUpdateIntervalRef.current);
      }
    };
  }, [validBuses, isLoaded, calculateRoute]);

  // Handle map load
  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  return (
    <div className="space-y-2">
      {isLoaded ? (
        <GoogleMap
          onLoad={handleMapLoad}
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          options={{
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            mapTypeControl: false,
          }}
        >
          {/* Render bus markers */}
          {validBuses.map((bus) => {
            const busId = bus._id || bus.id;
            const busColor = bus.routeColor || '#3B82F6';
            console.log('[BusesMap] Bus marker:', { busNumber: bus.busNumber, busColor, routeColor: bus.routeColor });
            
            return (
              <Marker
                key={`bus-${busId}`}
                position={{ lat: bus.lat!, lng: bus.lng! }}
                title={bus.busNumber ? `Bus ${bus.busNumber}` : 'Bus'}
                icon={busMarkerIcon}
                onClick={() => busId && onSelectBus?.(busId)}
                animation={selectedBusId === busId ? google.maps.Animation.DROP : undefined}
                zIndex={selectedBusId === busId ? 999 : 1}
                label={
                  bus.busNumber
                    ? {
                        text: bus.busNumber,
                        color: busColor,
                        fontSize: '14px',
                        fontWeight: 'bold',
                        fontFamily: 'Arial, sans-serif'
                      }
                    : undefined
                }
              />
            );
          })}
        </GoogleMap>
      ) : (
        <div className="w-full bg-gray-100 rounded-xl animate-pulse" style={{ height }} />
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-600 px-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-700" />
          <span>Ruta completada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Ruta pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Punto de inicio</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Destino final</span>
        </div>
      </div>
    </div>
  );
}
