import axios from 'axios';

/**
 * Calculate route waypoints between two locations using Google Directions API
 * Returns array of {lat, lng} objects representing the optimal route
 */
export async function calculateRoute(startLocationName, endLocationName) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('[routeCalculator] No GOOGLE_MAPS_API_KEY configured, returning empty waypoints');
    return [];
  }

  try {
    console.log('[routeCalculator] Calculating route from:', startLocationName, 'to:', endLocationName);
    
    // Call Google Directions API
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: startLocationName,
        destination: endLocationName,
        key: apiKey,
        mode: 'driving',
        language: 'es',
      },
      timeout: 10000,
    });

    if (response.data.status !== 'OK') {
      console.warn('[routeCalculator] Directions API error:', response.data.status, response.data.error_message);
      return [];
    }

    if (!response.data.routes || response.data.routes.length === 0) {
      console.warn('[routeCalculator] No routes found');
      return [];
    }

    const route = response.data.routes[0];
    const steps = route.legs.flatMap(leg => leg.steps);
    
    // Extract waypoints from route steps
    const waypoints = [];
    
    // Add start point
    const startLeg = route.legs[0];
    if (startLeg) {
      waypoints.push({
        lat: startLeg.start_location.lat,
        lng: startLeg.start_location.lng,
      });
    }

    // Add intermediate points from each step
    for (const step of steps) {
      waypoints.push({
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      });
    }

    console.log('[routeCalculator] Route calculated successfully:', {
      startLocationName,
      endLocationName,
      waypointCount: waypoints.length,
      distance: route.legs[0]?.distance?.text,
      duration: route.legs[0]?.duration?.text,
    });

    return waypoints;
  } catch (error) {
    console.error('[routeCalculator] Error calculating route:', error.message);
    return [];
  }
}

/**
 * Recalculate route if driver deviates too far from original route
 * Returns true if deviation detected, false otherwise
 */
export function isDriverOffRoute(currentLat, currentLng, routeWaypoints, toleranceMeters = 100) {
  if (!routeWaypoints || routeWaypoints.length === 0) {
    return false; // No route to deviate from
  }

  // Simple distance calculation (not perfect but fast)
  // In production, would use actual road distance
  const EARTH_RADIUS_METERS = 6371000;
  
  const minDistance = routeWaypoints.reduce((min, waypoint) => {
    const lat1 = (currentLat * Math.PI) / 180;
    const lat2 = (waypoint.lat * Math.PI) / 180;
    const deltaLat = ((waypoint.lat - currentLat) * Math.PI) / 180;
    const deltaLng = ((waypoint.lng - currentLng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS_METERS * c;

    return Math.min(min, distance);
  }, Infinity);

  return minDistance > toleranceMeters;
}

/**
 * Extract route summary information
 */
export function getRouteSummary(routeWaypoints) {
  if (!routeWaypoints || routeWaypoints.length < 2) {
    return null;
  }

  const startPoint = routeWaypoints[0];
  const endPoint = routeWaypoints[routeWaypoints.length - 1];

  return {
    startPoint,
    endPoint,
    waypointCount: routeWaypoints.length,
    hasRoute: true,
  };
}

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const EARTH_RADIUS_METERS = 6371000;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Check if driver has arrived at the start point (pickup location)
 * Returns true if driver is within 100 meters of the start point
 */
export function hasArrivedAtStart(currentLat, currentLng, routeWaypoints, arrivalRadiusMeters = 100) {
  if (!routeWaypoints || routeWaypoints.length === 0) {
    return false;
  }

  const startPoint = routeWaypoints[0];
  const distance = calculateDistance(currentLat, currentLng, startPoint.lat, startPoint.lng);
  
  return distance <= arrivalRadiusMeters;
}

/**
 * Check if driver is far from start point (more than X meters)
 * Used to determine if we should show "going to pickup" route vs "doing route"
 */
export function isFarFromStart(currentLat, currentLng, routeWaypoints, distanceThresholdMeters = 500) {
  if (!routeWaypoints || routeWaypoints.length === 0) {
    return false;
  }

  const startPoint = routeWaypoints[0];
  const distance = calculateDistance(currentLat, currentLng, startPoint.lat, startPoint.lng);
  
  return distance > distanceThresholdMeters;
}
