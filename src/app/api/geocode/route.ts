import { NextResponse } from 'next/server';
import { Loader } from '@googlemaps/js-api-loader';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Mangler koordinater' }, { status: 400 });
  }

  try {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places', 'geometry', 'geocoding']
    });

    const google = await loader.load();
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode({ location: { lat: parseFloat(lat), lng: parseFloat(lng) } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const firstResult = results[0];
          const addressComponents = firstResult.address_components || [];
          
          // Hjelpefunksjon for å hente adressekomponent
          const getAddressComponent = (type: string) => {
            const component = addressComponents.find(component =>
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
          const address = street && streetNumber ? `${street} ${streetNumber}` : firstResult.formatted_address;

          resolve(NextResponse.json({
            address,
            city,
            country
          }));
        } else {
          resolve(NextResponse.json({ error: 'Kunne ikke utføre geocoding' }, { status: 500 }));
        }
      });
    });
  } catch (error) {
    console.error('Error with geocoding:', error);
    return NextResponse.json({ error: 'Kunne ikke utføre geocoding' }, { status: 500 });
  }
} 