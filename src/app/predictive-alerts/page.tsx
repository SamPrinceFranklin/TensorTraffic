
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapComponent } from '@/components/map';
import { getIncidents } from '@/lib/incidents-service';
import { Incident } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, MapPin, AlertOctagon, Wand2, LocateFixed, Zap, ShieldAlert, AlertTriangle, ChevronsRight } from 'lucide-react';
import { predictiveAnalysis, PredictiveAnalysisOutput } from '@/ai/flows/predictive-analysis-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { analyzeSingleIncidentImpact } from '@/ai/flows/analyze-single-incident-impact-flow';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Haversine formula to calculate distance between two lat/lng points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    0.5 - Math.cos(dLat) / 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    (1 - Math.cos(dLon)) / 2;
  return R * 2 * Math.asin(Math.sqrt(a));
};

export default function PredictiveAlertsPage() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PredictiveAnalysisOutput | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isSingleIncidentAnalyzing, setIsSingleIncidentAnalyzing] = useState(false);
  const [singleIncidentAnalysis, setSingleIncidentAnalysis] = useState<string | null>(null);

  const { toast } = useToast();

  const RADIUS_KM = 3;

  const getLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({ variant: 'destructive', title: 'Could not get your location.' });
          setIsLocating(false);
        }
      );
    } else {
        setIsLocating(false);
        toast({ variant: 'destructive', title: 'Geolocation is not supported.' });
    }
  }

  useEffect(() => {
    getLocation();
    
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

  useEffect(() => {
    if (location && allIncidents.length > 0) {
      const nearby = allIncidents.filter(incident => 
        getDistance(location.latitude, location.longitude, incident.location.latitude, incident.location.longitude) <= RADIUS_KM
      );
      setNearbyIncidents(nearby);
    }
  }, [location, allIncidents]);
  
  const userLocationPin = useMemo(() => {
    if (!location) return [];
    return [{
        id: 'user-location',
        location: { latitude: location.latitude, longitude: location.longitude },
        category: 'Home',
        severity: 'Low',
        summary: 'Your Location',
        timestamp: new Date().toISOString()
    }]
  }, [location]);

  const handlePredictiveAnalysis = async () => {
    if (!location || nearbyIncidents.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Not enough data',
        description: 'Cannot perform analysis without location or nearby incidents.',
      });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await predictiveAnalysis({
        userLocation: { latitude: location.latitude, longitude: location.longitude },
        incidents: nearbyIncidents,
      });
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not generate predictive analysis. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handlePinClick = async (incident: Incident) => {
      if (!location) return;
      setSelectedIncident(incident);
      setIsSingleIncidentAnalyzing(true);
      setSingleIncidentAnalysis(null);
      try {
          const result = await analyzeSingleIncidentImpact({
              userLocation: { latitude: location.latitude, longitude: location.longitude },
              incident: incident,
          });
          setSingleIncidentAnalysis(result.impactAnalysis);
      } catch (e) {
          console.error(e);
          toast({
              variant: 'destructive',
              title: 'Analysis Failed',
              description: 'Could not analyze this specific incident. Please try again.',
          });
          setSelectedIncident(null); // Close dialog on error
      } finally {
          setIsSingleIncidentAnalyzing(false);
      }
  }
  
  const AnalysisSection = ({ title, items, icon: Icon, colorClass }: { title: string, items: string[], icon: React.ElementType, colorClass: string }) => (
    <div>
        <h3 className={`font-headline text-lg flex items-center gap-2 mb-2 ${colorClass}`}>
            <Icon className="w-5 h-5" />
            {title}
        </h3>
        <Card className='bg-muted/50'>
            <CardContent className='pt-4'>
                <ul className="space-y-2">
                    {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronsRight className='w-4 h-4 mt-0.5 shrink-0 text-primary/50' />
                        <span>{item}</span>
                    </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Predictive Alerts</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Analyze incidents in your area to predict potential issues and plan your route.
          </p>
        </header>
        
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Your Location
                </CardTitle>
                <CardDescription>
                    Incidents are filtered within a {RADIUS_KM}km radius of this point. Click an incident on the map for a detailed impact analysis.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLocating ? (
                     <div className='flex items-center gap-2 text-muted-foreground'>
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                        <p>Getting your current location...</p>
                    </div>
                ) : location ? (
                    <div className="flex items-center justify-between">
                        <p className='text-muted-foreground text-sm font-mono'>
                           Lat: {location.latitude.toFixed(5)}, Lng: {location.longitude.toFixed(5)}
                       </p>
                       <Button variant="outline" size="sm" onClick={getLocation}>
                            <LocateFixed className="w-4 h-4 mr-2" />
                            Refresh Location
                       </Button>
                    </div>
                ) : (
                    <p className='text-destructive'>Location could not be determined.</p>
                )}
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-destructive" />
                        Nearby Incidents ({nearbyIncidents.length})
                    </CardTitle>
                    <CardDescription>
                       These are the incidents reported within {RADIUS_KM}km of you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                    {nearbyIncidents.length > 0 ? (
                        <ul className="space-y-4">
                            {nearbyIncidents.map(incident => (
                                <li key={incident.id} className="p-3 bg-muted rounded-md">
                                    <p className="font-semibold">{incident.category} <span className="text-xs font-normal text-muted-foreground">({incident.severity} severity)</span></p>
                                    <p className="text-sm text-muted-foreground">{incident.summary}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">
                            No incidents reported in your immediate area.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Button onClick={handlePredictiveAnalysis} disabled={isAnalyzing || nearbyIncidents.length === 0} className="w-full text-lg py-6">
              {isAnalyzing ? (
                <>
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Potential Issues...
                </>
              ) : (
                 <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Run Predictive Analysis
                 </>
              )}
            </Button>
            
            {analysisResult && (
                <Card className="animate-in fade-in-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-primary" />
                            AI-Powered Prediction
                        </CardTitle>
                        <CardDescription>{analysisResult.introduction}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <AnalysisSection 
                            title="Immediate Consequences" 
                            items={analysisResult.immediateConsequences}
                            icon={AlertTriangle}
                            colorClass='text-destructive'
                        />
                         <AnalysisSection 
                            title="Secondary Effects (Predictions)" 
                            items={analysisResult.secondaryEffects}
                            icon={Zap}
                            colorClass='text-yellow-600'
                        />
                         <AnalysisSection 
                            title="Safety Advice" 
                            items={analysisResult.safetyAdvice}
                            icon={ShieldAlert}
                            colorClass='text-green-600'
                        />
                    </CardContent>
                </Card>
            )}
          </div>
          <div className="h-[600px]">
             {location && (
                <MapComponent
                    incidents={[...nearbyIncidents, ...userLocationPin]}
                    onPinClick={handlePinClick}
                    center={{ lat: location.latitude, lng: location.longitude }}
                    zoom={13}
                    showTraffic
                />
             )}
          </div>
        </div>

        <Dialog open={!!selectedIncident} onOpenChange={(isOpen) => !isOpen && setSelectedIncident(null)}>
            <DialogContent className="sm:max-w-2xl">
                {selectedIncident && (
                    <>
                        <DialogHeader>
                            <DialogTitle className='font-headline text-2xl flex items-center gap-3'>
                                <Zap className='w-6 h-6 text-primary' />
                                Incident Impact Analysis
                            </DialogTitle>
                             <DialogDescription>
                                AI-powered analysis and live traffic for the selected incident.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className='h-64 w-full rounded-lg overflow-hidden border'>
                                <MapComponent
                                    incidents={[selectedIncident]}
                                    onPinClick={()=>{}}
                                    center={{lat: selectedIncident.location.latitude, lng: selectedIncident.location.longitude}}
                                    zoom={15}
                                    showTraffic
                                />
                            </div>
                            <div>
                                <h4 className='font-semibold mb-2 text-lg'>Incident Details</h4>
                                <Card className='bg-muted/50'>
                                    <CardContent className='pt-6'>
                                        <div className='font-bold text-base'>{selectedIncident.category} (<Badge variant="outline">{selectedIncident.severity} Severity</Badge>)</div>
                                        <p className='text-sm text-muted-foreground mt-1'>{selectedIncident.summary}</p>
                                        <p className='text-xs text-muted-foreground mt-2'>{format(new Date(selectedIncident.timestamp), 'PPpp')}</p>
                                    </CardContent>
                                </Card>
                            </div>
                           
                           {isSingleIncidentAnalyzing ? (
                               <div className='flex items-center gap-2 text-muted-foreground justify-center py-8'>
                                   <LoaderCircle className='w-5 h-5 animate-spin' />
                                   <p>Analyzing impact...</p>
                               </div>
                           ) : singleIncidentAnalysis ? (
                               <div>
                                   <h4 className='font-semibold mb-2 text-lg'>Predicted Impact</h4>
                                   <p className="whitespace-pre-wrap text-sm text-foreground bg-muted/50 p-4 rounded-md">{singleIncidentAnalysis}</p>
                               </div>
                           ) : (
                               <p className='text-destructive text-sm text-center py-8'>Could not load analysis.</p>
                           )}

                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

    

    
