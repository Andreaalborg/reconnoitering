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
          googleTravelMode = 'BICYCLING';
          break;
        case 'TRANSIT':
          googleTravelMode = 'TRANSIT';
          break;
      }
      
      // Build the request URL
      const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${apiKey}`;

      
      // Build the request body
      const requestBody = {
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
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false
        },
        languageCode: 'en-US',
        units: 'METRIC'
      };
      
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
  ): Promise<number> {
    try {
      const route = await calculateRoute({
        origin,
        destination,
        travelMode: mode
      });
      
      // Return duration in minutes
      return Math.ceil(route.duration.seconds / 60);
    } catch (error) {
      console.error('Error calculating travel time:', error);
      
      // Return default times based on mode
      switch (mode) {
        case 'DRIVE':
          return 20; // 20 minutes default for driving
        case 'WALK':
          return 45; // 45 minutes default for walking
        case 'BICYCLE':
          return 30; // 30 minutes default for bicycling
        case 'TRANSIT':
        default:
          return 30; // 30 minutes default for transit
      }
    }
  }