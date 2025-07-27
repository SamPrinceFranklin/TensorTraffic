
'use server';

export interface DirectionDetails {
    distance: string;
    duration: string;
    durationInTraffic: string;
    summary: string;
    polyline: string;
    trafficStatus: 'light' | 'moderate' | 'heavy';
    bounds: {
        northeast: { lat: number, lng: number };
        southwest: { lat: number, lng: number };
    },
    junctions: number;
}

function getTrafficStatus(duration: number, durationInTraffic: number): 'light' | 'moderate' | 'heavy' {
    const ratio = durationInTraffic / duration;
    if (ratio < 1.2) return 'light';
    if (ratio < 1.6) return 'moderate';
    return 'heavy';
}

function countJunctions(steps: any[]): number {
    if (!steps) return 0;
    
    const junctionManeuvers = [
        'turn-sharp-left',
        'turn-sharp-right',
        'turn-slight-left',
        'turn-slight-right',
        'turn-left',
        'turn-right',
        'roundabout-left',
        'roundabout-right',
        'fork-left',
        'fork-right',
    ];

    return steps.reduce((count, step) => {
        if (step.maneuver && junctionManeuvers.includes(step.maneuver)) {
            return count + 1;
        }
        return count;
    }, 0);
}

export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ success: boolean; data?: DirectionDetails[], error?: string; }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Google Maps API key is not configured on the server." };
  }

  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.append('origin', `${origin.lat},${origin.lng}`);
  url.searchParams.append('destination', `${destination.lat},${destination.lng}`);
  url.searchParams.append('key', apiKey);
  url.searchParams.append('departure_time', 'now');
  url.searchParams.append('alternatives', 'true');

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      return { success: false, error: `Directions API error: ${data.status} - ${data.error_message || 'No routes found.'}` };
    }

    const allRoutesDetails: DirectionDetails[] = data.routes.map((route: any) => {
        const leg = route.legs[0];
        
        if (!leg.distance || !leg.duration || !leg.duration_in_traffic) {
            // This will be caught by the filter below
            return null;
        }
        
        const trafficStatus = getTrafficStatus(leg.duration.value, leg.duration_in_traffic.value);
        const junctionCount = countJunctions(leg.steps);

        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
          durationInTraffic: leg.duration_in_traffic.text,
          summary: route.summary,
          polyline: route.overview_polyline.points,
          trafficStatus,
          bounds: {
            northeast: route.bounds.northeast,
            southwest: route.bounds.southwest
          },
          junctions: junctionCount,
        };
    }).filter((details: DirectionDetails | null): details is DirectionDetails => details !== null);

    if (allRoutesDetails.length === 0) {
        return { success: false, error: 'Directions response missing required fields for all routes.' };
    }

    return { success: true, data: allRoutesDetails };
  } catch (e) {
    console.error("Error fetching directions:", e);
    return { success: false, error: 'An unknown error occurred while fetching directions.' };
  }
}
