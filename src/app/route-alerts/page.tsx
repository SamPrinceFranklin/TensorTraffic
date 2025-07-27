
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapComponent } from '@/components/map';
import { getIncidents } from '@/lib/incidents-service';
import { Incident } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, MapPin, Bot, Volume2, Route, Flag, Pin, AlertTriangle, GitCommitHorizontal, Search, Map as MapIcon } from 'lucide-react';
import { generateRouteAlert, GenerateRouteAlertOutput } from '@/ai/flows/generate-route-alert-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { getDirections } from '@/lib/directions-service';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PlaceDetails } from '@/lib/places-service';
import { PlacesAutocompleteInput } from '@/components/places-autocomplete-input';

type Location = { lat: number; lng: number, address?: string };
type AlertResult = GenerateRouteAlertOutput['detailedAlerts'][0] & { distance?: string };
type NextIncidentInfo = { incident: Incident, distance: string } | null;
type InputMode = 'map' | 'search';


export default function RouteAlertsPage() {
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('map');
  
  const [routePolyline, setRoutePolyline] = useState<string | undefined>(undefined);
  const [junctionCount, setJunctionCount] = useState<number | null>(null);
  const [alertSummary, setAlertSummary] = useState<string | null>(null);
  const [alertDetails, setAlertDetails] = useState<AlertResult[]>([]);
  const [incidentsOnRoute, setIncidentsOnRoute] = useState<Incident[]>([]);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [nextIncidentInfo, setNextIncidentInfo] = useState<NextIncidentInfo>(null);

  const { toast } = useToast();

  useEffect(() => {
    const fetchIncidents = async () => {
      const result = await getIncidents();
      if (result.success && result.data) {
        setAllIncidents(result.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load incidents',
          description: result.error || 'Could not fetch incidents from the server.',
        });
      }
    };
    fetchIncidents();
  }, [toast]);
  
  const mapCenter = useMemo(() => {
    if (startLocation && endLocation) {
      return {
        lat: (startLocation.lat + endLocation.lat) / 2,
        lng: (startLocation.lng + endLocation.lng) / 2,
      };
    }
    return startLocation || endLocation || { lat: 37.7749, lng: -122.4194 };
  }, [startLocation, endLocation]);

  const mapZoom = useMemo(() => {
     if (startLocation && endLocation) return 12;
     return 10;
  }, [startLocation, endLocation])

  const mapPins = useMemo(() => {
    const pins: Incident[] = [...incidentsOnRoute];
    if(startLocation) {
        pins.push({ id: 'start', location: { latitude: startLocation.lat, longitude: startLocation.lng }, category: 'Home', severity: 'Low', summary: startLocation.address || 'Start', timestamp: ''})
    }
    if(endLocation) {
        pins.push({ id: 'end', location: { latitude: endLocation.lat, longitude: endLocation.lng }, category: 'School', severity: 'Low', summary: endLocation.address || "Destination", timestamp: ''})
    }
    return pins;
  }, [startLocation, endLocation, incidentsOnRoute])

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (inputMode !== 'map' || !isMapLoaded) return;
    
    if (e.latLng) {
      const location = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location });
      const address = response.results[0]?.formatted_address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;

      if (selectionMode === 'start') {
        setStartLocation({...location, address});
        setSelectionMode('end');
      } else {
        setEndLocation({...location, address});
      }
    }
  };
  
  const handlePlaceSelect = (place: PlaceDetails, type: 'start' | 'end') => {
      const location = {
          lat: place.location.lat,
          lng: place.location.lng,
          address: place.address,
      };
      if (type === 'start') {
          setStartLocation(location);
      } else {
          setEndLocation(location);
      }
  }

  const resetAnalysis = () => {
      setAlertSummary(null);
      setAlertDetails([]);
      setAudioDataUri(null);
      setRoutePolyline(undefined);
      setIncidentsOnRoute([]);
      setNextIncidentInfo(null);
      setJunctionCount(null);
  }
  
  const isIncidentOnRoute = (incident: Incident, polyline: google.maps.LatLng[], radius: number) => {
      if (!window.google?.maps?.geometry?.poly) {
        return false;
      }
      const incidentLatLng = new google.maps.LatLng(incident.location.latitude, incident.location.longitude);
      return google.maps.geometry.poly.isLocationOnEdge(incidentLatLng, new google.maps.Polyline({ path: polyline }), radius / 100000);
  }

  const handleAnalyzeRoute = async () => {
    if (!startLocation || !endLocation) {
      toast({ variant: "destructive", title: "Please select start and end locations." });
      return;
    }
    
    if (typeof window.google?.maps?.geometry?.poly?.isLocationOnEdge !== 'function') {
        toast({ variant: 'destructive', title: 'Map service not available', description: 'Google Maps libraries are not fully loaded yet. Please try again in a moment.' });
        return;
    }

    setIsAnalyzing(true);
    resetAnalysis();
    
    try {
      const directionsResult = await getDirections(startLocation, endLocation);
      if (!directionsResult.success || !directionsResult.data || directionsResult.data.length === 0) {
        throw new Error(directionsResult.error || 'Could not get directions.');
      }
      const route = directionsResult.data[0];
      setRoutePolyline(route.polyline);
      setJunctionCount(route.junctions);

      const decodedPath = google.maps.geometry.encoding.decodePath(route.polyline);
      const relevantIncidents = allIncidents.filter(incident => 
        isIncidentOnRoute(incident, decodedPath, 300) // 300 meter radius
      );
      setIncidentsOnRoute(relevantIncidents);

      if (relevantIncidents.length === 0) {
        const summaryText = 'No incidents found on your route. Drive safely!';
        setAlertSummary(summaryText);
        const ttsResult = await textToSpeech(summaryText);
        setAudioDataUri(ttsResult.audioDataUri);
        setIsAnalyzing(false);
        return;
      }

      // Find distance to each incident and identify the next one
      let closestIncident: NextIncidentInfo = null;
      if (relevantIncidents.length > 0) {
        const incidentDistances: {incident: Incident, distance: number}[] = [];
        for (const incident of relevantIncidents) {
            const incidentLoc = { lat: incident.location.latitude, lng: incident.location.longitude };
            const distResult = await getDirections(startLocation, incidentLoc);
            if (distResult.success && distResult.data && distResult.data.length > 0) {
                const distanceText = distResult.data[0].distance;
                const distanceInMeters = parseFloat(distanceText.replace(/[^0-9.]/g, '')) * (distanceText.includes('km') ? 1000 : 1);
                incidentDistances.push({incident, distance: distanceInMeters});
            }
        }
        
        if (incidentDistances.length > 0) {
            incidentDistances.sort((a, b) => a.distance - b.distance);
            const nextIncident = incidentDistances[0];
            const distResult = await getDirections(startLocation, {lat: nextIncident.incident.location.latitude, lng: nextIncident.incident.location.longitude});
            if (distResult.success && distResult.data && distResult.data.length > 0){
                closestIncident = { incident: nextIncident.incident, distance: distResult.data[0].distance };
                setNextIncidentInfo(closestIncident);
            }
        }
      }

      const alertResult = await generateRouteAlert({
        incidents: relevantIncidents,
        fromAddress: startLocation.address || 'start point',
        toAddress: endLocation.address || 'end point',
        nextIncidentDistance: closestIncident?.distance
      });

      setAlertSummary(alertResult.alertSummary);
      setAlertDetails(alertResult.detailedAlerts);
      
      const ttsResult = await textToSpeech(alertResult.alertSummary);
      setAudioDataUri(ttsResult.audioDataUri);

    } catch (e: any) {
        console.error("Error analyzing route: ", e);
        toast({ variant: "destructive", title: "Failed to Analyze Route", description: e.message });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const playAudio = () => {
      if (audioDataUri) {
          const audio = new Audio(audioDataUri);
          audio.play();
      }
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary flex items-center justify-center gap-3">
            <Route className="w-12 h-12" /> Pre-Departure Safety Check
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Get AI-powered alerts for your route before you leave.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Input Method</CardTitle>
                        <CardDescription>How would you like to select locations?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ToggleGroup type="single" variant="outline" value={inputMode} onValueChange={(value) => { if (value) setInputMode(value as InputMode)}} className="w-full">
                            <ToggleGroupItem value="map" className="w-1/2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                <MapIcon className="w-4 h-4 mr-2" /> Manual (Map)
                            </ToggleGroupItem>
                            <ToggleGroupItem value="search" className="w-1/2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                <Search className="w-4 h-4 mr-2" /> Search
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Select Locations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {inputMode === 'map' ? (
                            <>
                                <div className="flex items-start gap-3">
                                    <Flag className="w-5 h-5 text-green-500 mt-1" />
                                    <div>
                                        <p className="font-semibold">Start Point</p>
                                        <p className="text-sm text-muted-foreground">{startLocation?.address || "Click map to select"}</p>
                                    </div>
                                </div>
                                 <div className="flex items-start gap-3">
                                    <Pin className="w-5 h-5 text-red-500 mt-1" />
                                    <div>
                                        <p className="font-semibold">Destination</p>
                                        <p className="text-sm text-muted-foreground">{endLocation?.address || "Click map to select"}</p>
                                    </div>
                                </div>
                                <ToggleGroup type="single" value={selectionMode} onValueChange={(value) => { if (value) setSelectionMode(value as 'start' | 'end')}} className="w-full">
                                    <ToggleGroupItem value="start" className="w-1/2" variant="outline" disabled={inputMode !== 'map'}>
                                        <Flag className="w-4 h-4 mr-2" /> Set Start
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="end" className="w-1/2" variant="outline" disabled={inputMode !== 'map'}>
                                        <Pin className="w-4 h-4 mr-2" /> Set End
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </>
                        ) : (
                            <>
                                <PlacesAutocompleteInput 
                                    label="Start Point"
                                    onPlaceSelect={(place) => handlePlaceSelect(place, 'start')}
                                    icon={Flag}
                                    initialValue={startLocation?.address}
                                />
                                <PlacesAutocompleteInput 
                                    label="Destination"
                                    onPlaceSelect={(place) => handlePlaceSelect(place, 'end')}
                                    icon={Pin}
                                    initialValue={endLocation?.address}
                                />
                            </>
                        )}
                        
                    </CardContent>
                </Card>

                <Button onClick={handleAnalyzeRoute} disabled={isAnalyzing || !startLocation || !endLocation || !isMapLoaded} className="w-full text-lg py-6">
                    {isAnalyzing ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Analyzing...</> : "3. Analyze Route"}
                </Button>
            </div>
          <div className="md:col-span-2 space-y-6">
            <Card className="h-[450px]">
              <MapComponent
                incidents={mapPins}
                onPinClick={() => {}}
                onMapLoad={setIsMapLoaded}
                onMapClick={handleMapClick}
                center={mapCenter}
                zoom={mapZoom}
                routePolyline={routePolyline}
              />
            </Card>
            
            {alertSummary && (
                <Card className="animate-in fade-in-50">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg">
                            <div className='flex items-center gap-2'><Bot className="w-5 h-5 text-primary" />AI Summary</div>
                             {audioDataUri && (
                                <Button variant="ghost" size="icon" onClick={playAudio}>
                                    <Volume2 className="w-5 h-5" />
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{alertSummary}</p>
                    </CardContent>
                </Card>
            )}

            {junctionCount !== null && (
                 <Card className="animate-in fade-in-50">
                    <CardHeader>
                         <CardTitle className="flex items-center gap-3 text-lg">
                             <GitCommitHorizontal className="w-5 h-5 text-primary" />
                             Route Complexity
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-muted-foreground">
                            There are an estimated <span className='font-bold text-primary'>{junctionCount}</span> junctions and crossings on this route.
                         </p>
                    </CardContent>
                 </Card>
            )}

            {nextIncidentInfo && (
              <Card className="animate-in fade-in-50 border-primary">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-lg text-primary">
                          <AlertTriangle className="w-5 h-5" />
                          Next Incident Ahead
                      </CardTitle>
                      <CardDescription>
                          The next reported issue on your route is approximately <span className='font-bold text-primary'>{nextIncidentInfo.distance}</span> away.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                       <div className='flex justify-between items-start'>
                          <div>
                            <p className="font-semibold text-base">{nextIncidentInfo.incident.category}</p>
                            <p className="text-sm text-muted-foreground mt-1">{nextIncidentInfo.incident.summary}</p>
                          </div>
                          <Badge variant="outline">{nextIncidentInfo.incident.severity} Severity</Badge>
                       </div>
                  </CardContent>
              </Card>
            )}

            {alertDetails.length > 0 && (
                <div className='mt-4 space-y-3'>
                    <h3 className='font-semibold'>All Incidents on Route ({alertDetails.length})</h3>
                    {alertDetails.map(alert => (
                         <Card key={alert.incidentId} className='bg-muted/50'>
                            <CardContent className='pt-4'>
                                 <div className='flex justify-between items-start'>
                                    <p className="font-semibold text-base">{alert.category}</p>
                                    <Badge variant="outline">{alert.severity} Severity</Badge>
                                 </div>
                                 <p className="text-sm text-muted-foreground mt-1">{alert.summary}</p>
                            </CardContent>
                         </Card>
                    ))}
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
