// src/services/routesService.ts

/**
 * Service for Google Routes API integration
 * Uses the Google Routes API to calculate routes between locations
 */

interface Coordinates {
    lat: number;
    lng: number;
  }
  
  interface RouteRequest {
    origin: Coordinates;
    destination: Coordinates;
    travelMode: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT';
    departureTime?: string; // ISO date string
  }
  
  interface RouteResponse {
    distance: {
      meters: number;
      text: string;
    };
    duration: {
      seconds: number;
      text: string;
    };
    polyline: string; // Encoded polyline for the route
  }
  
  export async function calculateRoute({
    origin,
    destination,
    travelMode,
    departureTime
  }: RouteRequest): Promise<RouteResponse> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google Maps API key is missing');
      }
      
      // Convert travelMode to Google's format
      let googleTravelMode = 'WALKING';
      switch (travelMode) {
        case 'DRIVE':
          googleTravelMode = 'DRIVING';
          break;
        case 'WALK':
          googleTravelMode = 'WALKING';
          break;
        case 'BICYCLE':
          googleTravelMode = 'BICYCLE';
          break;
        case 'TRANSIT':
          googleTravelMode = 'TRANSIT';
          break;
      }
      
      // --- Let's double-check the actual API v2 values ---
      // According to docs: DRIVE, BICYCLE, WALK, TRANSIT
      switch (travelMode) {
        case 'DRIVE': googleTravelMode = 'DRIVE'; break;
        case 'WALK': googleTravelMode = 'WALK'; break;
        case 'BICYCLE': googleTravelMode = 'BICYCLE'; break;
        case 'TRANSIT': googleTravelMode = 'TRANSIT'; break;
        // default remains 'WALK' if something unexpected is passed
      }
      
      // Build the request URL
      const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${apiKey}`;

      
      // Build the request body
      const requestBody: any = {
        origin: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng
            }
          }
        },
        travelMode: googleTravelMode,
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false
        },
        languageCode: 'en-US',
        units: 'METRIC'
      };
      
      // Only add routingPreference if DRIVE mode
      if (googleTravelMode === 'DRIVE') {
        requestBody.routingPreference = 'TRAFFIC_AWARE';
      }
      
      // Add departure time if provided
      if (departureTime) {
        requestBody.departureTime = departureTime;
      }
      
      // Make the API request
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Routes API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      // Check if routes were found
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found between the specified locations for the selected travel mode.');
      }
      
      // Extract route information from the response
      const route = data.routes[0];
      
      // Format distance and duration for display
      const distanceMeters = route.distanceMeters;
      const distanceText = distanceMeters < 1000 
        ? `${distanceMeters} m` 
        : `${(distanceMeters / 1000).toFixed(1)} km`;
      
      const durationSeconds = route.duration.match(/(\d+)s/)[1];
      const durationMinutes = Math.ceil(parseInt(durationSeconds) / 60);
      const durationText = durationMinutes < 60 
        ? `${durationMinutes} min` 
        : `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} min`;
      
      return {
        distance: {
          meters: distanceMeters,
          text: distanceText
        },
        duration: {
          seconds: parseInt(durationSeconds),
          text: durationText
        },
        polyline: route.polyline.encodedPolyline
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      // Return a default response if the API fails
      return {
        distance: {
          meters: 0,
          text: 'Unknown'
        },
        duration: {
          seconds: 1800, // Default to 30 minutes
          text: '30 min'
        },
        polyline: ''
      };
    }
  }
  
  // Helper function to calculate travel time between two exhibitions
  export async function calculateTravelTime(
    origin: Coordinates,
    destination: Coordinates,
    mode: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT' = 'TRANSIT'
  ): Promise<{ durationSeconds: number; distanceMeters: number; polyline: string }> {
    try {
      const route = await calculateRoute({
        origin,
        destination,
        travelMode: mode
      });
      
      // Return duration, distance, and polyline
      return {
        durationSeconds: route.duration.seconds,
        distanceMeters: route.distance.meters,
        polyline: route.polyline
      };
    } catch (error) {
      console.error('Error calculating travel time:', error);
      
      // Return default times, zero distance, and empty polyline on error
      let defaultDurationSeconds = 1800; // 30 minutes
      switch (mode) {
        case 'DRIVE': defaultDurationSeconds = 1200; break; // 20 min
        case 'WALK': defaultDurationSeconds = 2700; break; // 45 min
        case 'BICYCLE': defaultDurationSeconds = 2100; break; // 35 min
      }
      return { durationSeconds: defaultDurationSeconds, distanceMeters: 0, polyline: '' };
    }
  }