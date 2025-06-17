import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Mangler koordinater' }, { status: 400 });
  }

  try {
    // Bruk Google Maps Geocoding API via HTTP request
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results[0]) {
      const firstResult = data.results[0];
      const addressComponents = firstResult.address_components || [];
      
      // Hjelpefunksjon for å hente adressekomponent
      const getAddressComponent = (type: string) => {
        const component = addressComponents.find((component: any) =>
          component.types.includes(type)
        );
        return component ? component.long_name : '';
      };
      
      // Finn city, country osv.
      const country = getAddressComponent('country');
      // Prøv først locality, deretter administrative_area_level_1, og til slutt administrative_area_level_2
      const city = getAddressComponent('locality') || 
                  getAddressComponent('administrative_area_level_1') || 
                  getAddressComponent('administrative_area_level_2') ||
                  getAddressComponent('sublocality_level_1') ||
                  getAddressComponent('sublocality');
      const street = getAddressComponent('route');
      const streetNumber = getAddressComponent('street_number');
      const postalCode = getAddressComponent('postal_code');
      const address = street && streetNumber ? `${street} ${streetNumber}` : firstResult.formatted_address;

      return NextResponse.json({
        address,
        city,
        country,
        postalCode
      });
    } else {
      console.error('Geocoding API error:', data.status, data.error_message);
      return NextResponse.json({ error: 'Kunne ikke utføre geocoding', details: data.status }, { status: 500 });
    }
  } catch (error) {
    console.error('Error with geocoding:', error);
    return NextResponse.json({ error: 'Kunne ikke utføre geocoding' }, { status: 500 });
  }
} 