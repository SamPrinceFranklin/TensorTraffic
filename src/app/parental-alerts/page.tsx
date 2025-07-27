
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapComponent } from '@/components/map';
import { LoaderCircle, School, MapPin, Home, AlertTriangle, ShieldAlert, Siren, Bot, Volume2, Route, Flag, Pin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDirections } from '@/lib/directions-service';
import { savePoliceAlert } from '@/lib/police-alert-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlacesAutocompleteInput } from '@/components/places-autocomplete-input';
import { PlaceDetails } from '@/lib/places-service';
import { Incident } from '@/lib/types';
import { getIncidents } from '@/lib/incidents-service';
import { generateRouteAlert, GenerateRouteAlertOutput } from '@/ai/flows/generate-route-alert-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { Badge } from '@/components/ui/badge';

type Location = { lat: number; lng: number, address: string };

const alertFormSchema = z.object({
  childName: z.string().min(1, { message: "Child's name is required." }),
  schoolName: z.string().min(1, { message: "School's name is required." }),
  overdueDuration: z.string().min(1, { message: "This field is required." }),
  timeLeftSchool: z.string().min(1, { message: "This field is required." }),
  schoolContact: z.string().min(1, { message: "School contact info is required." }),
});

export default function ParentalAlertsPage() {
  const [homeLocation, setHomeLocation] = useState<Location | null>(null);
  const [schoolLocation, setSchoolLocation] = useState<Location | null>(null);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [incidentsOnRoute, setIncidentsOnRoute] = useState<Incident[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [routePolyline, setRoutePolyline] = useState<string | undefined>(undefined);
  const [alertSummary, setAlertSummary] = useState<string | null>(null);
  const [alertDetails, setAlertDetails] = useState<GenerateRouteAlertOutput['detailedAlerts']>([]);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);

  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<z.infer<typeof alertFormSchema>>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: { childName: '', schoolName: '', overdueDuration: '', timeLeftSchool: '', schoolContact: '' },
  });

   useEffect(() => {
    const fetchIncidents = async () => {
      const result = await getIncidents();
      if (result.success && result.data) {
        setAllIncidents(result.data);
      }
    };
    fetchIncidents();
  }, []);

  const handlePlaceSelect = (place: PlaceDetails, type: 'start' | 'end') => {
      const location = { lat: place.location.lat, lng: place.location.lng, address: place.address };
      if (type === 'start') setHomeLocation(location);
      else setSchoolLocation(location);
  };
  
  const isIncidentOnRoute = (incident: Incident, polyline: google.maps.LatLng[], radius: number) => {
      if (!window.google?.maps?.geometry?.poly) return false;
      const incidentLatLng = new google.maps.LatLng(incident.location.latitude, incident.location.longitude);
      return google.maps.geometry.poly.isLocationOnEdge(incidentLatLng, new google.maps.Polyline({ path: polyline }), radius / 100000);
  }

  const handleAnalyzeRoute = async () => {
    if (!homeLocation || !schoolLocation) {
      toast({ variant: "destructive", title: "Please select start and end locations." });
      return;
    }
    
    setIsAnalyzing(true);
    setRoutePolyline(undefined);
    setIncidentsOnRoute([]);
    setAlertSummary(null);
    setAlertDetails([]);
    setAudioDataUri(null);

    try {
        const directionsResult = await getDirections(homeLocation, schoolLocation);
        if (!directionsResult.success || !directionsResult.data) {
            throw new Error(directionsResult.error || 'Could not get directions.');
        }
        const route = directionsResult.data[0];
        setRoutePolyline(route.polyline);
        
        const decodedPath = google.maps.geometry.encoding.decodePath(route.polyline);
        const relevantIncidents = allIncidents.filter(incident => 
            isIncidentOnRoute(incident, decodedPath, 300) // 300 meter radius
        );
        setIncidentsOnRoute(relevantIncidents);

        const alertResult = await generateRouteAlert({
            incidents: relevantIncidents,
            fromAddress: homeLocation.address,
            toAddress: schoolLocation.address,
        });
        setAlertSummary(alertResult.alertSummary);
        setAlertDetails(alertResult.detailedAlerts);
        
        if (alertResult.alertSummary) {
            const ttsResult = await textToSpeech(alertResult.alertSummary);
            setAudioDataUri(ttsResult.audioDataUri);
        }

    } catch(e: any) {
        toast({ variant: "destructive", title: "Route Analysis Failed", description: e.message });
    } finally {
        setIsAnalyzing(false);
    }
  }

  const mapCenter = useMemo(() => {
    if (homeLocation && schoolLocation) return { lat: (homeLocation.lat + schoolLocation.lat) / 2, lng: (homeLocation.lng + schoolLocation.lng) / 2 };
    return homeLocation || schoolLocation || { lat: 37.7749, lng: -122.4194 };
  }, [homeLocation, schoolLocation]);
  
  const mapZoom = useMemo(() => (homeLocation && schoolLocation ? 12 : 10), [homeLocation, schoolLocation]);

  const mapPins = useMemo(() => {
    const pins: Incident[] = [...incidentsOnRoute];
    if(homeLocation) pins.push({ id: 'home', location: { latitude: homeLocation.lat, longitude: homeLocation.lng }, category: 'Home', severity: 'Low', summary: homeLocation.address, timestamp: ''})
    if(schoolLocation) pins.push({ id: 'school', location: { latitude: schoolLocation.lat, longitude: schoolLocation.lng }, category: 'School', severity: 'Low', summary: schoolLocation.address, timestamp: ''})
    return pins;
  }, [homeLocation, schoolLocation, incidentsOnRoute]);

  async function onAlertSubmit(values: z.infer<typeof alertFormSchema>) {
    if (!homeLocation || !schoolLocation) {
        toast({ variant: 'destructive', title: 'Start and End locations are required.'});
        return;
    }
    setIsSubmittingAlert(true);
    try {
        const result = await savePoliceAlert({ ...values, homeLocation, schoolLocation });
        if (result.success) {
          toast({ title: 'Police Alert Sent', description: `Your report has been filed with ID: ${result.id}` });
          setIsAlertDialogOpen(false);
          form.reset();
        } else {
          toast({ variant: 'destructive', title: 'Failed to Send Alert', description: result.error });
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'An error occurred', description: e.message });
    } finally {
        setIsSubmittingAlert(false);
    }
  }

  const playAudio = () => {
    if (audioDataUri) new Audio(audioDataUri).play();
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Parental Alerts</h1>
          <p className="mt-4 text-lg text-muted-foreground">Check the route to school for any reported incidents.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Route Planner</CardTitle>
                    <CardDescription>Enter start and destination to check for hazards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <PlacesAutocompleteInput label="Start Location (Home)" onPlaceSelect={(p) => handlePlaceSelect(p, 'start')} icon={Home} />
                    <PlacesAutocompleteInput label="Destination (School)" onPlaceSelect={(p) => handlePlaceSelect(p, 'end')} icon={School} />
                     <Button onClick={handleAnalyzeRoute} disabled={isAnalyzing || !homeLocation || !schoolLocation || !isMapLoaded} className="w-full">
                        {isAnalyzing ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : <><Route className="mr-2 h-4 w-4" />Analyze Route</>}
                    </Button>
                </CardContent>
             </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><Siren className="w-5 h-5"/> Emergency Alert</CardTitle>
                <CardDescription>Only use this in a genuine emergency to alert authorities.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className='w-full' disabled={!homeLocation || !schoolLocation}>Alert Authorities</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Emergency Alert Details</DialogTitle>
                            <DialogDescription>Provide the following information to be sent to the authorities.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onAlertSubmit)} className="space-y-4">
                              <FormField control={form.control} name="childName" render={({ field }) => ( <FormItem><FormLabel>Child's Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                              <FormField control={form.control} name="schoolName" render={({ field }) => ( <FormItem><FormLabel>School's Name</FormLabel><FormControl><Input placeholder="e.g., Springfield Elementary" {...field} /></FormControl><FormMessage /></FormItem> )} />
                              <div className="grid grid-cols-2 gap-4">
                                  <FormField control={form.control} name="overdueDuration" render={({ field }) => ( <FormItem><FormLabel>Time Overdue</FormLabel><FormControl><Input placeholder="e.g., 30 minutes" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                  <FormField control={form.control} name="timeLeftSchool" render={({ field }) => ( <FormItem><FormLabel>Time Left School</FormLabel><FormControl><Input placeholder="e.g., 3:30 PM" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              </div>
                              <FormField control={form.control} name="schoolContact" render={({ field }) => ( <FormItem><FormLabel>School Contact Info (Phone/Email)</FormLabel><FormControl><Input placeholder="e.g., 555-123-4567" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <DialogFooter>
                                  <Button type="submit" variant="destructive" disabled={isSubmittingAlert} className='w-full'>
                                    {isSubmittingAlert ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Alert to Authorities"}
                                  </Button>
                              </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-6">
            <Card className="h-[450px]">
                 <MapComponent
                    incidents={mapPins}
                    onPinClick={() => {}}
                    onMapLoad={setIsMapLoaded}
                    center={mapCenter}
                    zoom={mapZoom}
                    routePolyline={routePolyline}
                  />
            </Card>
            {isAnalyzing && (
                 <Card className="flex items-center justify-center p-8">
                    <LoaderCircle className="w-8 h-8 animate-spin text-primary mr-4" />
                    <p className="text-muted-foreground">Analyzing route for incidents...</p>
                 </Card>
            )}
            {alertSummary && (
                <Card className="animate-in fade-in-50">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg">
                            <div className='flex items-center gap-2'><Bot className="w-5 h-5 text-primary" />AI Route Summary</div>
                             {audioDataUri && (
                                <Button variant="ghost" size="icon" onClick={playAudio}><Volume2 className="w-5 h-5" /></Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{alertSummary}</p>
                    </CardContent>
                </Card>
            )}
             {alertDetails.length > 0 && (
                <div className='space-y-3'>
                    <h3 className='font-semibold'>Incidents on Route ({alertDetails.length})</h3>
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
