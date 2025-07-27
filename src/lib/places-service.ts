
'use server';

export interface AutocompletePrediction {
    placeId: string;
    description: string;
}

export interface PlaceDetails {
    name: string;
    address: string;
    location: {
        lat: number;
        lng: number;
    }
}

export async function autocompletePlaces(
  query: string,
  location: { lat: number, lng: number } | null,
): Promise<{ success: boolean; data?: AutocompletePrediction[], error?: string }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Google Maps API key is not configured on the server." };
  }
  
  const url = 'https://places.googleapis.com/v1/places:autocomplete';

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
  };

  const body = JSON.stringify({
    input: query,
    ...(location && {
        locationBias: {
            circle: {
                center: {
                    latitude: location.lat,
                    longitude: location.lng,
                },
                radius: 10000.0, // 10km radius bias
            },
        }
    }),
  });

  try {
    const response = await fetch(url, { method: 'POST', headers, body });
    const data = await response.json();

    if (data.error || !data.suggestions) {
        return { success: false, error: `Places Autocomplete error: ${data.error?.message || 'No results'}` };
    }

    const predictions: AutocompletePrediction[] = data.suggestions.map((prediction: any) => ({
      placeId: prediction.placePrediction.place,
      description: prediction.placePrediction.text.text,
    }));
    
    return { success: true, data: predictions };
  } catch (e) {
    console.error("Error fetching autocomplete places:", e);
    return { success: false, error: 'An unknown error occurred while fetching autocomplete results.' };
  }
}

export async function getPlaceDetails(placeId: string): Promise<{ success: boolean, data?: PlaceDetails, error?: string }> {
     const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return { success: false, error: "Google Maps API key is not configured on the server." };
    }
    
    const url = `https://places.googleapis.com/v1/${placeId}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,formattedAddress,location'
    };
    
    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        if (data.error) {
             return { success: false, error: `Place Details error: ${data.error?.message || 'Not found'}` };
        }
        
        const details: PlaceDetails = {
            name: data.displayName.text,
            address: data.formattedAddress,
            location: {
                lat: data.location.latitude,
                lng: data.location.longitude,
            }
        };
        
        return { success: true, data: details };
    } catch(e) {
        console.error("Error fetching place details:", e);
        return { success: false, error: 'An unknown error occurred while fetching place details.' };
    }
}

    